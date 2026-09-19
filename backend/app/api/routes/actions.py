"""
Action Plan Management & Approval Endpoints
BACKEND.md Phase 26 & 27
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.db.models.farm import Farm
from app.db.models.action import ActionPlan, ApprovalStatus, Task, TaskStatus
from app.schemas.action import ActionPlanCreate, ActionPlanResponse, ApprovalDecision
from app.services.task_service import transition_task_state

router = APIRouter(prefix="/actions", tags=["Action Plans & Human Approval"])


@router.get("", response_model=List[ActionPlanResponse])
def list_action_plans(
    farm_id: Optional[str] = Query(None),
    approval_status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    List action plans with optional status or farm filtering.
    """
    query = db.query(ActionPlan)
    if farm_id:
        query = query.filter(ActionPlan.farm_id == farm_id)
    if approval_status:
        query = query.filter(ActionPlan.approval_status == approval_status.upper())
    if priority:
        query = query.filter(ActionPlan.priority == priority.upper())

    plans = query.order_by(ActionPlan.created_at.desc()).all()
    return plans


@router.post("", response_model=ActionPlanResponse, status_code=status.HTTP_201_CREATED)
def create_action_plan(
    plan_in: ActionPlanCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new ActionPlan requiring human or autonomous approval.
    """
    farm = db.query(Farm).filter(Farm.id == plan_in.farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm '{plan_in.farm_id}' not found",
        )

    plan = ActionPlan(
        farm_id=plan_in.farm_id,
        field_id=plan_in.field_id,
        zone_id=plan_in.zone_id,
        risk_id=plan_in.risk_id,
        action_type=plan_in.action_type,
        title=plan_in.title,
        description=plan_in.description,
        scheduled_at=plan_in.scheduled_at,
        priority=plan_in.priority,
        estimated_cost=plan_in.estimated_cost,
        confidence=plan_in.confidence,
        reason=plan_in.reason,
        evidence=plan_in.evidence,
        safety_status=plan_in.safety_status,
        approval_status=ApprovalStatus.PENDING,
        created_by="Orchestrator",
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/{action_id}", response_model=ActionPlanResponse)
def get_action_plan(
    action_id: str,
    db: Session = Depends(get_db),
):
    """
    Fetch a single action plan by UUID.
    """
    plan = db.query(ActionPlan).filter(ActionPlan.id == action_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action plan '{action_id}' not found",
        )
    return plan


@router.post("/{action_id}/approve", response_model=ActionPlanResponse)
def approve_action_plan(
    action_id: str,
    decision: Optional[ApprovalDecision] = None,
    db: Session = Depends(get_db),
):
    """
    Server-side validated approval.
    When an action is approved:
    1. Mark ActionPlan as APPROVED
    2. Automatically instantiate a corresponding Task in the Task Engine.
    """
    plan = db.query(ActionPlan).filter(ActionPlan.id == action_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action plan '{action_id}' not found",
        )

    if plan.approval_status == ApprovalStatus.APPROVED:
        return plan

    plan.approval_status = ApprovalStatus.APPROVED
    db.commit()

    # Automatically create actionable Task for execution
    new_task = Task(
        action_plan_id=plan.id,
        farm_id=plan.farm_id,
        field_id=plan.field_id,
        zone_id=plan.zone_id,
        title=plan.title,
        description=plan.description,
        task_type=plan.action_type,
        status=TaskStatus.APPROVED,
        assigned_to="Virtual Actuator / Drip Valve",
    )
    db.add(new_task)
    db.commit()

    # Transition to SCHEDULED with audit event
    transition_task_state(
        task=new_task,
        new_status=TaskStatus.SCHEDULED,
        db=db,
        reason=decision.reason if decision and decision.reason else "Plan approved by operator",
        triggered_by="FarmerApproval",
    )

    db.refresh(plan)
    return plan


@router.post("/{action_id}/reject", response_model=ActionPlanResponse)
def reject_action_plan(
    action_id: str,
    decision: Optional[ApprovalDecision] = None,
    db: Session = Depends(get_db),
):
    """
    Mark an action plan as REJECTED.
    """
    plan = db.query(ActionPlan).filter(ActionPlan.id == action_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action plan '{action_id}' not found",
        )

    plan.approval_status = ApprovalStatus.REJECTED
    db.commit()
    db.refresh(plan)
    return plan


@router.post("/{action_id}/expert-review", response_model=ActionPlanResponse)
def escalate_to_expert_review(
    action_id: str,
    decision: Optional[ApprovalDecision] = None,
    db: Session = Depends(get_db),
):
    """
    Escalate action plan for Agronomic Extension Officer or Expert Review.
    """
    plan = db.query(ActionPlan).filter(ActionPlan.id == action_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action plan '{action_id}' not found",
        )

    plan.approval_status = ApprovalStatus.EXPERT_REVIEW
    db.commit()
    db.refresh(plan)
    return plan
