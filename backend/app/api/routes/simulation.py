"""
Simulation API Routes
BACKEND.md Phase 11

All simulation endpoints modify real backend state (scenario store + telemetry).
They do NOT return fake success - they change the active scenario so virtual
sensors start generating readings under the new conditions immediately.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.api.auth_deps import get_current_user, require_farm_owner
from app.core.exceptions import NotFoundError
from app.core.logging import logger
from app.db.database import get_db
from app.db.models.farm import Farm
from app.db.models.sensor import Sensor, SensorStatus
from app.db.models.user import User
from app.schemas.sensor import SimulationStatusResponse
from app.simulation.sensor_simulator import (
    ScenarioType, set_scenario, reset_scenario,
    get_simulation_status, _generate_reading_now
)
from app.simulation.sensor_worker import _generate_all_virtual_readings

router = APIRouter(prefix="/simulation", tags=["Simulation"])


def _verify_farm(farm_id: str, db: Session, current_user: User) -> Farm:
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise NotFoundError(f"Farm '{farm_id}' not found.")
    require_farm_owner(farm.user_id, current_user)
    return farm


def _activate_scenario(farm_id: str, scenario: str, db: Session, params: dict = None) -> dict:
    set_scenario(farm_id, scenario, params)
    # Immediately generate readings with new scenario so frontend sees change now
    _generate_all_virtual_readings()
    logger.info(f"Simulation scenario '{scenario}' activated for farm {farm_id}")
    return {
        "message": f"Scenario '{scenario}' activated for farm {farm_id}.",
        "scenario": scenario,
        "farm_id": farm_id,
        "activated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/status", response_model=SimulationStatusResponse, summary="Get active simulation scenario")
def get_status(
    farm_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_farm(farm_id, db, current_user)
    return get_simulation_status(farm_id)


@router.post("/water-stress", summary="Activate water stress scenario")
def water_stress(
    farm_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Activates WATER_STRESS scenario:
    - Soil moisture begins declining rapidly
    - Ambient temperature rises
    - Humidity drops
    - Triggers downstream agent analysis and risk assessment
    """
    _verify_farm(farm_id, db, current_user)
    return _activate_scenario(farm_id, ScenarioType.WATER_STRESS, db)


@router.post("/heavy-rain", summary="Activate heavy rain scenario")
def heavy_rain(
    farm_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Activates HEAVY_RAIN scenario:
    - Soil moisture rises toward saturation
    - Humidity spikes
    - Nutrient leaching begins
    - Irrigation recommendations suppressed
    """
    _verify_farm(farm_id, db, current_user)
    return _activate_scenario(farm_id, ScenarioType.HEAVY_RAIN, db)


@router.post("/heat-wave", summary="Activate heat wave scenario")
def heat_wave(
    farm_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Activates HEAT_WAVE scenario:
    - Temperature rises sharply
    - Soil moisture depletes faster
    - Humidity drops
    """
    _verify_farm(farm_id, db, current_user)
    return _activate_scenario(farm_id, ScenarioType.HEAT_WAVE, db)


@router.post("/disease", summary="Activate disease-favorable conditions scenario")
def disease_scenario(
    farm_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Activates DISEASE_FAVORABLE scenario:
    - High humidity + elevated temperature = fungal/bacterial risk
    - Triggers disease detection pipeline
    """
    _verify_farm(farm_id, db, current_user)
    return _activate_scenario(farm_id, ScenarioType.DISEASE_FAVORABLE, db)


@router.post("/nutrient", summary="Activate nutrient deficiency scenario")
def nutrient_scenario(
    farm_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Activates NUTRIENT_DEFICIENCY scenario:
    - N, P, K values decline rapidly
    - Triggers nutrient agent and fertilization recommendations
    """
    _verify_farm(farm_id, db, current_user)
    return _activate_scenario(farm_id, ScenarioType.NUTRIENT_DEFICIENCY, db)


@router.post("/sensor-failure", summary="Simulate sensor failure")
def sensor_failure(
    farm_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Activates SENSOR_FAILURE scenario:
    - Virtual sensors report INVALID readings
    - Sensor status set to OFFLINE
    - Triggers alert and expert escalation
    """
    _verify_farm(farm_id, db, current_user)
    # Also mark sensors OFFLINE in DB for realism
    sensors = db.query(Sensor).filter(
        Sensor.farm_id == farm_id,
        Sensor.source == "virtual_sensor"
    ).all()
    for s in sensors:
        s.status = SensorStatus.OFFLINE
    db.commit()
    return _activate_scenario(farm_id, ScenarioType.SENSOR_FAILURE, db)


@router.post("/reset", summary="Reset simulation to NORMAL conditions")
def reset_simulation(
    farm_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Resets all sensors and scenario back to NORMAL.
    Virtual sensors come back online immediately.
    """
    _verify_farm(farm_id, db, current_user)
    reset_scenario(farm_id)
    # Bring sensors back online
    sensors = db.query(Sensor).filter(
        Sensor.farm_id == farm_id,
        Sensor.source == "virtual_sensor"
    ).all()
    for s in sensors:
        s.status = SensorStatus.ONLINE
    db.commit()
    _generate_all_virtual_readings()
    logger.info(f"Simulation reset to NORMAL for farm {farm_id}")
    return {
        "message": f"Simulation reset to NORMAL for farm {farm_id}.",
        "farm_id": farm_id,
        "scenario": ScenarioType.NORMAL,
    }
