import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Date, JSON, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Crop(Base):
    __tablename__ = "crops"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    scientific_name = Column(String(150), nullable=True)
    category = Column(String(100), default="Cereal", nullable=False)
    optimal_moisture_min = Column(Float, default=40.0, doc="Percentage")
    optimal_moisture_max = Column(Float, default=70.0, doc="Percentage")
    optimal_temp_min = Column(Float, default=15.0, doc="Celsius")
    optimal_temp_max = Column(Float, default=32.0, doc="Celsius")
    optimal_ph_min = Column(Float, default=6.0)
    optimal_ph_max = Column(Float, default=7.5)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    fields = relationship("Field", back_populates="crop")
    crop_cycles = relationship("CropCycle", back_populates="crop")


class CropCycle(Base):
    __tablename__ = "crop_cycles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    crop_id = Column(String(36), ForeignKey("crops.id", ondelete="CASCADE"), nullable=False)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), nullable=True)
    variety = Column(String(100), nullable=False)
    planting_date = Column(Date, default=date.today, nullable=False)
    expected_harvest_date = Column(Date, nullable=True)
    growth_stage = Column(String(100), default="Vegetative", nullable=False)
    area = Column(Float, default=5.0, nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    crop = relationship("Crop", back_populates="crop_cycles")


class SoilProfile(Base):
    __tablename__ = "soil_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), unique=True, nullable=False)
    soil_type = Column(String(100), default="Loam", nullable=False)
    ph = Column(Float, default=6.8, nullable=False)
    ec = Column(Float, default=1.2, doc="Electrical Conductivity dS/m", nullable=False)
    baseline_n = Column(Float, default=240.0, doc="Available Nitrogen kg/ha", nullable=False)
    baseline_p = Column(Float, default=22.0, doc="Available Phosphorus kg/ha", nullable=False)
    baseline_k = Column(Float, default=180.0, doc="Available Potassium kg/ha", nullable=False)
    water_holding_characteristics = Column(JSON, nullable=True, doc="Field capacity, wilting point, saturation")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    field = relationship("Field", back_populates="soil_profile")
