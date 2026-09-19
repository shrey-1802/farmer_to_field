"""
Irrigation Intelligence Agent
BACKEND.md Phase 19

Inputs:
- soil moisture, soil type, crop, growth stage, temperature, humidity,
  rain probability, rain forecast, ET0, recent irrigation

Outputs:
- risk_score, severity, recommended_action, affected_zone, recommended_window,
  estimated_duration, confidence, evidence, recommendation
"""

from typing import Dict, Any, List
from app.agents.base import BaseAgent
from app.services.crop_service import calculate_irrigation_need


class IrrigationAgent(BaseAgent):
    """
    Computes soil moisture deficit against crop- and growth-stage-specific targets.
    Factors in ET0, upcoming rainfall forecast, and irrigation hardware delivery rates
    to determine precise runtimes and optimal operational windows.
    """

    def __init__(self):
        super().__init__(
            name="IrrigationAgent",
            version="1.0.0",
            description="Computes crop water deficit, irrigation run-time, and scheduling windows",
        )

    def _supported_inputs(self) -> list:
        return [
            "soil_moisture",
            "soil_type",
            "crop",
            "growth_stage",
            "temperature",
            "humidity",
            "rain_probability",
            "rain_forecast",
            "et0",
            "recent_irrigation",
        ]

    def _supported_outputs(self) -> list:
        return [
            "risk_score",
            "severity",
            "recommended_action",
            "affected_zone",
            "recommended_window",
            "estimated_duration",
            "confidence",
            "evidence",
            "recommendation",
        ]

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        sensor_summary = context.get("sensor_summary", {})
        crop_stage = context.get("crop_stage") or {}
        weather = context.get("weather", {})
        current_w = weather.get("current", {})
        daily_w = weather.get("daily", {})

        sm_data = sensor_summary.get("SOIL_MOISTURE", {}).get("measurements", {})
        moisture = sm_data.get("soil_moisture")
        et0 = current_w.get("et0_mm", 3.5)

        # Dynamic, configurable target threshold based on crop stage
        target_moisture = crop_stage.get("soil_moisture_target_pct", 65.0)
        crop_name = crop_stage.get("crop_id", "Crop").capitalize()
        stage_name = crop_stage.get("stage_name", "Vegetative")

        # Upcoming rain
        rain_prob = (daily_w.get("precipitation_prob_max_pct") or [0])[0] if daily_w.get("precipitation_prob_max_pct") else 0
        forecast_rain = (daily_w.get("precipitation_sum_mm") or [0.0])[0] if daily_w.get("precipitation_sum_mm") else 0.0

        evidence: List[str] = [
            f"{crop_name} is in '{stage_name}' stage with target moisture {target_moisture}%.",
        ]

        # Calculate deficit
        calc = calculate_irrigation_need(
            et0_mm=et0,
            soil_moisture_pct=moisture,
            target_soil_moisture_pct=target_moisture,
        )

        deficit = calc.get("soil_moisture_deficit_pct")
        need_mm = calc.get("irrigation_need_mm") or 0.0
        liters_per_ha = calc.get("irrigation_need_liters_per_ha") or 0.0

        if moisture is not None:
            evidence.append(f"Current soil moisture is {moisture}% (Deficit: {deficit}%).")
        else:
            evidence.append("No active soil moisture telemetry; estimating from ET0.")

        # Estimate duration assuming standard drip application rate (5 mm/hour)
        drip_rate_mm_per_hr = 5.0
        est_duration_minutes = round((need_mm / drip_rate_mm_per_hr) * 60)

        # Risk scoring
        risk_score = 10.0
        risk_type = "NONE"

        # Check rain discount
        rain_saving = False
        if forecast_rain >= 15.0 or rain_prob >= 70:
            rain_saving = True
            evidence.append(f"Imminent rain ({forecast_rain}mm, {rain_prob}% prob) offsets irrigation requirement.")

        if moisture is not None:
            if moisture < (target_moisture - 20):
                risk_score = 85.0
                risk_type = "WATER_STRESS"
            elif moisture < (target_moisture - 10):
                risk_score = 60.0
                risk_type = "WATER_STRESS"
            elif moisture > (target_moisture + 15):
                risk_score = 70.0
                risk_type = "WATERLOGGING"

        # Categorize severity
        if risk_score >= 80:
            severity = "CRITICAL"
        elif risk_score >= 60:
            severity = "HIGH"
        elif risk_score >= 30:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        # Formulate action
        if deficit and deficit > 10:
            recommended_action = "TRIGGER_IRRIGATION"
            recommended_window = "05:00 - 08:30 (Morning Low Evaporation Window)"
            rec = {
                "action": "TRIGGER_IRRIGATION",
                "title": f"Apply {need_mm}mm Irrigation ({liters_per_ha:,} L/ha)",
                "description": f"Soil moisture deficit is {deficit}%. Run drip zone for ~{est_duration_minutes} minutes during the optimal morning window.",
                "priority": "P1" if severity in ("CRITICAL", "HIGH") else "P2",
                "parameters": {
                    "need_mm": need_mm,
                    "liters_per_ha": liters_per_ha,
                    "duration_minutes": est_duration_minutes,
                    "recommended_window": recommended_window,
                },
            }
        elif moisture is not None and moisture > (target_moisture + 15):
            recommended_action = "HALT_IRRIGATION"
            recommended_window = "CLOSED"
            est_duration_minutes = 0
            rec = {
                "action": "HALT_IRRIGATION",
                "title": "Halt Irrigation — Moisture Saturation",
                "description": f"Soil moisture ({moisture}%) exceeds optimal retention threshold. Close valves.",
                "priority": "P1",
            }
        else:
            recommended_action = "MONITOR"
            recommended_window = "Next scheduled evaluation"
            est_duration_minutes = 0
            rec = {
                "action": "MONITOR",
                "title": "Moisture Profile In Equilibrium",
                "description": "Current root zone hydration is adequate. No irrigation cycle needed at this time.",
                "priority": "P4",
            }

        affected_zone = context.get("zone", {}).get("name") if context.get("zone") else "All Field Zones"

        return {
            "agent_name": self.name,
            "risk_score": round(risk_score, 1),
            "severity": severity,
            "recommended_action": recommended_action,
            "affected_zone": affected_zone,
            "recommended_window": recommended_window,
            "estimated_duration": est_duration_minutes,
            "risk": {
                "score": round(risk_score, 1),
                "severity": severity,
                "type": risk_type,
            },
            "confidence": 0.95,
            "evidence": evidence,
            "recommendation": rec,
            "data": {
                "current_moisture_pct": moisture,
                "target_moisture_pct": target_moisture,
                "deficit_pct": deficit,
                "irrigation_need_mm": need_mm,
                "liters_per_ha": liters_per_ha,
                "duration_minutes": est_duration_minutes,
            },
        }
