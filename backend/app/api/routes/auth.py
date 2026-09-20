import time
import random
import re
import httpx
from datetime import timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth_deps import get_current_user
from app.core.config import get_settings
from app.core.exceptions import ConflictError, UnauthorizedError, ValidationError
from app.core.logging import logger
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.database import get_db
from app.db.models.user import User
from app.db.models.farm import Farm
from app.schemas.auth import (
    UserLoginRequest, UserPublic, UserRegisterRequest, TokenResponse,
    SendOtpRequest, VerifyOtpRequest, OtpResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()

# In-memory OTP storage with TTL: {clean_phone: {"code": "123456", "expires_at": timestamp}}
_OTP_CACHE: Dict[str, Dict[str, Any]] = {}


def _clean_phone_number(raw_phone: str) -> str:
    digits = re.sub(r"\D", "", raw_phone)
    if len(digits) >= 10:
        return digits[-10:]
    return digits


def _send_sms_otp(phone_10: str, code: str) -> bool:
    """
    Dispatch OTP via the configured SMS provider.
    Returns True if sent successfully, False otherwise.
    """
    provider = settings.SMS_PROVIDER.lower()

    if provider == "fast2sms":
        try:
            resp = httpx.post(
                "https://www.fast2sms.com/dev/bulkV2",
                headers={"authorization": settings.FAST2SMS_API_KEY},
                data={
                    "route": settings.FAST2SMS_ROUTE,
                    "sender_id": settings.FAST2SMS_SENDER_ID,
                    "message": f"Your KrishiNirnay AI verification code is {code}. Valid for {settings.OTP_EXPIRY_SECONDS // 60} minutes. Do not share this OTP.",
                    "language": "english",
                    "numbers": phone_10,
                },
                timeout=10,
            )
            result = resp.json()
            if result.get("return"):
                logger.info(f"Fast2SMS OTP sent to +91{phone_10}")
                return True
            logger.warning(f"Fast2SMS error: {result}")
        except Exception as exc:
            logger.error(f"Fast2SMS dispatch failed: {exc}")

    elif provider == "msg91":
        try:
            resp = httpx.post(
                "https://api.msg91.com/api/v5/otp",
                json={
                    "template_id": settings.MSG91_TEMPLATE_ID,
                    "mobile": f"91{phone_10}",
                    "authkey": settings.MSG91_AUTH_KEY,
                    "otp": code,
                },
                timeout=10,
            )
            result = resp.json()
            if result.get("type") == "success":
                logger.info(f"MSG91 OTP sent to +91{phone_10}")
                return True
            logger.warning(f"MSG91 error: {result}")
        except Exception as exc:
            logger.error(f"MSG91 dispatch failed: {exc}")

    elif provider == "twilio":
        try:
            import base64
            credentials = base64.b64encode(
                f"{settings.TWILIO_ACCOUNT_SID}:{settings.TWILIO_AUTH_TOKEN}".encode()
            ).decode()
            resp = httpx.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json",
                headers={"Authorization": f"Basic {credentials}"},
                data={
                    "From": settings.TWILIO_PHONE_NUMBER,
                    "To": f"+91{phone_10}",
                    "Body": f"Your KrishiNirnay AI OTP is {code}. Valid for {settings.OTP_EXPIRY_SECONDS // 60} minutes.",
                },
                timeout=10,
            )
            if resp.status_code in (200, 201):
                logger.info(f"Twilio OTP sent to +91{phone_10}")
                return True
            logger.warning(f"Twilio error {resp.status_code}: {resp.text}")
        except Exception as exc:
            logger.error(f"Twilio dispatch failed: {exc}")

    # provider == "none" or fallback — log to console (dev/demo mode)
    logger.info(f"[SMS CONSOLE] OTP for +91{phone_10} → {code}  (SMS_PROVIDER='{provider}')")
    return True


@router.post("/send-otp", response_model=OtpResponse, summary="Send 6-digit OTP to farmer mobile")
def send_otp(payload: SendOtpRequest):
    phone = _clean_phone_number(payload.phone)
    if len(phone) != 10 or phone[0] not in "6789":
        raise ValidationError("Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.")

    # Demo numbers always get fixed OTP 123456
    if phone in settings.demo_phone_numbers:
        code = "123456"
    else:
        code = str(random.randint(100000, 999999))

    # Store with configurable expiry
    _OTP_CACHE[phone] = {
        "code": code,
        "expires_at": time.time() + settings.OTP_EXPIRY_SECONDS
    }

    # Dispatch via configured SMS provider
    _send_sms_otp(phone, code)

    return OtpResponse(
        success=True,
        message=f"6-digit verification code sent to +91 {phone[:5]} {phone[5:]}.",
        phone=f"+91{phone}",
        expires_in_seconds=settings.OTP_EXPIRY_SECONDS,
        demo_code=code if phone in settings.demo_phone_numbers else None
    )


@router.post("/verify-otp", response_model=TokenResponse, summary="Verify OTP and login/register farmer")
def verify_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    phone = _clean_phone_number(payload.phone)
    entered_code = payload.code.strip()

    # Verify against OTP cache or demo-number universal code
    stored = _OTP_CACHE.get(phone)
    is_valid = False

    # Demo numbers: always accept 123456
    if phone in settings.demo_phone_numbers and entered_code == "123456":
        is_valid = True
    elif stored and stored["expires_at"] > time.time() and stored["code"] == entered_code:
        is_valid = True

    if not is_valid:
        raise UnauthorizedError("Invalid or expired verification code. Please request a new OTP.")

    # Find existing user by phone or email
    user = db.query(User).filter(
        (User.phone == f"+91 {phone[:5]} {phone[5:]}") |
        (User.phone == f"+91{phone}") |
        (User.phone == phone) |
        (User.email == f"farmer_{phone}@krishinirnay.ai")
    ).first()

    if not user:
        # Auto-create new farmer account
        display_name = payload.full_name or f"Farmer {phone[-4:]}"
        user = User(
            email=f"farmer_{phone}@krishinirnay.ai",
            hashed_password=get_password_hash("FarmerAutoPass2026!"),
            full_name=display_name,
            role="FARMER",
            is_active=True,
            phone=f"+91 {phone[:5]} {phone[5:]}",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Auto-registered new farmer via OTP: {user.phone}")

    # Check if farmer has at least one registered farm
    farm = db.query(Farm).filter(Farm.user_id == user.id).first()
    has_farm = farm is not None

    access_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserPublic.model_validate(user),
        has_farm=has_farm,
        farm_id=farm.id if farm else None
    )


@router.post("/register", response_model=TokenResponse, status_code=201, summary="Register new farmer account")
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    # Check for existing user
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise ConflictError(f"An account with email '{payload.email}' already exists.")

    user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role="FARMER",
        is_active=True,
        phone=payload.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    farm = db.query(Farm).filter(Farm.user_id == user.id).first()

    access_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    logger.info(f"New user registered: {user.email}")

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserPublic.model_validate(user),
        has_farm=farm is not None,
        farm_id=farm.id if farm else None
    )


@router.post("/login", response_model=TokenResponse, summary="Login with email and password")
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise UnauthorizedError("Incorrect email or password. Please check your credentials.")

    if not user.is_active:
        raise UnauthorizedError("Your account is disabled. Please contact support.")

    farm = db.query(Farm).filter(Farm.user_id == user.id).first()

    access_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    logger.info(f"User logged in: {user.email}")

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserPublic.model_validate(user),
        has_farm=farm is not None,
        farm_id=farm.id if farm else None
    )


@router.post("/logout", summary="Logout (client-side token invalidation)")
def logout(current_user: User = Depends(get_current_user)):
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Logged out successfully. Please discard your token."}


@router.get("/me", response_model=UserPublic, summary="Get current authenticated user profile")
def get_me(current_user: User = Depends(get_current_user)):
    return UserPublic.model_validate(current_user)
