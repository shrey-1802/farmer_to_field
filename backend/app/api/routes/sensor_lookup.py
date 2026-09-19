from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth_deps import get_current_user, require_farm_owner
from app.core.exceptions import NotFoundError
from app.db.database import get_db
from app.db.models.farm import Zone
from app.db.models.farm import Farm, Field
from app.db.models.sensor import Sensor
from app.db.models.user import User
from app.schemas.sensor import SensorResponse

# Extra zone-sensor lookup route (mounted under zones prefix)
zones_sensor_router = APIRouter(prefix="/zones", tags=["Zones", "Sensors"])


@zones_sensor_router.get("/{zone_id}/sensors", response_model=List[SensorResponse], summary="List sensors in a zone")
def get_zone_sensors(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise NotFoundError(f"Zone '{zone_id}' not found.")
    field = db.query(Field).filter(Field.id == zone.field_id).first()
    if not field:
        raise NotFoundError(f"Field for zone '{zone_id}' not found.")
    farm = db.query(Farm).filter(Farm.id == field.farm_id).first()
    if not farm:
        raise NotFoundError(f"Farm not found.")
    require_farm_owner(farm.user_id, current_user)
    sensors = db.query(Sensor).filter(Sensor.zone_id == zone_id).all()
    return [SensorResponse.model_validate(s) for s in sensors]


# Extra field-sensor lookup route
fields_sensor_router = APIRouter(prefix="/fields", tags=["Fields", "Sensors"])


@fields_sensor_router.get("/{field_id}/sensors", response_model=List[SensorResponse], summary="List sensors in a field")
def get_field_sensors(
    field_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise NotFoundError(f"Field '{field_id}' not found.")
    farm = db.query(Farm).filter(Farm.id == field.farm_id).first()
    if not farm:
        raise NotFoundError(f"Farm not found.")
    require_farm_owner(farm.user_id, current_user)
    sensors = db.query(Sensor).filter(Sensor.field_id == field_id).all()
    return [SensorResponse.model_validate(s) for s in sensors]
