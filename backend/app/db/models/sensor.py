import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship

from app.db.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SensorSource:
    VIRTUAL_SENSOR = "virtual_sensor"
    PHYSICAL_IOT = "physical_iot"
    EXTERNAL = "external"


class SensorStatus:
    ONLINE = "ONLINE"
    STALE = "STALE"
    OFFLINE = "OFFLINE"
    ERROR = "ERROR"


class ReadingQuality:
    GOOD = "GOOD"
    WARNING = "WARNING"
    INVALID = "INVALID"
    MISSING = "MISSING"


class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="SET NULL"), nullable=True, index=True)
    zone_id = Column(String(36), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(150), nullable=False)
    sensor_type = Column(String(100), nullable=False, doc="SOIL_MOISTURE, SOIL_TEMPERATURE, AMBIENT_TEMP, HUMIDITY, NPK, SOLAR_RADIATION")
    source = Column(String(50), default=SensorSource.VIRTUAL_SENSOR, nullable=False)
    status = Column(String(50), default=SensorStatus.ONLINE, nullable=False)
    unit = Column(String(50), nullable=False, default="%")
    last_seen = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    configuration = Column(JSON, nullable=True, doc="Calibration, thresholds, baseline params")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    farm = relationship("Farm", back_populates="sensors")
    field = relationship("Field", back_populates="sensors")
    zone = relationship("Zone", back_populates="sensors")
    readings = relationship("SensorReading", back_populates="sensor", cascade="all, delete-orphan")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sensor_id = Column(String(36), ForeignKey("sensors.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_id = Column(String(36), nullable=False, index=True)
    field_id = Column(String(36), nullable=True, index=True)
    zone_id = Column(String(36), nullable=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    measurements = Column(JSON, nullable=False, doc="e.g. {'soil_moisture': 32.4, 'soil_temperature': 27.1}")
    quality = Column(String(50), default=ReadingQuality.GOOD, nullable=False)
    source = Column(String(50), default=SensorSource.VIRTUAL_SENSOR, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    sensor = relationship("Sensor", back_populates="readings")

    __table_args__ = (
        Index("ix_readings_sensor_timestamp", "sensor_id", "timestamp"),
    )
