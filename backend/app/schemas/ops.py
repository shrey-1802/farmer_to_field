from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field


# ========================
# Alert Schemas (Phase 32)
# ========================

class AlertCreate(BaseModel):
    farm_id: str
    field_id: Optional[str] = None
    category: str = "SYSTEM"  # SYSTEM, WEATHER, RISK, ACTION, SENSOR, EXPERT, MARKET
    severity: str = "INFO"     # INFO, WARNING, HIGH, CRITICAL
    title: str = Field(..., min_length=2, max_length=255)
    message: str


class AlertResponse(BaseModel):
    id: str
    farm_id: str
    field_id: Optional[str] = None
    category: str
    severity: str
    title: str
    message: str
    is_acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ========================
# Expert Case Schemas (Phase 31)
# ========================

class ExpertCaseCreate(BaseModel):
    farm_id: Optional[str] = None
    action_plan_id: Optional[str] = None
    risk_id: Optional[str] = None
    escalation_reason: Optional[str] = "Low confidence or complex condition requires human expert review"
    notes: Optional[str] = None


class ExpertCaseResponse(BaseModel):
    id: str
    farm_id: Optional[str] = None
    action_plan_id: Optional[str] = None
    risk_id: Optional[str] = None
    escalation_reason: Optional[str] = None
    status: str
    notes: Optional[str] = None
    expert_notes: Optional[str] = None
    expert_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpertResolveRequest(BaseModel):
    expert_id: str = "Expert_Agronomist_01"
    expert_notes: str = Field(..., min_length=2)
    resolution: str = "APPROVED"  # APPROVED, REJECTED, MODIFIED
