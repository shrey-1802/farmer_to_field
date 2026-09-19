import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RiskSeverity:
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RiskType:
    WATER_STRESS = "WATER_STRESS"
    DISEASE_OUTBREAK = "DISEASE_OUTBREAK"
    HEAT_WAVE = "HEAT_WAVE"
    HEAVY_RAIN = "HEAVY_RAIN"
    NUTRIENT_DEFICIENCY = "NUTRIENT_DEFICIENCY"
    SENSOR_FAILURE = "SENSOR_FAILURE"
    MARKET_SIGNAL = "MARKET_SIGNAL"


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_name = Column(String(100), nullable=False, index=True)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="SET NULL"), nullable=True, index=True)
    zone_id = Column(String(36), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(50), default="COMPLETED", nullable=False)
    confidence = Column(Float, default=0.90, nullable=False)
    input_telemetry = Column(JSON, nullable=True)
    output_result = Column(JSON, nullable=False)
    evidence = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    completed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class RiskEvent(Base):
    __tablename__ = "risk_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="SET NULL"), nullable=True, index=True)
    zone_id = Column(String(36), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True, index=True)
    risk_type = Column(String(100), nullable=False, index=True)
    severity = Column(String(50), default=RiskSeverity.MEDIUM, nullable=False)
    confidence = Column(Float, default=0.85, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    evidence = Column(JSON, nullable=True, doc="Metric thresholds, forecast, sensor delta")
    is_resolved = Column(Boolean, default=False, nullable=False)
    detected_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    field = relationship("Field", back_populates="risks")
    action_plans = relationship("ActionPlan", back_populates="risk")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    risk_id = Column(String(36), ForeignKey("risk_events.id", ondelete="CASCADE"), nullable=False)
    agent_name = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    action_type = Column(String(100), nullable=False)
    parameters = Column(JSON, nullable=True)
    confidence = Column(Float, default=0.85, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
