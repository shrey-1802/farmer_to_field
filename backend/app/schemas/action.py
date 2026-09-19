from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field


# ========================
# Action Plan Schemas
# ========================

class ActionPlanCreate(BaseModel):
    farm_id: str
    field_id: Optional[str] = None
    zone_id: Optional[str] = None
    risk_id: Optional[str] = None
    action_type: str = "IRRIGATION"
    title: str = Field(..., min_length=2, max_length=255)
    description: str
    scheduled_at: Optional[datetime] = None
    priority: str = "MEDIUM"
    estimated_cost: float = 0.0
    confidence: float = 0.90
    reason: str
    evidence: Optional[Any] = None
    safety_status: str = "SAFE"


class ActionPlanResponse(BaseModel):
    id: str
    farm_id: str
    field_id: Optional[str] = None
    zone_id: Optional[str] = None
    risk_id: Optional[str] = None
    action_type: str
    title: str
    description: str
    scheduled_at: Optional[datetime] = None
    priority: str
    estimated_cost: float
    confidence: float
    reason: str
    evidence: Optional[Any] = None
    safety_status: str
    approval_status: str
    created_by: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ApprovalDecision(BaseModel):
    reason: Optional[str] = None
    notes: Optional[str] = None


# ========================
# Task Schemas
# ========================

class TaskCreate(BaseModel):
    farm_id: str
    field_id: Optional[str] = None
    zone_id: Optional[str] = None
    action_plan_id: Optional[str] = None
    title: str = Field(..., min_length=2, max_length=255)
    description: str
    task_type: str = "IRRIGATION"
    assigned_to: Optional[str] = "Virtual Controller"
    due_date: Optional[datetime] = None


class TaskEventResponse(BaseModel):
    id: str
    task_id: str
    from_status: Optional[str] = None
    to_status: str
    reason: Optional[str] = None
    triggered_by: str
    timestamp: datetime

    model_config = {"from_attributes": True}


class TaskResponse(BaseModel):
    id: str
    action_plan_id: Optional[str] = None
    farm_id: str
    field_id: Optional[str] = None
    zone_id: Optional[str] = None
    title: str
    description: str
    task_type: str
    status: str
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    events: List[TaskEventResponse] = []

    model_config = {"from_attributes": True}


class TaskTransitionRequest(BaseModel):
    reason: Optional[str] = "Status update requested"
    triggered_by: Optional[str] = "Operator"


# ========================
# Virtual Irrigation Execution Schemas
# ========================

class IrrigationStartRequest(BaseModel):
    zone_id: str
    task_id: Optional[str] = None
    target_moisture: float = 65.0
    duration_minutes: float = 20.0
    flow_rate_lpm: float = 50.0  # liters per minute


class IrrigationRunResponse(BaseModel):
    id: str
    task_id: Optional[str] = None
    zone_id: str
    target_moisture: float
    duration_minutes: float
    status: str
    water_applied_liters: float
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
