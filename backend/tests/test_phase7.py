"""
Phase 7 Comprehensive Test Suite
BACKEND.md Phases 26 - 30:
- Phase 26 & 27: Action Plan Model, Approval Lifecycle & Server-side validation
- Phase 28: Task Engine State Machine & TaskEvent Audit Trail
- Phase 29: Virtual Device / Actuator Irrigation Execution
- Phase 30: Closed-Loop Execution Feedback (Sensor injection, Risk resolution, Verification)
"""

import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import SessionLocal
from app.db.models.farm import Farm, Field, Zone
from app.db.models.sensor import Sensor, SensorReading
from app.db.models.action import ActionPlan, ApprovalStatus, Task, TaskStatus, IrrigationRun, ExecutionStatus
from app.db.models.agent import RiskEvent, RiskType

client = TestClient(app)


# ==============================================================================
# 1. ACTION PLAN LIFECYCLE (PHASE 26 & 27)
# ==============================================================================

def test_action_plan_creation_and_listing():
    """Verify action plans can be created and retrieved with proper default statuses."""
    db = SessionLocal()
    farm = db.query(Farm).first()
    assert farm is not None
    db.close()

    payload = {
        "farm_id": farm.id,
        "title": "Irrigate North Sector",
        "description": "Apply 15mm water to restore root zone moisture",
        "action_type": "IRRIGATION",
        "priority": "HIGH",
        "estimated_cost": 250.0,
        "reason": "Soil moisture is below 40% threshold",
    }
    res = client.post("/api/actions", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == payload["title"]
    assert data["approval_status"] == ApprovalStatus.PENDING
    action_id = data["id"]

    # Retrieve by ID
    res_get = client.get(f"/api/actions/{action_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == action_id

    # List all
    res_list = client.get(f"/api/actions?farm_id={farm.id}&approval_status=PENDING")
    assert res_list.status_code == 200
    assert any(a["id"] == action_id for a in res_list.json())


def test_action_plan_approval_and_task_spawning():
    """Phase 27: Server-side approved action automatically instantiates a Task."""
    db = SessionLocal()
    farm = db.query(Farm).first()
    db.close()

    # Create plan
    res_create = client.post("/api/actions", json={
        "farm_id": farm.id,
        "title": "Fertilizer Side-Dressing Plan",
        "description": "Apply 45 kg/ha Urea",
        "action_type": "FERTILIZATION",
        "reason": "Nitrogen level is deficient",
    })
    plan_id = res_create.json()["id"]

    # Approve plan
    res_app = client.post(f"/api/actions/{plan_id}/approve", json={"reason": "Approved by farm manager"})
    assert res_app.status_code == 200
    assert res_app.json()["approval_status"] == ApprovalStatus.APPROVED

    # Verify task was automatically created in DB
    db = SessionLocal()
    task = db.query(Task).filter(Task.action_plan_id == plan_id).first()
    assert task is not None
    assert task.status == TaskStatus.SCHEDULED
    assert len(task.events) >= 1
    assert task.events[0].to_status == TaskStatus.SCHEDULED
    db.close()


def test_action_plan_rejection_and_expert_review():
    """Verify rejection and expert review status transitions."""
    db = SessionLocal()
    farm = db.query(Farm).first()
    db.close()

    # Reject
    res_create1 = client.post("/api/actions", json={
        "farm_id": farm.id, "title": "Pesticide Spray", "description": "Chemical test",
        "action_type": "SPRAYING", "reason": "Test",
    })
    p1_id = res_create1.json()["id"]
    res_rej = client.post(f"/api/actions/{p1_id}/reject", json={"reason": "Rain expected"})
    assert res_rej.status_code == 200
    assert res_rej.json()["approval_status"] == ApprovalStatus.REJECTED

    # Expert Review
    res_create2 = client.post("/api/actions", json={
        "farm_id": farm.id, "title": "Fungicide Spray", "description": "Uncertain diagnosis",
        "action_type": "DISEASE_CONTROL", "reason": "Test",
    })
    p2_id = res_create2.json()["id"]
    res_exp = client.post(f"/api/actions/{p2_id}/expert-review", json={"reason": "Escalate to agronomist"})
    assert res_exp.status_code == 200
    assert res_exp.json()["approval_status"] == ApprovalStatus.EXPERT_REVIEW


# ==============================================================================
# 2. TASK ENGINE STATE MACHINE (PHASE 28)
# ==============================================================================

def test_task_state_machine_valid_and_invalid_transitions():
    """Phase 28: Valid transitions succeed with audit events; invalid transitions fail with 400."""
    db = SessionLocal()
    farm = db.query(Farm).first()
    db.close()

    # 1. Create task
    res_create = client.post("/api/tasks", json={
        "farm_id": farm.id,
        "title": "Clean Drip Filter",
        "description": "Prevent nozzle clogging",
        "task_type": "MAINTENANCE",
    })
    assert res_create.status_code == 201
    task_id = res_create.json()["id"]
    assert res_create.json()["status"] == TaskStatus.CREATED

    # 2. Invalid direct transition: CREATED -> COMPLETED should be rejected
    res_invalid = client.post(f"/api/tasks/{task_id}/complete")
    assert res_invalid.status_code == 400
    assert "Invalid transition" in str(res_invalid.json())

    # 3. Valid progression: CREATED -> APPROVED -> IN_PROGRESS -> COMPLETED
    db = SessionLocal()
    task = db.query(Task).filter(Task.id == task_id).first()
    task.status = TaskStatus.APPROVED
    db.commit()
    db.close()

    # Start task (IN_PROGRESS)
    res_start = client.post(f"/api/tasks/{task_id}/start", json={"reason": "Worker on site"})
    assert res_start.status_code == 200
    assert res_start.json()["status"] == TaskStatus.IN_PROGRESS

    # Complete task (COMPLETED)
    res_comp = client.post(f"/api/tasks/{task_id}/complete", json={"reason": "Filters flushed"})
    assert res_comp.status_code == 200
    assert res_comp.json()["status"] == TaskStatus.COMPLETED

    # Check audit events
    res_detail = client.get(f"/api/tasks/{task_id}")
    assert res_detail.status_code == 200
    events = res_detail.json()["events"]
    assert len(events) >= 2
    assert any(e["to_status"] == TaskStatus.IN_PROGRESS for e in events)
    assert any(e["to_status"] == TaskStatus.COMPLETED for e in events)


# ==============================================================================
# 3. VIRTUAL DEVICE EXECUTION & FEEDBACK LOOP (PHASE 29 & 30)
# ==============================================================================

def test_virtual_irrigation_execution_lifecycle_and_feedback_loop():
    """
    Phases 29 & 30:
    1. Start virtual irrigation
    2. Pause & Resume execution state
    3. Stop execution -> trigger feedback loop:
       - Virtual moisture reading recorded
       - Active water stress risk resolved
       - Linked task verified!
    """
    db = SessionLocal()
    farm = db.query(Farm).first()
    zone = db.query(Zone).first()
    assert zone is not None

    # Setup an active risk event for this zone
    risk = RiskEvent(
        farm_id=farm.id,
        zone_id=zone.id,
        risk_type=RiskType.WATER_STRESS,
        title="Severe Moisture Deficit",
        description="Zone moisture is critically low",
        is_resolved=False,
    )
    db.add(risk)
    db.commit()
    risk_id = risk.id

    # Setup linked task
    task = Task(
        farm_id=farm.id,
        zone_id=zone.id,
        title="Zone A Drip Irrigation",
        description="Deliver water",
        status=TaskStatus.APPROVED,
    )
    db.add(task)
    db.commit()
    task_id = task.id
    zone_id = zone.id
    db.close()

    # 1. Start virtual irrigation
    res_start = client.post("/api/execution/irrigation/start", json={
        "zone_id": zone_id,
        "task_id": task_id,
        "target_moisture": 65.0,
        "duration_minutes": 25.0,
    })
    assert res_start.status_code == 201
    run_id = res_start.json()["id"]
    assert res_start.json()["status"] == ExecutionStatus.RUNNING

    # Verify task moved to IN_PROGRESS
    res_task = client.get(f"/api/tasks/{task_id}")
    assert res_task.json()["status"] == TaskStatus.IN_PROGRESS

    # 2. Pause
    res_pause = client.post(f"/api/execution/irrigation/{run_id}/pause")
    assert res_pause.status_code == 200
    assert res_pause.json()["status"] == ExecutionStatus.PAUSED

    # 3. Resume
    res_resume = client.post(f"/api/execution/irrigation/{run_id}/resume")
    assert res_resume.status_code == 200
    assert res_resume.json()["status"] == ExecutionStatus.RUNNING

    # 4. Stop -> triggers Phase 30 Feedback Loop!
    res_stop = client.post(f"/api/execution/irrigation/{run_id}/stop?flow_rate_lpm=60.0")
    assert res_stop.status_code == 200
    summary = res_stop.json()
    assert summary["status"] == ExecutionStatus.COMPLETED
    assert summary["water_applied_liters"] == 1500.0  # 25 min * 60 lpm
    assert summary["new_soil_moisture"] > 30.0

    # 5. Verify database feedback effects
    db = SessionLocal()
    # Task should now be VERIFIED
    task_db = db.query(Task).filter(Task.id == task_id).first()
    assert task_db.status == TaskStatus.VERIFIED

    # Risk should be resolved
    risk_db = db.query(RiskEvent).filter(RiskEvent.id == risk_id).first()
    assert risk_db.is_resolved is True
    assert risk_db.resolved_at is not None

    db.close()
