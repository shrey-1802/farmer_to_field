"""
Open-Meteo Weather Service Adapter
BACKEND.md Phase 12 & 13

Fetches live weather data from Open-Meteo (free, no API key required).
Falls back to cached data if live fetch fails.
Never fabricates weather data.
"""

import json
import time
from datetime import datetime, timezone
from typing import Optional, Any
import urllib.request
import urllib.parse
import urllib.error

from app.core.logging import logger

# ── In-memory cache (key: "{lat},{lon}") ────────────────────────────────
_weather_cache: dict = {}
CACHE_TTL_SECONDS = 600  # 10 minutes


def _cache_key(lat: float, lon: float) -> str:
    return f"{lat:.4f},{lon:.4f}"


def _is_cache_fresh(entry: dict) -> bool:
    return (time.time() - entry.get("fetched_at", 0)) < CACHE_TTL_SECONDS


def _fetch_open_meteo(lat: float, lon: float) -> Optional[dict]:
    """
    Fetch current + hourly + daily forecast from Open-Meteo.
    Returns raw parsed JSON or None on failure.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": ",".join([
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "precipitation",
            "rain",
            "weather_code",
            "cloud_cover",
            "wind_speed_10m",
            "wind_direction_10m",
            "et0_fao_evapotranspiration",
        ]),
        "hourly": ",".join([
            "temperature_2m",
            "relative_humidity_2m",
            "precipitation_probability",
            "precipitation",
            "wind_speed_10m",
            "et0_fao_evapotranspiration",
        ]),
        "daily": ",".join([
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "precipitation_probability_max",
            "et0_fao_evapotranspiration",
            "wind_speed_10m_max",
            "weather_code",
        ]),
        "timezone": "auto",
        "forecast_days": 7,
        "forecast_hours": 24,
    }
    url = "https://api.open-meteo.com/v1/forecast?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data
    except urllib.error.URLError as exc:
        logger.warning(f"Open-Meteo fetch failed: {exc}")
        return None
    except Exception as exc:
        logger.error(f"Open-Meteo unexpected error: {exc}")
        return None


def _normalize(raw: dict, lat: float, lon: float) -> dict:
    """Normalize Open-Meteo response into a flat, consistent structure."""
    current = raw.get("current", {})
    current_units = raw.get("current_units", {})
    hourly = raw.get("hourly", {})
    daily = raw.get("daily", {})

    return {
        "source": "live",
        "stale": False,
        "weather_available": True,
        "location": {
            "latitude": lat,
            "longitude": lon,
            "timezone": raw.get("timezone", "UTC"),
        },
        "current": {
            "time": current.get("time"),
            "temperature_c": current.get("temperature_2m"),
            "feels_like_c": current.get("apparent_temperature"),
            "relative_humidity_pct": current.get("relative_humidity_2m"),
            "precipitation_mm": current.get("precipitation"),
            "rain_mm": current.get("rain"),
            "cloud_cover_pct": current.get("cloud_cover"),
            "wind_speed_kmh": current.get("wind_speed_10m"),
            "wind_direction_deg": current.get("wind_direction_10m"),
            "weather_code": current.get("weather_code"),
            "et0_mm": current.get("et0_fao_evapotranspiration"),
        },
        "hourly": {
            "times": hourly.get("time", []),
            "temperature_c": hourly.get("temperature_2m", []),
            "humidity_pct": hourly.get("relative_humidity_2m", []),
            "precipitation_prob_pct": hourly.get("precipitation_probability", []),
            "precipitation_mm": hourly.get("precipitation", []),
            "wind_speed_kmh": hourly.get("wind_speed_10m", []),
            "et0_mm": hourly.get("et0_fao_evapotranspiration", []),
        },
        "daily": {
            "dates": daily.get("time", []),
            "temp_max_c": daily.get("temperature_2m_max", []),
            "temp_min_c": daily.get("temperature_2m_min", []),
            "precipitation_sum_mm": daily.get("precipitation_sum", []),
            "precipitation_prob_max_pct": daily.get("precipitation_probability_max", []),
            "et0_mm": daily.get("et0_fao_evapotranspiration", []),
            "wind_max_kmh": daily.get("wind_speed_10m_max", []),
            "weather_codes": daily.get("weather_code", []),
        },
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


def get_weather(lat: float, lon: float) -> dict:
    """
    Main entry point.
    Returns normalized weather. Falls back to cache on failure.
    Never fabricates data.
    """
    key = _cache_key(lat, lon)
    cached = _weather_cache.get(key)

    # Try live fetch
    raw = _fetch_open_meteo(lat, lon)
    if raw:
        normalized = _normalize(raw, lat, lon)
        normalized["_fetched_at_ts"] = time.time()
        _weather_cache[key] = normalized
        return normalized

    # Phase 13: Fall back to cache
    if cached:
        logger.warning(f"Open-Meteo unavailable for ({lat}, {lon}). Serving cached data.")
        stale = cached.copy()
        stale["source"] = "cached"
        stale["stale"] = True
        return stale

    # No data at all
    logger.warning(f"No weather data available for ({lat}, {lon}). Returning weather_available=false.")
    return {
        "weather_available": False,
        "source": None,
        "stale": False,
        "location": {"latitude": lat, "longitude": lon},
    }
