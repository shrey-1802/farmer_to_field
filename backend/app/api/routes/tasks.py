"""
Task Engine Endpoints & State Transition Machine
BACKEND.md Phase 28
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.db.models.farm import Farm
from app.db.models.action import Task, TaskStatus
from app.schemas.action import TaskCreate, TaskResponse, TaskTransitionRequest
from app.services.task_service import transition_task_state

router = APIRouter(prefix="/tasks", tags=["Task Engine"])


@router.get("", response_model=List[TaskResponse])
def list_tasks(
    farm_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    task_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    List all tasks with optional farm, status, or type filtering.
    """
    query = db.query(Task)
    if farm_id:
        query = query.filter(Task.farm_id == farm_id)
    if status:
        query = query.filter(Task.status == status.upper())
    if task_type:
        query = query.filter(Task.task_type == task_type.upper())

    tasks = query.order_by(Task.created_at.desc()).all()
    return tasks


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new operational task in CREATED state.
    """
    farm = db.query(Farm).filter(Farm.id == task_in.farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm '{task_in.farm_id}' not found",
        )

    task = Task(
        farm_id=task_in.farm_id,
        field_id=task_in.field_id,
        zone_id=task_in.zone_id,
        action_plan_id=task_in.action_plan_id,
        title=task_in.title,
        description=task_in.description,
        task_type=task_in.task_type,
        status=TaskStatus.CREATED,
        assigned_to=task_in.assigned_to,
        due_date=task_in.due_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskResponse)
def get_task_details(
    task_id: str,
    db: Session = Depends(get_db),
):
    """
    Get full task details including complete audit event log.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found",
        )
    return task


@router.post("/{task_id}/start", response_model=TaskResponse)
def start_task(
    task_id: str,
    req: Optional[TaskTransitionRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Transition task to IN_PROGRESS.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found",
        )

    success, msg = transition_task_state(
        task=task,
        new_status=TaskStatus.IN_PROGRESS,
        db=db,
        reason=req.reason if req else "Operator initiated execution",
        triggered_by=req.triggered_by if req else "Operator",
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    return task


@router.post("/{task_id}/complete", response_model=TaskResponse)
def complete_task(
    task_id: str,
    req: Optional[TaskTransitionRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Transition task to COMPLETED.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found",
        )

    success, msg = transition_task_state(
        task=task,
        new_status=TaskStatus.COMPLETED,
        db=db,
        reason=req.reason if req else "Field operations completed successfully",
        triggered_by=req.triggered_by if req else "Operator",
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    return task


@router.post("/{task_id}/fail", response_model=TaskResponse)
def fail_task(
    task_id: str,
    req: Optional[TaskTransitionRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Transition task to FAILED.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found",
        )

    success, msg = transition_task_state(
        task=task,
        new_status=TaskStatus.FAILED,
        db=db,
        reason=req.reason if req else "Task execution aborted or failed",
        triggered_by=req.triggered_by if req else "Operator",
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    return task


@router.post("/{task_id}/escalate", response_model=TaskResponse)
def escalate_task(
    task_id: str,
    req: Optional[TaskTransitionRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Transition task to ESCALATED.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found",
        )

    success, msg = transition_task_state(
        task=task,
        new_status=TaskStatus.ESCALATED,
        db=db,
        reason=req.reason if req else "Operational anomaly requires supervisor escalation",
        triggered_by=req.triggered_by if req else "System",
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    return task
