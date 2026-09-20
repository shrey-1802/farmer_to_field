from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth_deps import get_current_user, require_farm_owner
from app.core.exceptions import NotFoundError
from app.db.database import get_db
from app.db.models.farm import Farm, Field
from app.db.models.crop import Crop
from app.db.models.user import User
from app.schemas.farm import FieldCreate, FieldResponse, FieldSummary

router = APIRouter(prefix="/fields", tags=["Fields"])


def _get_farm_or_404(farm_id: str, db: Session) -> Farm:
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise NotFoundError(f"Farm '{farm_id}' not found.")
    return farm


@router.get("", response_model=List[FieldResponse], summary="List all fields for authenticated user's farms")
def list_fields(
    farm_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Field).join(Farm, Field.farm_id == Farm.id)
    if current_user.role != "ADMIN":
        query = query.filter(Farm.user_id == current_user.id)
    if farm_id:
        query = query.filter(Field.farm_id == farm_id)
    fields = query.filter(Field.status == "ACTIVE").all()
    return [_field_response(f, db) for f in fields]


@router.post("", response_model=FieldResponse, status_code=201, summary="Create a field in a farm")
def create_field(
    payload: FieldCreate,
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = _get_farm_or_404(farm_id, db)
    require_farm_owner(farm.user_id, current_user)

    # Resolve crop_id if user passed a crop name (e.g. 'cotton' or 'wheat')
    resolved_crop_id = payload.crop_id
    if payload.crop_id:
        crop_match = db.query(Crop).filter(
            (Crop.id == payload.crop_id) | (Crop.name.ilike(payload.crop_id))
        ).first()
        if crop_match:
            resolved_crop_id = crop_match.id

    field = Field(
        farm_id=farm.id,
        name=payload.name,
        area=payload.area,
        orientation=payload.orientation or "Full Field",
        soil_type=payload.soil_type or farm.soil_type or "Loamy",
        crop_id=resolved_crop_id,
        sowing_date=payload.sowing_date,
        boundary=payload.boundary,
        status="ACTIVE",
    )
    db.add(field)
    db.commit()
    db.refresh(field)
    return _field_response(field, db)


@router.get("/{field_id}", response_model=FieldResponse, summary="Get a field by ID")
def get_field(
    field_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise NotFoundError(f"Field '{field_id}' not found.")
    farm = _get_farm_or_404(field.farm_id, db)
    require_farm_owner(farm.user_id, current_user)
    return _field_response(field, db)


def _field_response(field: Field, db: Session) -> FieldResponse:
    crop_name = None
    if field.crop_id:
        if field.crop:
            crop_name = field.crop.name
        else:
            c = db.query(Crop).filter(Crop.id == field.crop_id).first()
            if c:
                crop_name = c.name

    return FieldResponse(
        id=field.id,
        farm_id=field.farm_id,
        name=field.name,
        area=field.area,
        orientation=field.orientation or "Full Field",
        soil_type=field.soil_type,
        crop_id=field.crop_id,
        crop_name=crop_name,
        sowing_date=field.sowing_date,
        boundary=field.boundary,
        status=field.status,
        created_at=field.created_at,
        updated_at=field.updated_at,
    )
