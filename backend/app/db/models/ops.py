import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Date, JSON, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="SET NULL"), nullable=True, index=True)
    category = Column(String(50), default="SYSTEM", nullable=False, index=True, doc="SYSTEM, WEATHER, RISK, ACTION, SENSOR, EXPERT, MARKET")
    severity = Column(String(50), default="INFO", nullable=False, doc="INFO, WARNING, HIGH, CRITICAL")
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_acknowledged = Column(Boolean, default=False, nullable=False, index=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    farm = relationship("Farm", back_populates="alerts")


class ExpertCase(Base):
    __tablename__ = "expert_cases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=True, index=True)
    action_plan_id = Column(String(36), ForeignKey("action_plans.id", ondelete="CASCADE"), nullable=True)
    risk_id = Column(String(36), ForeignKey("risk_events.id", ondelete="SET NULL"), nullable=True)
    escalation_reason = Column(String(255), nullable=True)
    status = Column(String(50), default="OPEN", nullable=False, doc="OPEN, IN_REVIEW, RESOLVED, REJECTED")
    notes = Column(Text, nullable=True)
    expert_notes = Column(Text, nullable=True)
    expert_id = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)



class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    crop_name = Column(String(100), nullable=False, index=True)
    mandi = Column(String(150), nullable=False)
    price_per_quintal = Column(Float, nullable=False)
    trend = Column(String(50), default="STABLE", doc="UP, DOWN, STABLE")
    price_date = Column(Date, default=date.today, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    request_id = Column(String(100), nullable=True)
    changes = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)


class SystemEvent(Base):
    __tablename__ = "system_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_type = Column(String(100), nullable=False, index=True)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
