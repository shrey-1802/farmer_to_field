from functools import lru_cache
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "KrishiNirnay AI"
    APP_ENV: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Database
    DATABASE_URL: str = ""
    DB_ECHO: bool = False

    # Security & JWT
    JWT_SECRET: str = "dev-secret-key-krishinirnay-autonomous-farm-2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # CORS
    FRONTEND_ORIGIN: Union[str, List[str]] = "http://localhost:5500,http://127.0.0.1:5500,https://shrey-1802.github.io"
    FRONTEND_PRODUCTION_ORIGIN: str = "https://shrey-1802.github.io"

    # Weather
    WEATHER_API_BASE_URL: str = "https://api.open-meteo.com/v1/forecast"
    WEATHER_CACHE_TTL_SECONDS: int = 1800

    # AI & Simulation
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gemini-1.5-flash"
    SIMULATION_MODE: bool = True

    # Logging
    LOG_LEVEL: str = "INFO"

    # ── SMS OTP Provider ──────────────────────────────────────────────────────
    # Which provider to use: fast2sms | msg91 | twilio | none
    SMS_PROVIDER: str = "none"

    # Fast2SMS (India) — https://fast2sms.com
    FAST2SMS_API_KEY: str = ""
    FAST2SMS_SENDER_ID: str = "KRISHI"
    FAST2SMS_ROUTE: str = "q"

    # MSG91 (India Enterprise) — https://msg91.com
    MSG91_AUTH_KEY: str = ""
    MSG91_TEMPLATE_ID: str = ""
    MSG91_SENDER_ID: str = "KRISHI"

    # Twilio (International) — https://twilio.com
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # OTP Settings
    OTP_EXPIRY_SECONDS: int = 300
    OTP_DEMO_NUMBERS: str = "9876543210,9999900001,9876500000"

    @property
    def demo_phone_numbers(self) -> list[str]:
        return [n.strip() for n in self.OTP_DEMO_NUMBERS.split(",") if n.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        if isinstance(self.FRONTEND_ORIGIN, list):
            origins = list(self.FRONTEND_ORIGIN)
        elif isinstance(self.FRONTEND_ORIGIN, str):
            origins = [o.strip() for o in self.FRONTEND_ORIGIN.split(",") if o.strip()]
        else:
            origins = []

        if self.FRONTEND_PRODUCTION_ORIGIN and self.FRONTEND_PRODUCTION_ORIGIN not in origins:
            origins.append(self.FRONTEND_PRODUCTION_ORIGIN)

        return origins

    @property
    def resolved_database_url(self) -> str:
        url = self.DATABASE_URL.strip() if self.DATABASE_URL else ""
        if not url:
            # Default fallback for out-of-the-box local development
            return "sqlite:///./krishinirnay.db"
        # Render / Supabase / Neon sometimes provide postgres:// instead of postgresql://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        # MySQL URL standard normalization for pymysql driver
        if url.startswith("mysql://"):
            url = url.replace("mysql://", "mysql+pymysql://", 1)
        return url


@lru_cache()
def get_settings() -> Settings:
    return Settings()
