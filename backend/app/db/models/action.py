import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ApprovalStatus:
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPERT_REVIEW = "EXPERT_REVIEW"


class SafetyStatus:
    SAFE = "SAFE"
    REQUIRES_OVERRIDE = "REQUIRES_OVERRIDE"
    BLOCKED = "BLOCKED"


class TaskStatus:
    CREATED = "CREATED"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    SCHEDULED = "SCHEDULED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    VERIFIED = "VERIFIED"
    FAILED = "FAILED"
    ESCALATED = "ESCALATED"


class ExecutionStatus:
    OFF = "OFF"
    STARTING = "STARTING"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ActionPlan(Base):
    __tablename__ = "action_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="SET NULL"), nullable=True, index=True)
    zone_id = Column(String(36), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True, index=True)
    risk_id = Column(String(36), ForeignKey("risk_events.id", ondelete="SET NULL"), nullable=True)
    action_type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    priority = Column(String(50), default="MEDIUM", nullable=False)
    estimated_cost = Column(Float, default=0.0, nullable=False)
    confidence = Column(Float, default=0.90, nullable=False)
    reason = Column(Text, nullable=False)
    evidence = Column(JSON, nullable=True)
    safety_status = Column(String(50), default=SafetyStatus.SAFE, nullable=False)
    approval_status = Column(String(50), default=ApprovalStatus.PENDING, nullable=False, index=True)
    created_by = Column(String(100), default="Orchestrator", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    farm = relationship("Farm", back_populates="action_plans")
    risk = relationship("RiskEvent", back_populates="action_plans")
    tasks = relationship("Task", back_populates="action_plan", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    action_plan_id = Column(String(36), ForeignKey("action_plans.id", ondelete="CASCADE"), nullable=True, index=True)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="SET NULL"), nullable=True, index=True)
    zone_id = Column(String(36), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    task_type = Column(String(100), default="IRRIGATION", nullable=False)
    status = Column(String(50), default=TaskStatus.CREATED, nullable=False, index=True)
    assigned_to = Column(String(100), default="Virtual Drone / IoT Controller", nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    farm = relationship("Farm", back_populates="tasks")
    action_plan = relationship("ActionPlan", back_populates="tasks")
    events = relationship("TaskEvent", back_populates="task", cascade="all, delete-orphan")
    irrigation_runs = relationship("IrrigationRun", back_populates="task", cascade="all, delete-orphan")


class TaskEvent(Base):
    __tablename__ = "task_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    reason = Column(Text, nullable=True)
    triggered_by = Column(String(100), default="System", nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    task = relationship("Task", back_populates="events")


class IrrigationRun(Base):
    __tablename__ = "irrigation_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True)
    zone_id = Column(String(36), ForeignKey("zones.id", ondelete="CASCADE"), nullable=False, index=True)
    target_moisture = Column(Float, default=55.0, nullable=False)
    duration_minutes = Column(Float, default=30.0, nullable=False)
    status = Column(String(50), default=ExecutionStatus.OFF, nullable=False)
    water_applied_liters = Column(Float, default=0.0, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    task = relationship("Task", back_populates="irrigation_runs")
    zone = relationship("Zone", back_populates="irrigation_runs")
