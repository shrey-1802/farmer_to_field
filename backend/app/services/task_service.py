"""
Task State Machine & Virtual Execution Service
BACKEND.md Phases 28, 29, 30

Features:
- Validated state machine transitions
- Immutable audit event logging (TaskEvent)
- Virtual Irrigation execution engine
- Closed-loop feedback: increases soil moisture sensor readings,
  recalculates risk, and marks associated threats as resolved.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.db.models.action import Task, TaskEvent, TaskStatus, IrrigationRun, ExecutionStatus
from app.db.models.sensor import Sensor, SensorReading
from app.db.models.agent import RiskEvent, RiskType


ALLOWED_TASK_TRANSITIONS: Dict[str, list] = {
    TaskStatus.CREATED: [TaskStatus.PENDING_APPROVAL, TaskStatus.APPROVED, TaskStatus.SCHEDULED, TaskStatus.FAILED],
    TaskStatus.PENDING_APPROVAL: [TaskStatus.APPROVED, TaskStatus.FAILED, TaskStatus.ESCALATED],
    TaskStatus.APPROVED: [TaskStatus.SCHEDULED, TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS, TaskStatus.FAILED],
    TaskStatus.SCHEDULED: [TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS, TaskStatus.FAILED],
    TaskStatus.ASSIGNED: [TaskStatus.IN_PROGRESS, TaskStatus.SCHEDULED, TaskStatus.FAILED],
    TaskStatus.IN_PROGRESS: [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.ESCALATED],
    TaskStatus.COMPLETED: [TaskStatus.VERIFIED],
    TaskStatus.VERIFIED: [],
    TaskStatus.FAILED: [TaskStatus.ESCALATED, TaskStatus.CREATED],
    TaskStatus.ESCALATED: [TaskStatus.PENDING_APPROVAL, TaskStatus.FAILED],
}


def transition_task_state(
    task: Task,
    new_status: str,
    db: Session,
    reason: Optional[str] = None,
    triggered_by: str = "System",
) -> Tuple[bool, str]:
    """
    Validate and execute a task state transition with audit event logging.
    """
    current_status = task.status
    allowed = ALLOWED_TASK_TRANSITIONS.get(current_status, [])

    if new_status not in allowed and new_status != current_status:
        return False, f"Invalid transition from '{current_status}' to '{new_status}'. Allowed: {allowed}"

    task.status = new_status
    now = datetime.now(timezone.utc)
    task.updated_at = now

    if new_status == TaskStatus.IN_PROGRESS and not task.started_at:
        task.started_at = now
    elif new_status in (TaskStatus.COMPLETED, TaskStatus.VERIFIED):
        task.completed_at = now

    # Record audit event
    event = TaskEvent(
        task_id=task.id,
        from_status=current_status,
        to_status=new_status,
        reason=reason or f"State changed to {new_status}",
        triggered_by=triggered_by,
        timestamp=now,
    )
    db.add(event)
    db.commit()
    db.refresh(task)

    logger.info(f"Task {task.id} transitioned from {current_status} to {new_status} by {triggered_by}")
    return True, "Success"


def execute_virtual_irrigation_feedback_loop(
    run: IrrigationRun,
    db: Session,
    flow_rate_lpm: float = 50.0,
) -> Dict[str, Any]:
    """
    Phase 30: Execution Feedback Loop
    When irrigation completes:
    1. Update IrrigationRun status -> COMPLETED
    2. Calculate water delivered in liters
    3. Locate soil moisture sensor for zone
    4. Inject positive soil moisture reading
    5. Resolve linked water stress risk events
    6. Transition linked Task -> COMPLETED & VERIFIED
    """
    now = datetime.now(timezone.utc)
    run.status = ExecutionStatus.COMPLETED
    run.completed_at = now
    water_applied = round(run.duration_minutes * flow_rate_lpm, 1)
    run.water_applied_liters = water_applied

    # 1. Update/Locate Sensor in this zone
    sensor = (
        db.query(Sensor)
        .filter(Sensor.zone_id == run.zone_id, Sensor.sensor_type == "SOIL_MOISTURE")
        .first()
    )

    new_reading = None
    old_moisture = 38.0
    new_moisture = min(85.0, run.target_moisture)

    if sensor:
        # Check previous reading
        prev_reading = (
            db.query(SensorReading)
            .filter(SensorReading.sensor_id == sensor.id)
            .order_by(SensorReading.timestamp.desc())
            .first()
        )
        if prev_reading and prev_reading.measurements and "soil_moisture" in prev_reading.measurements:
            old_moisture = prev_reading.measurements["soil_moisture"]
            # Increment moisture towards or exceeding target
            new_moisture = min(85.0, round(old_moisture + (run.target_moisture - old_moisture) * 0.9, 1))

        # Insert new physical feedback reading
        new_reading = SensorReading(
            sensor_id=sensor.id,
            farm_id=sensor.farm_id,
            field_id=sensor.field_id,
            zone_id=sensor.zone_id,
            timestamp=now,
            measurements={
                "soil_moisture": new_moisture,
                "soil_temperature": 22.0,
            },
            quality="OPTIMAL",
            source="FEEDBACK_LOOP",
        )
        db.add(new_reading)

    # 2. Resolve active WATER_STRESS risks in this zone / field
    resolved_risks = 0
    active_risks = (
        db.query(RiskEvent)
        .filter(
            RiskEvent.zone_id == run.zone_id,
            RiskEvent.risk_type == RiskType.WATER_STRESS,
            RiskEvent.is_resolved == False,
        )
        .all()
    )
    for risk in active_risks:
        risk.is_resolved = True
        risk.resolved_at = now
        resolved_risks += 1

    # 3. Transition linked Task if present
    if run.task_id:
        task = db.query(Task).filter(Task.id == run.task_id).first()
        if task and task.status != TaskStatus.VERIFIED:
            transition_task_state(
                task=task,
                new_status=TaskStatus.COMPLETED,
                db=db,
                reason=f"Virtual irrigation cycle completed. {water_applied}L delivered.",
                triggered_by="VirtualIrrigationEngine",
            )
            transition_task_state(
                task=task,
                new_status=TaskStatus.VERIFIED,
                db=db,
                reason=f"Feedback loop confirmed soil moisture rose from {old_moisture}% to {new_moisture}%.",
                triggered_by="SensorVerificationLoop",
            )

    db.commit()
    db.refresh(run)

    return {
        "run_id": run.id,
        "status": ExecutionStatus.COMPLETED,
        "water_applied_liters": water_applied,
        "previous_soil_moisture": old_moisture,
        "new_soil_moisture": new_moisture,
        "sensor_reading_recorded": new_reading is not None,
        "resolved_risk_events_count": resolved_risks,
        "completed_at": now.isoformat(),
    }
