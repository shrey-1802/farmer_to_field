"""
Farm Context Aggregation Service
BACKEND.md Phase 15

Assembles a complete context object that becomes the standardized input
to all agents (Soil Agent, Weather Agent, Advisory Agent, etc.)
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.core.logging import logger
from app.db.models.farm import Farm, Field, Zone
from app.db.models.sensor import Sensor, SensorReading
from app.services.weather_service import get_weather
from app.services.crop_service import get_growth_stage, calculate_irrigation_need


def build_farm_context(
    farm_id: str,
    db: Session,
    field_id: Optional[str] = None,
    zone_id: Optional[str] = None,
) -> dict:
    """
    Assemble the full farm context object for agent inputs.
    Collects: farm, field, zone, crop stage, latest sensor readings,
              sensor trends, weather, forecast, and irrigation need.
    """
    ctx: dict = {
        "context_version": "1.0",
        "assembled_at": datetime.now(timezone.utc).isoformat(),
        "farm": None,
        "field": None,
        "zone": None,
        "crop_stage": None,
        "sensor_summary": {},
        "sensor_trends": {},
        "weather": {"weather_available": False},
        "irrigation_need": None,
    }

    # ── Farm ────────────────────────────────────────────────────────────
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        return ctx
    ctx["farm"] = {
        "id": farm.id,
        "name": farm.name,
        "latitude": farm.latitude,
        "longitude": farm.longitude,
        "area": farm.area,
        "soil_type": farm.soil_type,
        "irrigation_type": farm.irrigation_type,
    }

    # ── Field ────────────────────────────────────────────────────────────
    if field_id:
        field = db.query(Field).filter(Field.id == field_id, Field.farm_id == farm_id).first()
        if field:
            ctx["field"] = {
                "id": field.id,
                "name": field.name,
                "area": field.area,
                "crop_id": field.crop_id,
            }
            # Crop stage detection
            if field.crop_id and field.sowing_date:
                days_since_sowing = (datetime.now(timezone.utc).date() - field.sowing_date).days
                stage = get_growth_stage(field.crop_id, max(0, days_since_sowing))
                ctx["crop_stage"] = stage

    # ── Zone ─────────────────────────────────────────────────────────────
    if zone_id:
        zone = db.query(Zone).filter(Zone.id == zone_id).first()
        if zone:
            ctx["zone"] = {
                "id": zone.id,
                "name": zone.name,
                "area": zone.area,
                "crop_stage": zone.crop_stage,
            }

    # ── Sensor Summary (latest reading per sensor_type) ─────────────────
    sensor_query = db.query(Sensor).filter(Sensor.farm_id == farm_id)
    if zone_id:
        sensor_query = sensor_query.filter(Sensor.zone_id == zone_id)
    elif field_id:
        sensor_query = sensor_query.filter(Sensor.field_id == field_id)
    sensors = sensor_query.all()

    summary: dict = {}
    trends: dict = {}

    for sensor in sensors:
        # Latest 1 reading
        latest = (
            db.query(SensorReading)
            .filter(SensorReading.sensor_id == sensor.id)
            .order_by(SensorReading.timestamp.desc())
            .first()
        )
        if latest and latest.measurements:
            summary[sensor.sensor_type] = {
                "sensor_id": sensor.id,
                "sensor_name": sensor.name,
                "status": sensor.status,
                "timestamp": latest.timestamp.isoformat(),
                "measurements": latest.measurements,
                "quality": latest.quality,
            }

        # Trend: last 5 readings for numeric drift
        recent_5 = (
            db.query(SensorReading)
            .filter(SensorReading.sensor_id == sensor.id)
            .order_by(SensorReading.timestamp.desc())
            .limit(5)
            .all()
        )
        if len(recent_5) >= 2:
            first_m = recent_5[-1].measurements or {}
            last_m = recent_5[0].measurements or {}
            drift = {}
            for key in first_m:
                if isinstance(first_m[key], (int, float)) and key in last_m:
                    drift[key] = round(last_m[key] - first_m[key], 2)
            if drift:
                trends[sensor.sensor_type] = drift

    ctx["sensor_summary"] = summary
    ctx["sensor_trends"] = trends

    # ── Weather ──────────────────────────────────────────────────────────
    try:
        ctx["weather"] = get_weather(farm.latitude, farm.longitude)
    except Exception as exc:
        logger.warning(f"Weather fetch failed for farm {farm_id}: {exc}")
        ctx["weather"] = {"weather_available": False, "source": None}

    # ── Irrigation Need ──────────────────────────────────────────────────
    try:
        soil_m = summary.get("SOIL_MOISTURE", {}).get("measurements", {})
        current_sm = soil_m.get("soil_moisture")
        et0 = (
            ctx["weather"]
            .get("current", {})
            .get("et0_mm") if ctx["weather"].get("weather_available") else None
        )
        target_sm = 60.0  # Default target; overridden by crop stage if available
        if ctx["crop_stage"]:
            target_sm = ctx["crop_stage"].get("soil_moisture_target_pct", 60.0)

        if current_sm is not None or et0 is not None:
            ctx["irrigation_need"] = calculate_irrigation_need(
                et0_mm=et0,
                soil_moisture_pct=current_sm,
                target_soil_moisture_pct=target_sm,
            )
    except Exception as exc:
        logger.warning(f"Irrigation need calculation failed: {exc}")

    return ctx
