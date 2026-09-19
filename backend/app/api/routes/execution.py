"""
Virtual Device & Actuator Execution Engine
BACKEND.md Phase 29 & 30

Manages:
- Virtual Irrigation valve cycles
- Statuses: OFF, STARTING, RUNNING, PAUSED, COMPLETED, FAILED
- Closed-Loop Feedback: Virtual moisture updates, risk resolution, task verification.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.db.models.farm import Zone
from app.db.models.action import IrrigationRun, ExecutionStatus, Task, TaskStatus
from app.schemas.action import IrrigationStartRequest, IrrigationRunResponse
from app.services.task_service import transition_task_state, execute_virtual_irrigation_feedback_loop

router = APIRouter(prefix="/execution/irrigation", tags=["Virtual Actuator & Irrigation Execution"])


@router.get("/active", response_model=List[IrrigationRunResponse])
def list_active_irrigation_runs(
    db: Session = Depends(get_db),
):
    """
    List all currently executing or paused virtual irrigation cycles.
    """
    runs = (
        db.query(IrrigationRun)
        .filter(IrrigationRun.status.in_([ExecutionStatus.RUNNING, ExecutionStatus.STARTING, ExecutionStatus.PAUSED]))
        .order_by(IrrigationRun.created_at.desc())
        .all()
    )
    return runs


@router.post("/start", response_model=IrrigationRunResponse, status_code=status.HTTP_201_CREATED)
def start_virtual_irrigation(
    req: IrrigationStartRequest,
    db: Session = Depends(get_db),
):
    """
    Phase 29: Initiate virtual irrigation cycle for a target zone.
    Backend owns execution state; browser never directly controls hardware.
    """
    zone = db.query(Zone).filter(Zone.id == req.zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Zone '{req.zone_id}' not found",
        )

    now = datetime.now(timezone.utc)
    run = IrrigationRun(
        task_id=req.task_id,
        zone_id=req.zone_id,
        target_moisture=req.target_moisture,
        duration_minutes=req.duration_minutes,
        status=ExecutionStatus.RUNNING,
        water_applied_liters=0.0,
        started_at=now,
    )
    db.add(run)
    db.commit()

    # If linked to a Task, transition task to IN_PROGRESS
    if req.task_id:
        task = db.query(Task).filter(Task.id == req.task_id).first()
        if task and task.status in (TaskStatus.APPROVED, TaskStatus.SCHEDULED, TaskStatus.ASSIGNED):
            transition_task_state(
                task=task,
                new_status=TaskStatus.IN_PROGRESS,
                db=db,
                reason=f"Irrigation valve opened for zone '{zone.name}'",
                triggered_by="VirtualActuator",
            )

    db.refresh(run)
    return run


@router.post("/{run_id}/pause", response_model=IrrigationRunResponse)
def pause_virtual_irrigation(
    run_id: str,
    db: Session = Depends(get_db),
):
    """
    Pause an active irrigation cycle.
    """
    run = db.query(IrrigationRun).filter(IrrigationRun.id == run_id).first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Irrigation run '{run_id}' not found",
        )

    run.status = ExecutionStatus.PAUSED
    db.commit()
    db.refresh(run)
    return run


@router.post("/{run_id}/resume", response_model=IrrigationRunResponse)
def resume_virtual_irrigation(
    run_id: str,
    db: Session = Depends(get_db),
):
    """
    Resume a paused irrigation cycle.
    """
    run = db.query(IrrigationRun).filter(IrrigationRun.id == run_id).first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Irrigation run '{run_id}' not found",
        )

    run.status = ExecutionStatus.RUNNING
    db.commit()
    db.refresh(run)
    return run


@router.post("/{run_id}/stop")
def stop_virtual_irrigation_with_feedback_loop(
    run_id: str,
    flow_rate_lpm: float = Query(50.0, description="Drip flow rate in liters/min"),
    db: Session = Depends(get_db),
):
    """
    Phase 30: Execution Feedback Loop.
    Concludes irrigation run and triggers physical feedback:
    1. Updates IrrigationRun -> COMPLETED
    2. Virtual soil moisture increases in that zone
    3. New sensor reading registered
    4. Active water stress risks resolved
    5. Associated task marked COMPLETED & VERIFIED.
    """
    run = db.query(IrrigationRun).filter(IrrigationRun.id == run_id).first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Irrigation run '{run_id}' not found",
        )

    summary = execute_virtual_irrigation_feedback_loop(
        run=run,
        db=db,
        flow_rate_lpm=flow_rate_lpm,
    )
    return summary


@router.get("/{run_id}", response_model=IrrigationRunResponse)
def get_irrigation_run(
    run_id: str,
    db: Session = Depends(get_db),
):
    """
    Get single irrigation execution run status.
    """
    run = db.query(IrrigationRun).filter(IrrigationRun.id == run_id).first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Irrigation run '{run_id}' not found",
        )
    return run
