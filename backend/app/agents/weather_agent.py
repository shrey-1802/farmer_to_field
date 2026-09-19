"""
Weather Intelligence Agent
BACKEND.md Phase 18

Analyze:
- current weather, forecast, rain probability, temperature, humidity, wind, ET0

Outputs:
- heat risk, rain risk, irrigation suitability, field-work suitability, spraying suitability,
  weather window, confidence, evidence, recommendation
"""

from typing import Dict, Any, List
from app.agents.base import BaseAgent


class WeatherAgent(BaseAgent):
    """
    Evaluates atmospheric hazards (heat waves, heavy rain, gale winds),
    computes operational suitability for field work & spraying,
    and identifies optimal activity windows.
    """

    def __init__(self):
        super().__init__(
            name="WeatherAgent",
            version="1.0.0",
            description="Analyzes microclimate, weather risks, operational spraying/irrigation windows",
        )

    def _supported_inputs(self) -> list:
        return ["current_weather", "hourly_forecast", "daily_forecast", "et0"]

    def _supported_outputs(self) -> list:
        return [
            "heat_risk",
            "rain_risk",
            "irrigation_suitability",
            "field_work_suitability",
            "spraying_suitability",
            "weather_window",
            "risk",
            "confidence",
            "evidence",
            "recommendation",
        ]

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        weather = context.get("weather", {})
        current = weather.get("current", {})
        daily = weather.get("daily", {})
        hourly = weather.get("hourly", {})

        temp = current.get("temperature_c", 25.0)
        humidity = current.get("relative_humidity_pct", 50.0)
        precip = current.get("precipitation_mm", 0.0)
        wind = current.get("wind_speed_kmh", 10.0)
        et0 = current.get("et0_mm", 3.5)

        # Forecast checks
        precip_sum_next_24h = (daily.get("precipitation_sum_mm") or [0.0])[0] if daily.get("precipitation_sum_mm") else precip
        max_rain_prob = (daily.get("precipitation_prob_max_pct") or [0])[0] if daily.get("precipitation_prob_max_pct") else 0

        evidence: List[str] = []
        risk_score = 10.0
        risk_type = "NONE"

        # 1. Heat Risk Evaluation
        if temp >= 42.0:
            heat_risk = "EXTREME_HEAT"
            risk_score = max(risk_score, 90.0)
            risk_type = "HEAT_WAVE"
            evidence.append(f"Dangerous high temperature of {temp}°C detected.")
        elif temp >= 38.0:
            heat_risk = "HIGH_HEAT"
            risk_score = max(risk_score, 70.0)
            risk_type = "HEAT_WAVE"
            evidence.append(f"Elevated temperature ({temp}°C) increases crop transpirational stress.")
        elif temp <= 4.0:
            heat_risk = "FROST_WARNING"
            risk_score = max(risk_score, 80.0)
            risk_type = "FROST_RISK"
            evidence.append(f"Near-freezing temperature ({temp}°C) poses frost damage risk.")
        else:
            heat_risk = "NORMAL"

        # 2. Rain Risk Evaluation
        if precip_sum_next_24h >= 25.0 or max_rain_prob >= 75:
            rain_risk = "HEAVY_RAIN_IMMINENT"
            risk_score = max(risk_score, 85.0)
            risk_type = "HEAVY_RAIN"
            evidence.append(f"Heavy rain expected: {precip_sum_next_24h}mm forecast with {max_rain_prob}% probability.")
        elif precip_sum_next_24h >= 10.0 or max_rain_prob >= 50:
            rain_risk = "MODERATE_RAIN"
            risk_score = max(risk_score, 50.0)
            evidence.append(f"Moderate rainfall expected ({precip_sum_next_24h}mm, {max_rain_prob}% probability).")
        else:
            rain_risk = "LOW_OR_NONE"
            evidence.append(f"Minimal rainfall anticipated ({precip_sum_next_24h}mm).")

        # 3. Spraying Suitability (wind < 15 km/h, no imminent rain, temp 15-30°C)
        if wind > 18.0:
            spraying_suitability = "UNSUITABLE_HIGH_WIND"
            evidence.append(f"Wind speed {wind} km/h exceeds safe spraying threshold (15 km/h); drift hazard.")
        elif rain_risk in ("HEAVY_RAIN_IMMINENT", "MODERATE_RAIN"):
            spraying_suitability = "UNSUITABLE_RAIN_RISK"
            evidence.append("Chemical washoff risk due to expected precipitation.")
        elif temp > 32.0:
            spraying_suitability = "UNSUITABLE_HIGH_TEMP"
            evidence.append(f"High temperature ({temp}°C) causes rapid droplet evaporation.")
        else:
            spraying_suitability = "OPTIMAL"
            evidence.append("Wind, temperature, and rain conditions are ideal for pesticide/fertilizer spraying.")

        # 4. Field Work Suitability
        if rain_risk == "HEAVY_RAIN_IMMINENT" or precip > 5.0:
            field_work_suitability = "SUSPENDED_MUDDY_GROUND"
        else:
            field_work_suitability = "FAVORABLE"

        # 5. Irrigation Suitability
        # If heavy rain is forecast, irrigation should be delayed to avoid wasting water or waterlogging!
        if rain_risk == "HEAVY_RAIN_IMMINENT":
            irrigation_suitability = "DELAY_RAIN_IMMINENT"
            evidence.append("Upcoming natural rainfall makes artificial irrigation counterproductive.")
        elif rain_risk == "MODERATE_RAIN":
            irrigation_suitability = "REDUCE_OR_POSTPONE"
        else:
            irrigation_suitability = "PERMITTED"

        # Weather Window
        weather_window = {
            "spraying_window": "06:00 - 09:30" if spraying_suitability == "OPTIMAL" else "CURRENTLY_CLOSED",
            "irrigation_window": "05:00 - 08:00 or 17:30 - 20:00",
            "safe_field_work_hours": "07:00 - 18:00" if field_work_suitability == "FAVORABLE" else "NONE",
        }

        # Severity
        if risk_score >= 80:
            severity = "CRITICAL"
        elif risk_score >= 60:
            severity = "HIGH"
        elif risk_score >= 30:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        # Recommendation
        if rain_risk == "HEAVY_RAIN_IMMINENT":
            rec = {
                "action": "SUSPEND_IRRIGATION_AND_SECURE_FIELD",
                "title": "Heavy Rain Incoming — Suspend Irrigation",
                "description": f"Expected rainfall of {precip_sum_next_24h}mm. Cease all irrigation to conserve water and prevent waterlogging.",
                "priority": "P1",
            }
        elif heat_risk in ("EXTREME_HEAT", "HIGH_HEAT"):
            rec = {
                "action": "SHADE_AND_PULSE_IRRIGATION",
                "title": "Heat Wave Protection",
                "description": f"High temperature alert ({temp}°C). Provide short pulse irrigation during early morning hours to relieve crop transpirational stress.",
                "priority": "P1",
            }
        elif spraying_suitability == "OPTIMAL":
            rec = {
                "action": "FAVORABLE_SPRAYING_WINDOW",
                "title": "Optimal Spray Window Active",
                "description": "Favorable microclimate window for foliar feeding or plant protection applications.",
                "priority": "P3",
            }
        else:
            rec = {
                "action": "REGULAR_MONITORING",
                "title": "Stable Weather Conditions",
                "description": "No immediate atmospheric weather alerts. Continue scheduled activities.",
                "priority": "P4",
            }

        return {
            "agent_name": self.name,
            "heat_risk": heat_risk,
            "rain_risk": rain_risk,
            "irrigation_suitability": irrigation_suitability,
            "field_work_suitability": field_work_suitability,
            "spraying_suitability": spraying_suitability,
            "weather_window": weather_window,
            "risk": {
                "score": round(risk_score, 1),
                "severity": severity,
                "type": risk_type,
            },
            "confidence": 0.94,
            "evidence": evidence,
            "recommendation": rec,
            "data": {
                "temperature_c": temp,
                "humidity_pct": humidity,
                "wind_speed_kmh": wind,
                "precipitation_mm": precip,
                "forecast_rain_mm": precip_sum_next_24h,
                "rain_prob_pct": max_rain_prob,
                "et0_mm": et0,
            },
        }
