"""
AgroMonitoring & Open-Meteo Weather Service Adapter
BACKEND.md Phase 12 & 13

Supports:
1. AgroMonitoring API (https://agromonitoring.com) with weather, forecast, and soil telemetry
2. Open-Meteo fallback (free, no API key required)
3. In-memory caching with TTL
4. Resilient failure strategy (serves cached data if live fetch fails)
5. Never fabricates weather data.
"""

import json
import time
from datetime import datetime, timezone
from typing import Optional, Any
import urllib.request
import urllib.parse
import urllib.error

from app.core.config import get_settings
from app.core.logging import logger

settings = get_settings()

# ── In-memory cache (key: "{lat},{lon}") ────────────────────────────────
_weather_cache: dict = {}
CACHE_TTL_SECONDS = 600  # 10 minutes


def _cache_key(lat: float, lon: float) -> str:
    return f"{lat:.4f},{lon:.4f}"


def _is_cache_fresh(entry: dict) -> bool:
    return (time.time() - entry.get("_fetched_at_ts", 0)) < CACHE_TTL_SECONDS


# ─────────────────────────────────────────────────────────────────────────────
# AgroMonitoring Provider (https://agromonitoring.com)
# ─────────────────────────────────────────────────────────────────────────────

def _fetch_agromonitoring_current(lat: float, lon: float, api_key: str) -> Optional[dict]:
    """Fetch current weather from AgroMonitoring."""
    url = f"{settings.AGROMONITORING_BASE_URL}/weather?lat={lat}&lon={lon}&appid={api_key}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "KrishiNirnay-AI/1.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        logger.warning(f"AgroMonitoring current weather HTTP {exc.code}: {exc.reason}")
        return None
    except Exception as exc:
        logger.warning(f"AgroMonitoring current weather error: {exc}")
        return None


def _fetch_agromonitoring_forecast(lat: float, lon: float, api_key: str) -> Optional[list]:
    """Fetch weather forecast from AgroMonitoring."""
    url = f"{settings.AGROMONITORING_BASE_URL}/weather/forecast?lat={lat}&lon={lon}&appid={api_key}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "KrishiNirnay-AI/1.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if isinstance(data, list):
                return data
            return None
    except Exception as exc:
        logger.warning(f"AgroMonitoring forecast fetch failed: {exc}")
        return None


def _fetch_agromonitoring_soil(lat: float, lon: float, api_key: str) -> Optional[dict]:
    """Fetch soil telemetry (moisture, surface temp, 10cm depth temp) from AgroMonitoring."""
    url = f"{settings.AGROMONITORING_BASE_URL}/soil?lat={lat}&lon={lon}&appid={api_key}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "KrishiNirnay-AI/1.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        logger.debug(f"AgroMonitoring soil telemetry optional fetch: {exc}")
        return None


def _normalize_agromonitoring(
    current_raw: dict,
    forecast_raw: Optional[list],
    soil_raw: Optional[dict],
    lat: float,
    lon: float,
) -> dict:
    """Normalize AgroMonitoring JSON into our standardized platform weather format."""
    main = current_raw.get("main", {})
    wind = current_raw.get("wind", {})
    clouds = current_raw.get("clouds", {})
    rain = current_raw.get("rain", {})
    weather_arr = current_raw.get("weather", [])
    primary_weather = weather_arr[0] if weather_arr else {}

    # Temperature conversions (Kelvin to Celsius)
    temp_k = main.get("temp", 298.15)
    temp_c = round(temp_k - 273.15, 1) if temp_k is not None else None

    feels_like_k = main.get("feels_like", temp_k)
    feels_like_c = round(feels_like_k - 273.15, 1) if feels_like_k is not None else temp_c

    wind_speed_ms = wind.get("speed", 0.0)
    wind_speed_kmh = round(wind_speed_ms * 3.6, 1) if wind_speed_ms is not None else 0.0

    rain_mm = rain.get("1h", rain.get("3h", 0.0)) or 0.0

    # Soil data enrichment (if available from AgroMonitoring)
    soil_enrichment = None
    if soil_raw:
        s_t0 = soil_raw.get("t0")
        s_t10 = soil_raw.get("t10")
        soil_enrichment = {
            "surface_temp_c": round(s_t0 - 273.15, 1) if s_t0 is not None else None,
            "depth_10cm_temp_c": round(s_t10 - 273.15, 1) if s_t10 is not None else None,
            "soil_moisture_pct": round(soil_raw.get("moisture", 0.0) * 100, 1),
        }

    # Process forecast steps
    hourly_times = []
    hourly_temp = []
    hourly_humidity = []
    hourly_precip = []
    hourly_wind = []

    daily_map: dict = {}

    if forecast_raw and isinstance(forecast_raw, list):
        for item in forecast_raw:
            ts = item.get("dt")
            if not ts:
                continue
            dt_obj = datetime.fromtimestamp(ts, tz=timezone.utc)
            iso_str = dt_obj.isoformat()
            date_key = dt_obj.strftime("%Y-%m-%d")

            f_main = item.get("main", {})
            f_wind = item.get("wind", {})
            f_rain = item.get("rain", {})
            f_weather = (item.get("weather") or [{}])[0]

            f_temp_k = f_main.get("temp", 298.15)
            f_temp_c = round(f_temp_k - 273.15, 1)
            f_hum = f_main.get("humidity", 0)
            f_p = f_rain.get("3h", 0.0) or 0.0
            f_w = round(f_wind.get("speed", 0.0) * 3.6, 1)

            # Collect hourly (first 24h / 8 items)
            if len(hourly_times) < 8:
                hourly_times.append(iso_str)
                hourly_temp.append(f_temp_c)
                hourly_humidity.append(f_hum)
                hourly_precip.append(f_p)
                hourly_wind.append(f_w)

            # Aggregate daily
            if date_key not in daily_map:
                daily_map[date_key] = {
                    "temps": [],
                    "precip_sum": 0.0,
                    "wind_max": 0.0,
                    "codes": [],
                }
            daily_map[date_key]["temps"].append(f_temp_c)
            daily_map[date_key]["precip_sum"] += f_p
            daily_map[date_key]["wind_max"] = max(daily_map[date_key]["wind_max"], f_w)
            if f_weather.get("id"):
                daily_map[date_key]["codes"].append(f_weather["id"])

    # Build daily lists
    dates = list(daily_map.keys())[:7]
    temp_max_c = [max(daily_map[d]["temps"]) if daily_map[d]["temps"] else 0.0 for d in dates]
    temp_min_c = [min(daily_map[d]["temps"]) if daily_map[d]["temps"] else 0.0 for d in dates]
    precip_sum_mm = [round(daily_map[d]["precip_sum"], 1) for d in dates]
    wind_max_kmh = [round(daily_map[d]["wind_max"], 1) for d in dates]
    weather_codes = [daily_map[d]["codes"][0] if daily_map[d]["codes"] else 800 for d in dates]

    current_block = {
        "time": datetime.fromtimestamp(current_raw.get("dt", int(time.time())), tz=timezone.utc).isoformat(),
        "temperature_c": temp_c,
        "feels_like_c": feels_like_c,
        "relative_humidity_pct": main.get("humidity", 0),
        "precipitation_mm": rain_mm,
        "rain_mm": rain_mm,
        "cloud_cover_pct": clouds.get("all", 0),
        "wind_speed_kmh": wind_speed_kmh,
        "wind_direction_deg": wind.get("deg", 0),
        "weather_code": primary_weather.get("id", 800),
        "weather_description": primary_weather.get("description", "Clear"),
        "pressure_hpa": main.get("pressure"),
        "et0_mm": None,
    }

    if soil_enrichment:
        current_block["soil"] = soil_enrichment

    return {
        "source": "agromonitoring",
        "stale": False,
        "weather_available": True,
        "location": {
            "latitude": lat,
            "longitude": lon,
            "timezone": "UTC",
        },
        "current": current_block,
        "hourly": {
            "times": hourly_times,
            "temperature_c": hourly_temp,
            "humidity_pct": hourly_humidity,
            "precipitation_prob_pct": [0] * len(hourly_times),
            "precipitation_mm": hourly_precip,
            "wind_speed_kmh": hourly_wind,
            "et0_mm": [None] * len(hourly_times),
        },
        "daily": {
            "dates": dates,
            "temp_max_c": temp_max_c,
            "temp_min_c": temp_min_c,
            "precipitation_sum_mm": precip_sum_mm,
            "precipitation_prob_max_pct": [0] * len(dates),
            "et0_mm": [None] * len(dates),
            "wind_max_kmh": wind_max_kmh,
            "weather_codes": weather_codes,
        },
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Open-Meteo Provider (Fallback)
# ─────────────────────────────────────────────────────────────────────────────

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
        req = urllib.request.Request(url, headers={"User-Agent": "KrishiNirnay-AI/1.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data
    except urllib.error.URLError as exc:
        logger.warning(f"Open-Meteo fetch failed: {exc}")
        return None
    except Exception as exc:
        logger.error(f"Open-Meteo unexpected error: {exc}")
        return None


def _normalize_open_meteo(raw: dict, lat: float, lon: float) -> dict:
    """Normalize Open-Meteo response into a flat, consistent structure."""
    current = raw.get("current", {})
    hourly = raw.get("hourly", {})
    daily = raw.get("daily", {})

    return {
        "source": "open-meteo",
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


# ─────────────────────────────────────────────────────────────────────────────
# Main Public Entry Point
# ─────────────────────────────────────────────────────────────────────────────

def get_weather(lat: float, lon: float) -> dict:
    """
    Main entry point.
    1. Checks in-memory cache.
    2. If AgroMonitoring configured with valid API key, fetches AgroMonitoring.
    3. Falls back to Open-Meteo if AgroMonitoring is unavailable or unconfigured.
    4. Falls back to cached data if both live fetches fail.
    5. Returns weather_available=False if no data can be retrieved.
    Never fabricates fake data.
    """
    key = _cache_key(lat, lon)
    cached = _weather_cache.get(key)

    cfg = get_settings()
    api_key = (cfg.AGROMONITORING_API_KEY or "").strip()
    is_valid_agro_key = (
        bool(api_key) and 
        api_key != "your_agromonitoring_api_key_here" and
        cfg.WEATHER_PROVIDER.lower() == "agromonitoring"
    )

    # 1. Try AgroMonitoring if configured
    if is_valid_agro_key:
        current_raw = _fetch_agromonitoring_current(lat, lon, api_key)
        if current_raw and current_raw.get("main"):
            forecast_raw = _fetch_agromonitoring_forecast(lat, lon, api_key)
            soil_raw = _fetch_agromonitoring_soil(lat, lon, api_key)
            normalized = _normalize_agromonitoring(current_raw, forecast_raw, soil_raw, lat, lon)
            normalized["_fetched_at_ts"] = time.time()
            _weather_cache[key] = normalized
            return normalized
        else:
            logger.warning(f"AgroMonitoring call failed for ({lat}, {lon}). Falling back to Open-Meteo.")

    # 2. Fallback to Open-Meteo
    raw = _fetch_open_meteo(lat, lon)
    if raw:
        normalized = _normalize_open_meteo(raw, lat, lon)
        normalized["_fetched_at_ts"] = time.time()
        _weather_cache[key] = normalized
        return normalized

    # 3. Fall back to cached data
    if cached:
        logger.warning(f"Live weather providers unavailable for ({lat}, {lon}). Serving cached data.")
        stale = cached.copy()
        stale["source"] = "cached"
        stale["stale"] = True
        return stale

    # 4. No data at all
    logger.warning(f"No weather data available for ({lat}, {lon}). Returning weather_available=false.")
    return {
        "weather_available": False,
        "source": None,
        "stale": False,
        "location": {"latitude": lat, "longitude": lon},
    }
