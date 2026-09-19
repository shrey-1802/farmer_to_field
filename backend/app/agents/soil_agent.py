"""
Soil Intelligence Agent
BACKEND.md Phase 17

Inputs:
- soil moisture, soil temperature, NPK (N, P, K), pH, EC, soil type, crop, growth stage

Outputs:
- soil condition, water status, nutrient status, risk, confidence, evidence, recommendation
"""

from typing import Dict, Any, List
from app.agents.base import BaseAgent


class SoilAgent(BaseAgent):
    """
    Evaluates soil health, moisture levels, salinity (EC), pH balance,
    and macronutrient readiness against crop-specific thresholds.
    """

    def __init__(self):
        super().__init__(
            name="SoilAgent",
            version="1.0.0",
            description="Analyzes soil moisture, temperature, NPK, pH, and EC dynamics",
        )

    def _supported_inputs(self) -> list:
        return ["soil_moisture", "soil_temperature", "nitrogen", "phosphorus", "potassium", "ph", "ec", "soil_type", "crop_stage"]

    def _supported_outputs(self) -> list:
        return ["soil_condition", "water_status", "nutrient_status", "risk", "confidence", "evidence", "recommendation"]

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        sensor_summary = context.get("sensor_summary", {})
        crop_stage = context.get("crop_stage") or {}
        crop_id = crop_stage.get("crop_id", "wheat")

        # Extract telemetry
        sm_data = sensor_summary.get("SOIL_MOISTURE", {}).get("measurements", {})
        npk_data = sensor_summary.get("NPK", {}).get("measurements", {})
        ph_data = sensor_summary.get("PH", {}).get("measurements", {})
        ec_data = sensor_summary.get("EC", {}).get("measurements", {})

        moisture = sm_data.get("soil_moisture")
        soil_temp = sm_data.get("soil_temperature")
        n = npk_data.get("nitrogen")
        p = npk_data.get("phosphorus")
        k = npk_data.get("potassium")
        ph = ph_data.get("ph")
        ec = ec_data.get("ec")

        evidence: List[str] = []
        risk_score = 10.0  # Baseline low risk
        risk_type = "NONE"
        water_status = "OPTIMAL"
        soil_condition = "HEALTHY"
        nutrient_status = "BALANCED"

        # 1. Soil Moisture Evaluation
        target_moisture = crop_stage.get("soil_moisture_target_pct", 65.0)
        if moisture is not None:
            evidence.append(f"Current soil moisture is {moisture}% (Target: {target_moisture}%)")
            if moisture < (target_moisture - 20):
                water_status = "CRITICAL_DEFICIT"
                risk_score = max(risk_score, 85.0)
                risk_type = "WATER_STRESS"
                evidence.append("Severe root-zone moisture deficit detected.")
            elif moisture < (target_moisture - 10):
                water_status = "MODERATE_DEFICIT"
                risk_score = max(risk_score, 60.0)
                risk_type = "WATER_STRESS"
                evidence.append("Soil moisture trending below vegetative threshold.")
            elif moisture > (target_moisture + 20):
                water_status = "WATERLOGGED"
                risk_score = max(risk_score, 75.0)
                risk_type = "WATERLOGGING"
                evidence.append("Excessive soil saturation; aeration restricted.")
            else:
                water_status = "OPTIMAL"
        else:
            evidence.append("No active soil moisture telemetry available.")

        # 2. pH Evaluation
        if ph is not None:
            evidence.append(f"Soil pH is {ph}")
            if ph < 5.5:
                soil_condition = "HIGHLY_ACIDIC"
                risk_score = max(risk_score, 55.0)
                evidence.append("Strongly acidic soil may lock micronutrients.")
            elif ph > 8.2:
                soil_condition = "ALKALINE"
                risk_score = max(risk_score, 50.0)
                evidence.append("Alkaline soil detected; phosphorus availability may decrease.")

        # 3. EC (Salinity) Evaluation
        if ec is not None:
            evidence.append(f"Electrical Conductivity is {ec} dS/m")
            if ec > 3.0:
                soil_condition = "SALINE"
                risk_score = max(risk_score, 70.0)
                evidence.append("High salinity causes osmotic stress in root absorption.")

        # 4. Nutrient Status
        if n is not None and n < 120:
            nutrient_status = "NITROGEN_DEFICIENT"
            risk_score = max(risk_score, 65.0)
            evidence.append(f"Available Nitrogen is low ({n} mg/kg).")

        # Determine overall severity
        if risk_score >= 80:
            severity = "CRITICAL"
        elif risk_score >= 60:
            severity = "HIGH"
        elif risk_score >= 30:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        # Actionable Recommendation
        if water_status == "CRITICAL_DEFICIT":
            rec = {
                "action": "TRIGGER_IRRIGATION",
                "title": "Immediate Irrigation Required",
                "description": f"Soil moisture ({moisture}%) is well below crop requirement ({target_moisture}%). Initiate irrigation immediately.",
                "priority": "P1",
            }
        elif water_status == "WATERLOGGED":
            rec = {
                "action": "SUSPEND_IRRIGATION_AND_DRAIN",
                "title": "Halt Irrigation and Open Drainage",
                "description": f"Soil is waterlogged at {moisture}%. Suspend all irrigation cycles and inspect drainage gates.",
                "priority": "P1",
            }
        elif nutrient_status == "NITROGEN_DEFICIENT":
            rec = {
                "action": "SCHEDULE_FERTILIZATION",
                "title": "Nitrogen Top-Dressing Needed",
                "description": f"Crop in {crop_stage.get('stage_name', 'current')} stage requires nitrogen supplement.",
                "priority": "P2",
            }
        elif soil_condition == "HIGHLY_ACIDIC":
            rec = {
                "action": "APPLY_AGRICULTURAL_LIME",
                "title": "Soil Acidity Correction",
                "description": "Apply agricultural lime at recommended dosage to buffer soil pH.",
                "priority": "P3",
            }
        else:
            rec = {
                "action": "MAINTAIN_CURRENT_SCHEDULE",
                "title": "Soil Conditions Optimal",
                "description": "All soil parameters are within healthy agronomic limits. Continue regular monitoring.",
                "priority": "P4",
            }

        return {
            "agent_name": self.name,
            "soil_condition": soil_condition,
            "water_status": water_status,
            "nutrient_status": nutrient_status,
            "risk": {
                "score": round(risk_score, 1),
                "severity": severity,
                "type": risk_type,
            },
            "confidence": 0.92,
            "evidence": evidence,
            "recommendation": rec,
            "data": {
                "soil_moisture_pct": moisture,
                "soil_temperature_c": soil_temp,
                "nitrogen_mg_kg": n,
                "phosphorus_mg_kg": p,
                "potassium_mg_kg": k,
                "ph": ph,
                "ec_ds_m": ec,
            },
        }
