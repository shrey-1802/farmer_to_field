from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.db.models.farm import Farm
from app.db.models.weather import WeatherRecord
from app.services.weather_service import get_weather

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/current")
def get_current_weather(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
):
    """
    Get current weather for specified coordinates.
    Never fabricates data; returns cached or weather_available=false on provider failure.
    """
    data = get_weather(lat, lon)
    if not data.get("weather_available"):
        return {
            "weather_available": False,
            "source": None,
            "stale": False,
            "location": {"latitude": lat, "longitude": lon},
        }

    return {
        "source": data.get("source"),
        "stale": data.get("stale", False),
        "weather_available": True,
        "location": data.get("location"),
        "current": data.get("current"),
        "fetched_at": data.get("fetched_at"),
    }


@router.get("/forecast")
def get_weather_forecast(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
):
    """
    Get 7-day daily weather forecast for coordinates.
    """
    data = get_weather(lat, lon)
    if not data.get("weather_available"):
        return {
            "weather_available": False,
            "source": None,
            "stale": False,
            "location": {"latitude": lat, "longitude": lon},
        }

    return {
        "source": data.get("source"),
        "stale": data.get("stale", False),
        "weather_available": True,
        "location": data.get("location"),
        "daily": data.get("daily"),
        "fetched_at": data.get("fetched_at"),
    }


@router.get("/hourly")
def get_hourly_weather(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
):
    """
    Get 24-hour hourly weather forecast for coordinates.
    """
    data = get_weather(lat, lon)
    if not data.get("weather_available"):
        return {
            "weather_available": False,
            "source": None,
            "stale": False,
            "location": {"latitude": lat, "longitude": lon},
        }

    return {
        "source": data.get("source"),
        "stale": data.get("stale", False),
        "weather_available": True,
        "location": data.get("location"),
        "hourly": data.get("hourly"),
        "fetched_at": data.get("fetched_at"),
    }


@router.get("/farm/{farm_id}")
def get_farm_weather(
    farm_id: str,
    db: Session = Depends(get_db),
):
    """
    Fetch live/cached weather using the farm's saved coordinates.
    Automatically persists a snapshot to WeatherRecord in the database.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm '{farm_id}' not found",
        )

    data = get_weather(farm.latitude, farm.longitude)

    # Persist snapshot if live or cached current weather is present
    current = data.get("current")
    if current and current.get("temperature_c") is not None:
        try:
            record = WeatherRecord(
                farm_id=farm.id,
                latitude=farm.latitude,
                longitude=farm.longitude,
                temperature=current.get("temperature_c") or 0.0,
                relative_humidity=current.get("relative_humidity_pct") or 0.0,
                precipitation=current.get("precipitation_mm") or 0.0,
                wind_speed=current.get("wind_speed_kmh") or 0.0,
                weather_code=current.get("weather_code") or 0,
                source=data.get("source") or "unknown",
                is_stale=data.get("stale", False),
            )
            db.add(record)
            db.commit()
        except Exception:
            db.rollback()

    return {
        "farm_id": farm.id,
        "farm_name": farm.name,
        **data,
    }
