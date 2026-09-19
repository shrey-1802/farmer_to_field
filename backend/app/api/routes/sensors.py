from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.api.auth_deps import get_current_user, require_farm_owner
from app.core.exceptions import NotFoundError
from app.db.database import get_db
from app.db.models.farm import Farm, Field, Zone
from app.db.models.sensor import Sensor, SensorReading, SensorSource, SensorStatus, ReadingQuality
from app.db.models.user import User
from app.schemas.sensor import SensorCreate, SensorResponse, SensorReadingResponse
from app.simulation.sensor_simulator import generate_sensor_reading

router = APIRouter(prefix="/sensors", tags=["Sensors"])


def _get_farm_and_verify(farm_id: str, db: Session, current_user: User) -> Farm:
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise NotFoundError(f"Farm '{farm_id}' not found.")
    require_farm_owner(farm.user_id, current_user)
    return farm


@router.get("", response_model=List[SensorResponse], summary="List sensors for a farm")
def list_sensors(
    farm_id: str = Query(..., description="Farm ID to filter sensors"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_farm_and_verify(farm_id, db, current_user)
    sensors = db.query(Sensor).filter(Sensor.farm_id == farm_id).all()
    return [SensorResponse.model_validate(s) for s in sensors]


@router.post("", response_model=SensorResponse, status_code=201, summary="Create a virtual sensor")
def create_sensor(
    payload: SensorCreate,
    farm_id: str = Query(..., description="Farm ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_farm_and_verify(farm_id, db, current_user)
    sensor = Sensor(
        farm_id=farm_id,
        field_id=payload.field_id,
        zone_id=payload.zone_id,
        name=payload.name,
        sensor_type=payload.sensor_type,
        source=payload.source,
        unit=payload.unit,
        status=SensorStatus.ONLINE,
        configuration=payload.configuration,
        last_seen=datetime.now(timezone.utc),
    )
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return SensorResponse.model_validate(sensor)


@router.get("/{sensor_id}", response_model=SensorResponse, summary="Get sensor details")
def get_sensor(
    sensor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise NotFoundError(f"Sensor '{sensor_id}' not found.")
    _get_farm_and_verify(sensor.farm_id, db, current_user)
    return SensorResponse.model_validate(sensor)


@router.get("/{sensor_id}/readings", response_model=List[SensorReadingResponse], summary="Get sensor telemetry readings")
def get_sensor_readings(
    sensor_id: str,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise NotFoundError(f"Sensor '{sensor_id}' not found.")
    _get_farm_and_verify(sensor.farm_id, db, current_user)

    readings = (
        db.query(SensorReading)
        .filter(SensorReading.sensor_id == sensor_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [SensorReadingResponse.model_validate(r) for r in readings]


@router.post("/telemetry", status_code=201, summary="Ingest a single sensor telemetry reading (physical IoT gateway)")
def ingest_telemetry(
    sensor_id: str,
    measurements: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept a normalized reading from a physical IoT gateway or external system."""
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise NotFoundError(f"Sensor '{sensor_id}' not found.")
    _get_farm_and_verify(sensor.farm_id, db, current_user)

    reading = SensorReading(
        sensor_id=sensor.id,
        farm_id=sensor.farm_id,
        field_id=sensor.field_id,
        zone_id=sensor.zone_id,
        timestamp=datetime.now(timezone.utc),
        measurements=measurements,
        quality=ReadingQuality.GOOD,
        source=sensor.source,
    )
    db.add(reading)
    sensor.last_seen = datetime.now(timezone.utc)
    db.commit()
    db.refresh(reading)
    return {"message": "Telemetry reading ingested.", "reading_id": reading.id}
