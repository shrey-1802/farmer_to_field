"""
End-to-End Water-Stress Demo Endpoint
BACKEND.md Phase 53 - Water-Stress Demo

Executes complete autonomous loop:
Simulation -> Telemetry -> Multi-Agent Orchestration -> Risk Engine -> Action Plan -> Virtual Irrigation Execution -> Feedback Telemetry -> Verification
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from app.api.dependencies import get_db
from app.api.auth_deps import get_current_user
from app.simulation.sensor_simulator import ScenarioType, set_scenario
from app.agents.orchestrator import MultiAgentOrchestrator
from app.services.context_service import build_farm_context
from app.services.task_service import transition_task_state, execute_virtual_irrigation_feedback_loop
from app.db.models.farm import Zone, Field as FieldModel
from app.db.models.sensor import SensorReading
from app.db.models.action import ActionPlan, Task, ExecutionStatus, TaskStatus, IrrigationRun
from app.services.event_bus import event_bus

from fastapi import APIRouter, Depends, HTTPException, Query, status

router = APIRouter(prefix="/simulation", tags=["Simulation Demo"])


class WaterStressRequest(BaseModel):
    farm_id: Optional[str] = None
    field_id: Optional[str] = None
    zone_id: Optional[str] = None
    soil_moisture: float = Field(18.0, ge=5.0, le=100.0, description="Target soil moisture % to trigger stress")
    auto_execute: bool = Field(True, description="Automatically execute virtual irrigation feedback loop")


@router.post("/water-stress-demo")
def trigger_water_stress_demo(
    req: WaterStressRequest,
    farm_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    target_farm_id = farm_id or req.farm_id
    if not target_farm_id:
        raise HTTPException(status_code=422, detail="farm_id must be provided in query or body.")
    req.farm_id = target_farm_id
    """
    Triggers end-to-end water stress autonomous loop.
    1. Set sensor scenario to WATER_STRESS
    2. Build context and run Multi-Agent Orchestrator
    3. Generate Action Plan
    4. Auto-approve & create Task (if auto_execute)
    5. Execute Virtual Irrigation & trigger closed-loop telemetry feedback
    6. Verify soil moisture recovery & risk resolution
    """
    # 1. Activate Water Stress Scenario
    set_scenario(req.farm_id, ScenarioType.WATER_STRESS)

    # Resolve target zone/field if missing
    if not req.zone_id or not req.field_id:
        target_zone = db.query(Zone).join(FieldModel).filter(FieldModel.farm_id == req.farm_id).first()
        if not target_zone:
            raise HTTPException(status_code=404, detail="No zone found for the given farm_id.")
        req.zone_id = req.zone_id or target_zone.id
        req.field_id = req.field_id or target_zone.field_id

    # 2. Build Context & Run Orchestrator
    context = build_farm_context(farm_id=req.farm_id, db=db, field_id=req.field_id, zone_id=req.zone_id)
    
    # Force low moisture in context for deterministic simulation
    if "latest_telemetry" in context and context["latest_telemetry"]:
        context["latest_telemetry"]["soil_moisture"] = req.soil_moisture

    orchestrator = MultiAgentOrchestrator()
    orch_result = orchestrator.run_all(context, db=db)

    # 3. Create Action Plan in DB
    action_plan_data = None
    created_task = None
    execution_result = None

    if orch_result.get("action_plan"):
        top_action = orch_result["action_plan"][0]
        action_plan = ActionPlan(
            farm_id=req.farm_id,
            field_id=req.field_id,
            zone_id=req.zone_id,
            action_type=top_action.get("category", "IRRIGATION"),
            title=top_action.get("title", "Water Stress Relief Irrigation"),
            description=top_action.get("instruction", "Apply emergency irrigation to relieve water stress."),
            priority=top_action.get("priority", "P1"),
            estimated_cost=45.0,
            confidence=0.95,
            reason="Automated Water Stress Demo Trigger",
            evidence=top_action.get("evidence", []),
            created_by="OrchestratorDemo",
        )
        db.add(action_plan)
        db.commit()
        db.refresh(action_plan)
        action_plan_data = {"id": action_plan.id, "title": action_plan.title, "status": action_plan.approval_status}

        # 4 & 5. If auto_execute, approve plan, create task & run virtual irrigation
        if req.auto_execute:
            action_plan.approval_status = "APPROVED"
            task = Task(
                action_plan_id=action_plan.id,
                farm_id=req.farm_id,
                field_id=req.field_id,
                zone_id=req.zone_id,
                title=action_plan.title,
                description=action_plan.description,
                task_type="IRRIGATION",
                status=TaskStatus.APPROVED,
            )
            db.add(task)
            db.commit()
            db.refresh(task)
            created_task = {"id": task.id, "status": task.status}

            # Create Irrigation Run and execute feedback loop
            irrigation_run = IrrigationRun(
                task_id=task.id,
                zone_id=req.zone_id,
                target_moisture=55.0,
                duration_minutes=30.0,
                status=ExecutionStatus.RUNNING,
            )
            db.add(irrigation_run)
            db.commit()
            db.refresh(irrigation_run)

            execution_result = execute_virtual_irrigation_feedback_loop(run=irrigation_run, db=db)

    # 6. Verify Recovery Telemetry
    latest_reading = (
        db.query(SensorReading)
        .filter(SensorReading.farm_id == req.farm_id)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )
    final_moisture = (
        latest_reading.measurements.get("soil_moisture")
        if latest_reading and latest_reading.measurements
        else None
    )

    event_bus.publish("simulation.water_stress.completed", {"farm_id": req.farm_id, "final_moisture": final_moisture})

    return {
        "status": "SUCCESS",
        "demo": "WATER_STRESS_CLOSED_LOOP",
        "farm_id": req.farm_id,
        "initial_moisture_triggered": req.soil_moisture,
        "orchestration_summary": {
            "overall_risk": orch_result.get("overall_risk"),
            "conflicts_detected": len(orch_result.get("conflicts_detected", [])),
            "actions_generated": len(orch_result.get("action_plan", [])),
        },
        "action_plan": action_plan_data,
        "task_created": created_task,
        "virtual_execution": execution_result,
        "post_execution_verified_moisture": final_moisture,
    }
