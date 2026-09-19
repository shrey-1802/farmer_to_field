from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.db.models.farm import Field, Farm
from app.db.models.sensor import Sensor, SensorReading
from app.services.crop_service import (
    list_crops,
    get_crop,
    get_growth_stage,
    calculate_irrigation_need,
    CROP_REGISTRY,
)
from app.services.weather_service import get_weather

router = APIRouter(tags=["Crops & Growth Intelligence"])


@router.get("/crops")
def get_all_crops():
    """
    List all supported crops with duration and water requirement specs.
    """
    return {"crops": list_crops(), "total": len(CROP_REGISTRY)}


@router.get("/crops/{crop_id}")
def get_crop_details(crop_id: str):
    """
    Get detailed profile of a specific crop including all growth stages,
    critical temperature ranges, and optimal soil pH.
    """
    crop = get_crop(crop_id)
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop '{crop_id}' not found in registry. Supported crops: {list(CROP_REGISTRY.keys())}",
        )
    return crop


@router.get("/crops/{crop_id}/stages")
def get_crop_stages(crop_id: str):
    """
    Get the ordered growth stages for a crop.
    """
    crop = get_crop(crop_id)
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop '{crop_id}' not found in registry",
        )
    return {
        "crop_id": crop_id,
        "name": crop["name"],
        "stages": crop["stages"],
        "total_duration_days": crop["total_duration_days"],
    }


@router.get("/crops/{crop_id}/stage-for-days")
def calculate_growth_stage(
    crop_id: str,
    days: int = Query(..., ge=0, description="Days since sowing"),
):
    """
    Determine the current growth stage for a crop given days elapsed since sowing.
    """
    stage = get_growth_stage(crop_id, days)
    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop '{crop_id}' not found in registry",
        )
    return stage


@router.get("/fields/{field_id}/crop-status")
def get_field_crop_status(
    field_id: str,
    db: Session = Depends(get_db),
):
    """
    Evaluate real-time crop growth status and irrigation need for a specific field.
    Combines:
    - Sowing date & growth stage
    - Current soil moisture from IoT sensors
    - Live ET0 from weather engine
    - Recommended irrigation action
    """
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Field '{field_id}' not found",
        )

    crop_id = field.crop_id or "wheat"
    days_since_sowing = None
    stage = None

    if field.sowing_date:
        days_since_sowing = max(0, (datetime.now(timezone.utc).date() - field.sowing_date).days)
        stage = get_growth_stage(crop_id, days_since_sowing)
    else:
        # Default to early stage if sowing date unknown
        stage = get_growth_stage(crop_id, 15)

    # Get latest soil moisture reading in this field
    sensors = db.query(Sensor).filter(
        Sensor.field_id == field.id,
        Sensor.sensor_type == "SOIL_MOISTURE",
    ).all()

    current_soil_moisture = None
    for s in sensors:
        latest = (
            db.query(SensorReading)
            .filter(SensorReading.sensor_id == s.id)
            .order_by(SensorReading.timestamp.desc())
            .first()
        )
        if latest and latest.measurements and "soil_moisture" in latest.measurements:
            current_soil_moisture = latest.measurements["soil_moisture"]
            break

    # Get farm weather for ET0
    farm = db.query(Farm).filter(Farm.id == field.farm_id).first()
    et0 = None
    if farm:
        weather = get_weather(farm.latitude, farm.longitude)
        if weather.get("weather_available"):
            et0 = weather.get("current", {}).get("et0_mm")

    target_sm = stage.get("soil_moisture_target_pct", 60.0) if stage else 60.0
    irrigation = calculate_irrigation_need(
        et0_mm=et0,
        soil_moisture_pct=current_soil_moisture,
        target_soil_moisture_pct=target_sm,
    )

    return {
        "field_id": field.id,
        "field_name": field.name,
        "crop_id": crop_id,
        "sowing_date": field.sowing_date.isoformat() if field.sowing_date else None,
        "days_since_sowing": days_since_sowing,
        "growth_stage": stage,
        "current_soil_moisture": current_soil_moisture,
        "et0_mm": et0,
        "irrigation_need": irrigation,
    }
