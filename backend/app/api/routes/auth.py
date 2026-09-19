from datetime import timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth_deps import get_current_user
from app.core.config import get_settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.logging import logger
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.auth import (
    UserLoginRequest, UserPublic, UserRegisterRequest, TokenResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


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
    )


@router.post("/login", response_model=TokenResponse, summary="Login with email and password")
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise UnauthorizedError("Incorrect email or password. Please check your credentials.")

    if not user.is_active:
        raise UnauthorizedError("Your account is disabled. Please contact support.")

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
    )


@router.post("/logout", summary="Logout (client-side token invalidation)")
def logout(current_user: User = Depends(get_current_user)):
    # JWT is stateless - clients should discard the token.
    # In production, implement a token blocklist with Redis.
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Logged out successfully. Please discard your token."}


@router.get("/me", response_model=UserPublic, summary="Get current authenticated user profile")
def get_me(current_user: User = Depends(get_current_user)):
    return UserPublic.model_validate(current_user)
