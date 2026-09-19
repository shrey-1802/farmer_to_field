import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Farm(Base):
    __tablename__ = "farms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    area = Column(Float, nullable=False, default=10.0, doc="Area in acres or hectares")
    soil_type = Column(String(100), nullable=True, default="Loamy")
    irrigation_type = Column(String(100), nullable=True, default="Drip & Sprinkler")
    boundary = Column(JSON, nullable=True, doc="GeoJSON polygon or coordinate array")
    status = Column(String(50), default="ACTIVE", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    owner = relationship("User", back_populates="farms")
    fields = relationship("Field", back_populates="farm", cascade="all, delete-orphan")
    sensors = relationship("Sensor", back_populates="farm", cascade="all, delete-orphan")
    weather_records = relationship("WeatherRecord", back_populates="farm", cascade="all, delete-orphan")
    action_plans = relationship("ActionPlan", back_populates="farm", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="farm", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="farm", cascade="all, delete-orphan")


class Field(Base):
    __tablename__ = "fields"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    area = Column(Float, nullable=False, default=5.0)
    crop_id = Column(String(36), ForeignKey("crops.id", ondelete="SET NULL"), nullable=True)
    crop_cycle_id = Column(String(36), nullable=True)
    boundary = Column(JSON, nullable=True, doc="GeoJSON polygon")
    status = Column(String(50), default="ACTIVE", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    farm = relationship("Farm", back_populates="fields")
    zones = relationship("Zone", back_populates="field", cascade="all, delete-orphan")
    crop = relationship("Crop", back_populates="fields")
    soil_profile = relationship("SoilProfile", back_populates="field", uselist=False, cascade="all, delete-orphan")
    sensors = relationship("Sensor", back_populates="field")
    risks = relationship("RiskEvent", back_populates="field")


class Zone(Base):
    __tablename__ = "zones"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    boundary = Column(JSON, nullable=True, doc="GeoJSON polygon")
    crop_stage = Column(String(100), default="Vegetative", nullable=False)
    area = Column(Float, nullable=False, default=2.5)
    status = Column(String(50), default="ACTIVE", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    field = relationship("Field", back_populates="zones")
    sensors = relationship("Sensor", back_populates="zone")
    irrigation_runs = relationship("IrrigationRun", back_populates="zone")
