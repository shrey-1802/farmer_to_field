import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.db.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    temperature = Column(Float, nullable=False)
    relative_humidity = Column(Float, nullable=False)
    precipitation = Column(Float, default=0.0, nullable=False)
    wind_speed = Column(Float, default=0.0, nullable=False)
    weather_code = Column(Integer, default=0, nullable=False)
    source = Column(String(100), default="open-meteo", nullable=False)
    is_stale = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    farm = relationship("Farm", back_populates="weather_records")


class WeatherForecast(Base):
    __tablename__ = "weather_forecasts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    forecast_time = Column(DateTime(timezone=True), nullable=False, index=True)
    temperature_max = Column(Float, nullable=False)
    temperature_min = Column(Float, nullable=False)
    precipitation_sum = Column(Float, default=0.0, nullable=False)
    precipitation_probability = Column(Float, default=0.0, nullable=False)
    weather_code = Column(Integer, default=0, nullable=False)
    raw_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
