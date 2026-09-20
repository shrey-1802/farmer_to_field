from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class SendOtpRequest(BaseModel):
    phone: str = Field(..., description="10-digit Indian phone number (with or without +91)")


class VerifyOtpRequest(BaseModel):
    phone: str = Field(..., description="10-digit Indian phone number")
    code: str = Field(..., min_length=4, max_length=8, description="6-digit verification code")
    full_name: Optional[str] = None


class OtpResponse(BaseModel):
    success: bool = True
    message: str
    phone: str
    expires_in_seconds: int = 300
    demo_code: Optional[str] = None


class UserPublic(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    phone: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: UserPublic
    has_farm: bool = False
    farm_id: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = None
