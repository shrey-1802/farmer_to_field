"""
Expert Case Escalation API
BACKEND.md Phase 31

Escalates cases to human agronomists/experts when:
- confidence below threshold
- high-risk action
- agent conflict
- uncertain disease diagnosis
- sensor failure
- repeated execution failure
"""

from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.db.models.ops import ExpertCase
from app.schemas.ops import ExpertCaseCreate, ExpertCaseResponse, ExpertResolveRequest
from app.services.event_bus import event_bus

router = APIRouter(prefix="/experts/cases", tags=["Expert Escalation Engine"])


@router.get("", response_model=List[ExpertCaseResponse])
def list_expert_cases(
    farm_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    List expert escalation cases with optional farm or status filter.
    """
    query = db.query(ExpertCase)
    if farm_id:
        query = query.filter(ExpertCase.farm_id == farm_id)
    if status:
        query = query.filter(ExpertCase.status == status.upper())

    cases = query.order_by(ExpertCase.created_at.desc()).all()
    return cases


@router.post("", response_model=ExpertCaseResponse, status_code=status.HTTP_201_CREATED)
def create_expert_case(
    case_in: ExpertCaseCreate,
    db: Session = Depends(get_db),
):
    """
    Escalate a case to human agricultural extension officers.
    """
    case = ExpertCase(
        farm_id=case_in.farm_id,
        action_plan_id=case_in.action_plan_id,
        risk_id=case_in.risk_id,
        escalation_reason=case_in.escalation_reason,
        status="OPEN",
        notes=case_in.notes,
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    # Broadcast event
    event_bus.publish("expert.escalation.created", {
        "case_id": case.id,
        "farm_id": case.farm_id,
        "reason": case.escalation_reason,
    })

    return case


@router.get("/{case_id}", response_model=ExpertCaseResponse)
def get_expert_case(
    case_id: str,
    db: Session = Depends(get_db),
):
    """
    Get details of a single expert escalation case.
    """
    case = db.query(ExpertCase).filter(ExpertCase.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expert case '{case_id}' not found",
        )
    return case


@router.post("/{case_id}/resolve", response_model=ExpertCaseResponse)
def resolve_expert_case(
    case_id: str,
    req: ExpertResolveRequest,
    db: Session = Depends(get_db),
):
    """
    Resolve or approve an escalated case with expert agronomist review notes.
    """
    case = db.query(ExpertCase).filter(ExpertCase.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expert case '{case_id}' not found",
        )

    case.status = "RESOLVED" if req.resolution == "APPROVED" else "REJECTED"
    case.expert_id = req.expert_id
    case.expert_notes = req.expert_notes
    case.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(case)

    event_bus.publish("expert.case.resolved", {
        "case_id": case.id,
        "expert_id": req.expert_id,
        "resolution": req.resolution,
    })

    return case
