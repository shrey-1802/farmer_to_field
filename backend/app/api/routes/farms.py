from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth_deps import get_current_user, require_farm_owner
from app.core.exceptions import NotFoundError
from app.db.database import get_db
from app.db.models.farm import Farm
from app.db.models.user import User
from app.schemas.farm import FarmCreate, FarmResponse, FarmSummary

router = APIRouter(prefix="/farms", tags=["Farms"])


@router.get("", response_model=List[FarmSummary], summary="List all farms for authenticated user")
def list_farms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Farm)
    if current_user.role != "ADMIN":
        query = query.filter(Farm.user_id == current_user.id)
    farms = query.filter(Farm.status == "ACTIVE").all()
    return [FarmSummary.model_validate(f) for f in farms]


@router.post("", response_model=FarmResponse, status_code=201, summary="Create a new farm")
def create_farm(
    payload: FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = Farm(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        area=payload.area,
        pincode=payload.pincode,
        district=payload.district,
        state=payload.state,
        soil_type=payload.soil_type or "Loamy",
        irrigation_type=payload.irrigation_type or "Drip & Sprinkler",
        boundary=payload.boundary,
        status="ACTIVE",
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return FarmResponse.model_validate(farm)


@router.get("/{farm_id}", response_model=FarmResponse, summary="Get a farm by ID")
def get_farm(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise NotFoundError(f"Farm '{farm_id}' not found.")
    require_farm_owner(farm.user_id, current_user)
    return FarmResponse.model_validate(farm)


@router.delete("/{farm_id}", summary="Soft-delete a farm")
def delete_farm(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise NotFoundError(f"Farm '{farm_id}' not found.")
    require_farm_owner(farm.user_id, current_user)
    farm.status = "ARCHIVED"
    db.commit()
    return {"message": f"Farm '{farm.name}' archived successfully."}
