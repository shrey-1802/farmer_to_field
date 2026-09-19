from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.db.models.farm import Farm
from app.services.context_service import build_farm_context

router = APIRouter(tags=["Farm Context Aggregation"])


@router.get("/farms/{farm_id}/context")
def get_farm_context(
    farm_id: str,
    field_id: Optional[str] = Query(None, description="Optional field filter"),
    zone_id: Optional[str] = Query(None, description="Optional zone filter"),
    db: Session = Depends(get_db),
):
    """
    Standardized Context Aggregator (BACKEND.md Phase 15).
    Assembles a complete, structured context dictionary for a farm:
    - Farm metadata, soil profile, irrigation system
    - Field & Zone details with growth stage
    - Latest IoT sensor readings and short-term drift/trends
    - Live/cached Open-Meteo weather and ET0
    - Calculated irrigation deficit and immediate recommendations

    This object serves as the canonical input to all downstream AI agents.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm '{farm_id}' not found",
        )

    context = build_farm_context(farm_id=farm_id, db=db, field_id=field_id, zone_id=zone_id)
    return context
