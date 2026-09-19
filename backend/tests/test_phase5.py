"""
Phase 5 Comprehensive Test Suite
BACKEND.md Phases 12, 13, 14, 15:
- Phase 12: Live Weather Service (Open-Meteo adapter, normalization, caching)
- Phase 13: Weather Failure Strategy (graceful cache fallback, no fake weather)
- Phase 14: Weather API (current, forecast, hourly, farm-based)
- Phase 15: Crop Intelligence, Growth Stages, ET0 Irrigation Need & Farm Context Aggregator
"""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.services.weather_service import get_weather, _weather_cache, _cache_key
from app.services.crop_service import (
    list_crops,
    get_crop,
    get_growth_stage,
    calculate_irrigation_need,
    CROP_REGISTRY,
)
from app.services.context_service import build_farm_context
from app.db.database import SessionLocal
from app.db.models.farm import Farm, Field, Zone
from app.db.models.sensor import Sensor, SensorReading
from app.db.models.weather import WeatherRecord


client = TestClient(app)


# ==============================================================================
# 1. WEATHER SERVICE UNIT TESTS (PHASE 12 & 13)
# ==============================================================================

def test_crop_registry_completeness():
    """Verify registry has key crops and valid stage properties."""
    crops = list_crops()
    assert len(crops) >= 6
    crop_ids = [c["id"] for c in crops]
    assert "wheat" in crop_ids
    assert "rice" in crop_ids
    assert "cotton" in crop_ids

    wheat = get_crop("wheat")
    assert wheat is not None
    assert wheat["total_duration_days"] == 120
    assert len(wheat["stages"]) == 7
    assert wheat["optimal_soil_ph"] == (6.0, 7.5)


def test_growth_stage_progression():
    """Verify growth stage transitions correctly based on days since sowing."""
    # Wheat: Germination (10 days), Seedling (20 days -> day 11 to 30), Tillering (25 days -> day 31 to 55)
    stage_early = get_growth_stage("wheat", 5)
    assert stage_early["stage_name"] == "Germination"
    assert stage_early["days_in_stage"] == 5

    stage_mid = get_growth_stage("wheat", 25)
    assert stage_mid["stage_name"] == "Seedling"

    stage_later = get_growth_stage("wheat", 45)
    assert stage_later["stage_name"] == "Tillering"

    # Post-maturity
    stage_post = get_growth_stage("wheat", 150)
    assert stage_post["stage_name"] == "Post-Maturity"
    assert stage_post["stage_progress_pct"] == 100


def test_irrigation_need_calculator():
    """Verify ET0 & soil moisture deficit logic."""
    # Deficit > 15% should trigger IRRIGATE_IMMEDIATELY
    calc1 = calculate_irrigation_need(
        et0_mm=4.5,
        soil_moisture_pct=40.0,
        target_soil_moisture_pct=70.0,
    )
    assert calc1["soil_moisture_deficit_pct"] == 30.0
    assert calc1["recommendation"] == "IRRIGATE_IMMEDIATELY"
    assert calc1["irrigation_need_mm"] > 0
    assert calc1["etc_mm_per_day"] == 4.5

    # Low deficit should recommend MONITOR or NO_IRRIGATION_NEEDED
    calc2 = calculate_irrigation_need(
        et0_mm=3.0,
        soil_moisture_pct=68.0,
        target_soil_moisture_pct=70.0,
    )
    assert calc2["recommendation"] == "MONITOR"

    calc3 = calculate_irrigation_need(
        et0_mm=3.0,
        soil_moisture_pct=75.0,
        target_soil_moisture_pct=70.0,
    )
    assert calc3["recommendation"] == "NO_IRRIGATION_NEEDED"


def test_weather_caching_and_failure_strategy():
    """Phase 13: When live fetch fails, fallback to cache or return weather_available=False."""
    lat, lon = 19.0760, 72.8777
    key = _cache_key(lat, lon)
    _weather_cache.pop(key, None)

    # 1. Failure with no cache -> weather_available: False, source: None (NEVER fake data)
    with patch("app.services.weather_service._fetch_open_meteo", return_value=None):
        result = get_weather(lat, lon)
        assert result["weather_available"] is False
        assert result["source"] is None

    # 2. Populate cache with mock entry
    _weather_cache[key] = {
        "source": "live",
        "stale": False,
        "weather_available": True,
        "location": {"latitude": lat, "longitude": lon},
        "current": {"temperature_c": 29.5, "relative_humidity_pct": 75.0},
        "fetched_at": "2026-09-19T00:00:00Z",
    }

    # 3. Live fetch fails but cache exists -> returns stale=True, source="cached"
    with patch("app.services.weather_service._fetch_open_meteo", return_value=None):
        result_stale = get_weather(lat, lon)
        assert result_stale["weather_available"] is True
        assert result_stale["source"] == "cached"
        assert result_stale["stale"] is True
        assert result_stale["current"]["temperature_c"] == 29.5


# ==============================================================================
# 2. WEATHER API ENDPOINTS (PHASE 14)
# ==============================================================================

def test_weather_endpoints_mocked():
    """Verify /api/weather/current, /forecast, /hourly return normalized structures."""
    mock_weather = {
        "source": "live",
        "stale": False,
        "weather_available": True,
        "location": {"latitude": 28.6139, "longitude": 77.2090, "timezone": "Asia/Kolkata"},
        "current": {
            "time": "2026-09-19T12:00",
            "temperature_c": 31.2,
            "feels_like_c": 33.0,
            "relative_humidity_pct": 65.0,
            "precipitation_mm": 0.0,
            "rain_mm": 0.0,
            "cloud_cover_pct": 20.0,
            "wind_speed_kmh": 12.5,
            "wind_direction_deg": 180,
            "weather_code": 1,
            "et0_mm": 4.2,
        },
        "hourly": {
            "times": ["2026-09-19T12:00", "2026-09-19T13:00"],
            "temperature_c": [31.2, 32.0],
            "humidity_pct": [65.0, 62.0],
            "precipitation_prob_pct": [10, 15],
            "precipitation_mm": [0.0, 0.0],
            "wind_speed_kmh": [12.5, 14.0],
            "et0_mm": [0.5, 0.6],
        },
        "daily": {
            "dates": ["2026-09-19", "2026-09-20"],
            "temp_max_c": [34.0, 33.5],
            "temp_min_c": [24.0, 23.5],
            "precipitation_sum_mm": [0.0, 2.5],
            "precipitation_prob_max_pct": [20, 60],
            "et0_mm": [4.5, 3.8],
            "wind_max_kmh": [18.0, 22.0],
            "weather_codes": [1, 51],
        },
        "fetched_at": "2026-09-19T12:00:00Z",
    }

    with patch("app.api.routes.weather.get_weather", return_value=mock_weather):
        # Current
        res_current = client.get("/api/weather/current?lat=28.6139&lon=77.2090")
        assert res_current.status_code == 200
        data_c = res_current.json()
        assert data_c["weather_available"] is True
        assert data_c["current"]["temperature_c"] == 31.2

        # Forecast
        res_forecast = client.get("/api/weather/forecast?lat=28.6139&lon=77.2090")
        assert res_forecast.status_code == 200
        data_f = res_forecast.json()
        assert "daily" in data_f
        assert len(data_f["daily"]["dates"]) == 2

        # Hourly
        res_hourly = client.get("/api/weather/hourly?lat=28.6139&lon=77.2090")
        assert res_hourly.status_code == 200
        data_h = res_hourly.json()
        assert "hourly" in data_h
        assert len(data_h["hourly"]["times"]) == 2


def test_weather_validation_errors():
    """Verify coordinates outside valid bounds return 422 Unprocessable Entity."""
    res = client.get("/api/weather/current?lat=120.0&lon=77.0")
    assert res.status_code == 422

    res2 = client.get("/api/weather/current?lat=20.0&lon=200.0")
    assert res2.status_code == 422


def test_farm_weather_endpoint_and_db_persistence():
    """Phase 14: GET /api/weather/farm/{farm_id} uses farm coordinates and saves WeatherRecord."""
    db = SessionLocal()
    farm = db.query(Farm).first()
    assert farm is not None
    farm_id = farm.id
    db.close()

    mock_weather = {
        "source": "live",
        "stale": False,
        "weather_available": True,
        "location": {"latitude": farm.latitude, "longitude": farm.longitude},
        "current": {
            "temperature_c": 28.4,
            "relative_humidity_pct": 58.0,
            "precipitation_mm": 0.0,
            "wind_speed_kmh": 10.2,
            "weather_code": 0,
            "et0_mm": 3.8,
        },
        "fetched_at": "2026-09-19T12:00:00Z",
    }

    with patch("app.api.routes.weather.get_weather", return_value=mock_weather):
        res = client.get(f"/api/weather/farm/{farm_id}")
        assert res.status_code == 200
        data = res.json()
        assert data["farm_id"] == farm_id
        assert data["current"]["temperature_c"] == 28.4

    # Verify database persistence
    db = SessionLocal()
    record = (
        db.query(WeatherRecord)
        .filter(WeatherRecord.farm_id == farm_id)
        .order_by(WeatherRecord.created_at.desc())
        .first()
    )
    assert record is not None
    assert record.temperature == 28.4
    assert record.source == "live"
    db.close()


# ==============================================================================
# 3. CROP INTELLIGENCE API ENDPOINTS
# ==============================================================================

def test_crop_api_endpoints():
    """Verify /api/crops, /api/crops/{crop_id}, /stages, and /stage-for-days."""
    # List crops
    res = client.get("/api/crops")
    assert res.status_code == 200
    crops = res.json()["crops"]
    assert len(crops) >= 6

    # Specific crop
    res_wheat = client.get("/api/crops/wheat")
    assert res_wheat.status_code == 200
    assert res_wheat.json()["name"] == "Wheat"

    # Non-existent crop
    res_unknown = client.get("/api/crops/dragonfruit")
    assert res_unknown.status_code == 404

    # Crop stages
    res_stages = client.get("/api/crops/rice/stages")
    assert res_stages.status_code == 200
    assert len(res_stages.json()["stages"]) == 5

    # Stage for days
    res_calc = client.get("/api/crops/cotton/stage-for-days?days=35")
    assert res_calc.status_code == 200
    data_stage = res_calc.json()
    assert data_stage["crop_id"] == "cotton"
    assert "stage_name" in data_stage


def test_field_crop_status():
    """Verify GET /api/fields/{id}/crop-status returns stage, moisture & recommendation."""
    db = SessionLocal()
    field = db.query(Field).first()
    assert field is not None
    field_id = field.id
    db.close()

    res = client.get(f"/api/fields/{field_id}/crop-status")
    assert res.status_code == 200
    data = res.json()
    assert data["field_id"] == field_id
    assert "growth_stage" in data
    assert "irrigation_need" in data
    assert "recommendation" in data["irrigation_need"]


# ==============================================================================
# 4. STANDARDIZED FARM CONTEXT AGGREGATOR (PHASE 15)
# ==============================================================================

def test_farm_context_aggregator():
    """Phase 15: GET /api/farms/{farm_id}/context returns complete structured agent input."""
    db = SessionLocal()
    farm = db.query(Farm).first()
    field = db.query(Field).filter(Field.farm_id == farm.id).first()
    db.close()

    res = client.get(f"/api/farms/{farm.id}/context?field_id={field.id if field else ''}")
    assert res.status_code == 200
    context = res.json()

    # Core required keys per Phase 15
    assert context["context_version"] == "1.0"
    assert "assembled_at" in context
    assert context["farm"] is not None
    assert context["farm"]["id"] == farm.id
    assert "sensor_summary" in context
    assert "sensor_trends" in context
    assert "weather" in context
    assert "irrigation_need" in context
