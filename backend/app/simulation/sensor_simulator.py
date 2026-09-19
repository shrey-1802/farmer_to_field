"""
Virtual IoT Sensor Simulation Engine
BACKEND.md Phase 8 & 9

Generates realistic, continuous agricultural telemetry using:
    Baseline + Trend + Noise + Crop Influence + Scenario Modifier = Reading

State is maintained per sensor_id so readings are continuous and correlated.
"""

import math
import random
from datetime import datetime, timezone
from typing import Dict, Optional, Any

# In-memory scenario state per farm_id / zone_id
_scenario_state: Dict[str, dict] = {}
_sensor_state: Dict[str, dict] = {}


class ScenarioType:
    NORMAL = "NORMAL"
    WATER_STRESS = "WATER_STRESS"
    NUTRIENT_DEFICIENCY = "NUTRIENT_DEFICIENCY"
    HEAT_WAVE = "HEAT_WAVE"
    HEAVY_RAIN = "HEAVY_RAIN"
    DISEASE_FAVORABLE = "DISEASE_FAVORABLE"
    SENSOR_FAILURE = "SENSOR_FAILURE"


# ── Scenario scenario modifiers ──────────────────────────────────────
SCENARIO_MODIFIERS: Dict[str, dict] = {
    ScenarioType.NORMAL: {
        "soil_moisture_drift": -0.05,
        "temperature_drift": 0.0,
        "humidity_drift": 0.0,
        "nitrogen_drift": -0.02,
        "phosphorus_drift": -0.01,
        "potassium_drift": -0.01,
    },
    ScenarioType.WATER_STRESS: {
        "soil_moisture_drift": -0.55,   # rapid depletion
        "temperature_drift": +0.25,
        "humidity_drift": -0.30,
        "nitrogen_drift": -0.02,
        "phosphorus_drift": -0.01,
        "potassium_drift": -0.01,
    },
    ScenarioType.HEAVY_RAIN: {
        "soil_moisture_drift": +0.70,   # rapid saturation
        "temperature_drift": -0.15,
        "humidity_drift": +0.50,
        "nitrogen_drift": -0.06,        # nutrient leaching
        "phosphorus_drift": -0.03,
        "potassium_drift": -0.03,
    },
    ScenarioType.HEAT_WAVE: {
        "soil_moisture_drift": -0.40,
        "temperature_drift": +0.80,
        "humidity_drift": -0.45,
        "nitrogen_drift": -0.02,
        "phosphorus_drift": -0.01,
        "potassium_drift": -0.01,
    },
    ScenarioType.NUTRIENT_DEFICIENCY: {
        "soil_moisture_drift": -0.05,
        "temperature_drift": 0.0,
        "humidity_drift": 0.0,
        "nitrogen_drift": -0.50,
        "phosphorus_drift": -0.35,
        "potassium_drift": -0.25,
    },
    ScenarioType.DISEASE_FAVORABLE: {
        "soil_moisture_drift": +0.20,
        "temperature_drift": +0.10,
        "humidity_drift": +0.40,
        "nitrogen_drift": -0.02,
        "phosphorus_drift": -0.01,
        "potassium_drift": -0.01,
    },
    ScenarioType.SENSOR_FAILURE: {
        "soil_moisture_drift": 0.0,
        "temperature_drift": 0.0,
        "humidity_drift": 0.0,
        "nitrogen_drift": 0.0,
        "phosphorus_drift": 0.0,
        "potassium_drift": 0.0,
    },
}


def _clamp(value: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, value))


def _noise(amplitude: float = 0.4) -> float:
    """Small Gaussian noise."""
    return random.gauss(0, amplitude)


def _diurnal_factor(hour: Optional[int] = None) -> float:
    """
    Simulates day/night cycle. Returns a factor [-1, +1].
    Peaks at 14:00 (hottest), troughs at 4:00 (coolest).
    """
    if hour is None:
        hour = datetime.now(timezone.utc).hour
    return math.sin(math.pi * (hour - 4) / 12)


def get_scenario(farm_id: str) -> str:
    return _scenario_state.get(farm_id, {}).get("scenario", ScenarioType.NORMAL)


def set_scenario(farm_id: str, scenario: str, params: Optional[dict] = None) -> None:
    _scenario_state[farm_id] = {
        "scenario": scenario,
        "params": params or {},
        "set_at": datetime.now(timezone.utc).isoformat(),
    }


def reset_scenario(farm_id: str) -> None:
    _scenario_state.pop(farm_id, None)


def get_simulation_status(farm_id: str) -> dict:
    state = _scenario_state.get(farm_id, {})
    return {
        "farm_id": farm_id,
        "active_scenario": state.get("scenario", ScenarioType.NORMAL),
        "set_at": state.get("set_at"),
        "params": state.get("params", {}),
    }


def generate_sensor_reading(
    sensor_id: str,
    sensor_type: str,
    farm_id: str,
    configuration: Optional[dict] = None,
) -> dict:
    """
    Core simulation function.
    Returns a dict of measurements for the given sensor_type.
    Maintains sensor state for continuity.
    """
    config = configuration or {}
    scenario = get_scenario(farm_id)
    modifiers = SCENARIO_MODIFIERS.get(scenario, SCENARIO_MODIFIERS[ScenarioType.NORMAL])
    hour = datetime.now(timezone.utc).hour
    diurnal = _diurnal_factor(hour)

    # SENSOR_FAILURE: return invalid quality marker
    if scenario == ScenarioType.SENSOR_FAILURE:
        return {"_quality": "INVALID", "_source": "virtual_sensor"}

    if sensor_id not in _sensor_state:
        _sensor_state[sensor_id] = {}

    state = _sensor_state[sensor_id]
    measurements: dict = {}

    if sensor_type == "SOIL_MOISTURE":
        baseline = float(config.get("baseline", 48.0))
        prev = state.get("soil_moisture", baseline)
        drift = modifiers["soil_moisture_drift"]
        new_val = _clamp(
            prev + drift + _noise(0.3),
            5.0, 95.0
        )
        state["soil_moisture"] = new_val

        soil_temp_baseline = float(config.get("soil_temp_baseline", 22.5))
        prev_temp = state.get("soil_temperature", soil_temp_baseline)
        temp_drift = modifiers["temperature_drift"] + diurnal * 0.5
        new_temp = _clamp(prev_temp + temp_drift + _noise(0.2), 5.0, 45.0)
        state["soil_temperature"] = new_temp

        measurements = {
            "soil_moisture": round(new_val, 2),
            "soil_temperature": round(new_temp, 2),
        }

    elif sensor_type == "SOIL_TEMPERATURE":
        baseline = float(config.get("baseline", 22.5))
        prev = state.get("soil_temperature", baseline)
        drift = modifiers["temperature_drift"] + diurnal * 0.6
        new_val = _clamp(prev + drift + _noise(0.2), 5.0, 55.0)
        state["soil_temperature"] = new_val
        measurements = {"soil_temperature": round(new_val, 2)}

    elif sensor_type == "AMBIENT_TEMP":
        baseline = float(config.get("baseline", 26.0))
        prev = state.get("ambient_temperature", baseline)
        drift = modifiers["temperature_drift"] + diurnal * 2.5
        new_val = _clamp(prev + drift + _noise(0.5), -5.0, 55.0)
        state["ambient_temperature"] = new_val
        measurements = {"ambient_temperature": round(new_val, 2)}

    elif sensor_type == "HUMIDITY":
        baseline = float(config.get("baseline", 58.0))
        prev = state.get("humidity", baseline)
        drift = modifiers["humidity_drift"] - diurnal * 1.5
        new_val = _clamp(prev + drift + _noise(0.6), 10.0, 99.0)
        state["humidity"] = new_val
        measurements = {"relative_humidity": round(new_val, 2)}

    elif sensor_type == "NPK":
        n_baseline = float(config.get("baseline_n", 240.0))
        p_baseline = float(config.get("baseline_p", 22.0))
        k_baseline = float(config.get("baseline_k", 180.0))

        prev_n = state.get("nitrogen", n_baseline)
        prev_p = state.get("phosphorus", p_baseline)
        prev_k = state.get("potassium", k_baseline)

        new_n = _clamp(prev_n + modifiers["nitrogen_drift"] + _noise(0.5), 10.0, 400.0)
        new_p = _clamp(prev_p + modifiers["phosphorus_drift"] + _noise(0.2), 2.0, 80.0)
        new_k = _clamp(prev_k + modifiers["potassium_drift"] + _noise(0.4), 20.0, 350.0)

        state["nitrogen"] = new_n
        state["phosphorus"] = new_p
        state["potassium"] = new_k

        measurements = {
            "nitrogen_mg_kg": round(new_n, 2),
            "phosphorus_mg_kg": round(new_p, 2),
            "potassium_mg_kg": round(new_k, 2),
        }

    elif sensor_type == "SOLAR_RADIATION":
        # Radiation only during daylight (6am - 8pm)
        if 6 <= hour <= 20:
            radiation = _clamp(500 * max(0, diurnal) + _noise(20), 0, 1100)
        else:
            radiation = 0.0
        state["solar_radiation"] = radiation
        measurements = {"solar_radiation_wm2": round(radiation, 1)}

    else:
        # Generic fallback: single value measurement
        prev = state.get("value", 50.0)
        new_val = _clamp(prev + _noise(0.5), 0.0, 100.0)
        state["value"] = new_val
        measurements = {"value": round(new_val, 2)}

    return measurements


# Alias used by simulation routes to immediately trigger a reading cycle
_generate_reading_now = generate_sensor_reading

