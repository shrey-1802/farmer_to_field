from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth_deps import get_current_user, require_farm_owner
from app.core.exceptions import NotFoundError
from app.db.database import get_db
from app.db.models.farm import Farm, Field, Zone
from app.db.models.user import User
from app.schemas.farm import ZoneCreate, ZoneResponse

router = APIRouter(prefix="/zones", tags=["Zones"])


def _get_field_and_verify_owner(field_id: str, db: Session, current_user: User) -> Field:
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise NotFoundError(f"Field '{field_id}' not found.")
    farm = db.query(Farm).filter(Farm.id == field.farm_id).first()
    if not farm:
        raise NotFoundError(f"Farm for field '{field_id}' not found.")
    require_farm_owner(farm.user_id, current_user)
    return field


@router.get("", response_model=List[ZoneResponse], summary="List zones for a field")
def list_zones(
    field_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_field_and_verify_owner(field_id, db, current_user)
    zones = db.query(Zone).filter(Zone.field_id == field_id, Zone.status == "ACTIVE").all()
    return [ZoneResponse.model_validate(z) for z in zones]


@router.post("", response_model=ZoneResponse, status_code=201, summary="Create a zone in a field")
def create_zone(
    payload: ZoneCreate,
    field_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_field_and_verify_owner(field_id, db, current_user)
    zone = Zone(
        field_id=field_id,
        name=payload.name,
        area=payload.area,
        crop_stage=payload.crop_stage,
        boundary=payload.boundary,
        status="ACTIVE",
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return ZoneResponse.model_validate(zone)


@router.get("/{zone_id}", response_model=ZoneResponse, summary="Get a zone by ID")
def get_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise NotFoundError(f"Zone '{zone_id}' not found.")
    _get_field_and_verify_owner(zone.field_id, db, current_user)
    return ZoneResponse.model_validate(zone)
