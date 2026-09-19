from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth_deps import get_current_user, require_farm_owner
from app.core.exceptions import NotFoundError
from app.db.database import get_db
from app.db.models.farm import Farm, Field
from app.db.models.user import User
from app.schemas.farm import FieldCreate, FieldResponse, FieldSummary

router = APIRouter(prefix="/fields", tags=["Fields"])


def _get_farm_or_404(farm_id: str, db: Session) -> Farm:
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise NotFoundError(f"Farm '{farm_id}' not found.")
    return farm


@router.get("", response_model=List[FieldSummary], summary="List all fields for authenticated user's farms")
def list_fields(
    farm_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Field).join(Farm, Field.farm_id == Farm.id)
    if current_user.role != "ADMIN":
        query = query.filter(Farm.user_id == current_user.id)
    if farm_id:
        query = query.filter(Field.farm_id == farm_id)
    fields = query.filter(Field.status == "ACTIVE").all()
    return [FieldSummary.model_validate(f) for f in fields]


@router.post("", response_model=FieldResponse, status_code=201, summary="Create a field in a farm")
def create_field(
    payload: FieldCreate,
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = _get_farm_or_404(farm_id, db)
    require_farm_owner(farm.user_id, current_user)

    field = Field(
        farm_id=farm.id,
        name=payload.name,
        area=payload.area,
        crop_id=payload.crop_id,
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
    if field.crop_id and field.crop:
        crop_name = field.crop.name
    return FieldResponse(
        id=field.id,
        farm_id=field.farm_id,
        name=field.name,
        area=field.area,
        crop_id=field.crop_id,
        crop_name=crop_name,
        boundary=field.boundary,
        status=field.status,
        created_at=field.created_at,
        updated_at=field.updated_at,
    )
