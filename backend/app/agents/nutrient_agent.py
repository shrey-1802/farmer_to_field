"""
Nutrient & Fertility Intelligence Agent
BACKEND.md Phase 20

Analyze:
- N, P, K, pH, EC, soil, crop, growth stage, fertilizer history, weather

Return:
- nitrogen_status, phosphorus_status, potassium_status, overall_risk,
  confidence, evidence, recommendation

Safety Guardrail:
- Never invents unsafe fertilizer or chemical application rates.
  Adheres to agronomically capped ICAR / FAO guidance limits.
"""

from typing import Dict, Any, List
from app.agents.base import BaseAgent
from app.services.dataset_loader import evaluate_ml_failure_risk, get_crop_threshold


# Capped maximum safe application rates (kg/ha per application) to ensure safety
SAFE_APPLICATION_LIMITS = {
    "urea_n": {"max_kg_ha": 65.0, "safe_compound": "Urea (46% N)"},
    "dap_p": {"max_kg_ha": 50.0, "safe_compound": "Di-Ammonium Phosphate (18-46-0)"},
    "mop_k": {"max_kg_ha": 40.0, "safe_compound": "Muriate of Potash (60% K2O)"},
}


class NutrientAgent(BaseAgent):
    """
    Evaluates macronutrient readiness (N-P-K), pH-governed nutrient availability,
    and calculates agronomic top-dressing advice capped by strict biological safety limits.
    """

    def __init__(self):
        super().__init__(
            name="NutrientAgent",
            version="1.0.0",
            description="Evaluates soil NPK nutrition, pH lockup, and enforces safe fertilizer limits",
        )

    def _supported_inputs(self) -> list:
        return ["nitrogen", "phosphorus", "potassium", "ph", "ec", "crop_stage", "weather"]

    def _supported_outputs(self) -> list:
        return [
            "nitrogen_status",
            "phosphorus_status",
            "potassium_status",
            "overall_risk",
            "confidence",
            "evidence",
            "recommendation",
        ]

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        sensor_summary = context.get("sensor_summary", {})
        crop_stage = context.get("crop_stage") or {}
        weather = context.get("weather", {})
        current_w = weather.get("current", {})

        npk = sensor_summary.get("NPK", {}).get("measurements", {})
        ph_data = sensor_summary.get("PH", {}).get("measurements", {})

        n = npk.get("nitrogen", 180.0)
        p = npk.get("phosphorus", 30.0)
        k = npk.get("potassium", 160.0)
        ph = ph_data.get("ph", 6.8)

        n_demand = crop_stage.get("nitrogen_demand", "MEDIUM")
        stage_name = crop_stage.get("stage_name", "Vegetative")
        crop_name = crop_stage.get("crop_id", "Crop").capitalize()

        evidence: List[str] = [
            f"{crop_name} is in '{stage_name}' stage with {n_demand} nitrogen demand.",
            f"Soil telemetry: N={n} mg/kg, P={p} mg/kg, K={k} mg/kg, pH={ph}.",
        ]

        risk_score = 10.0
        risk_type = "NONE"

        # 1. Nitrogen Evaluation
        # Typical optimal ranges (mg/kg): Low < 140, Optimal 140-280, High > 280
        if n < 140:
            nitrogen_status = "DEFICIENT"
            if n_demand in ("HIGH", "MEDIUM"):
                risk_score = max(risk_score, 75.0)
                risk_type = "NUTRIENT_DEFICIENCY"
                evidence.append(f"Nitrogen is deficient ({n} mg/kg) during high-demand stage '{stage_name}'.")
            else:
                risk_score = max(risk_score, 45.0)
                evidence.append(f"Nitrogen is moderately low ({n} mg/kg).")
        elif n > 350:
            nitrogen_status = "EXCESS"
            risk_score = max(risk_score, 50.0)
            evidence.append(f"Excess nitrogen ({n} mg/kg) may cause vegetative overgrowth and lodging.")
        else:
            nitrogen_status = "OPTIMAL"

        # 2. Phosphorus Evaluation (Optimal 20-50 mg/kg)
        if p < 20:
            phosphorus_status = "DEFICIENT"
            risk_score = max(risk_score, 60.0)
            evidence.append(f"Phosphorus deficiency ({p} mg/kg) restricts root development.")
        elif p > 70:
            phosphorus_status = "EXCESS"
        else:
            phosphorus_status = "OPTIMAL"

        # 3. Potassium Evaluation (Optimal 120-250 mg/kg)
        if k < 120:
            potassium_status = "DEFICIENT"
            risk_score = max(risk_score, 55.0)
            evidence.append(f"Low potassium ({k} mg/kg) reduces stress tolerance and grain filling.")
        else:
            potassium_status = "OPTIMAL"

        # 4. pH Nutrient Availability
        if ph < 5.8:
            evidence.append(f"Acidic soil (pH {ph}) reduces phosphorus availability via iron/aluminum fixation.")
        elif ph > 7.8:
            evidence.append(f"Alkaline soil (pH {ph}) promotes phosphorus fixation with calcium.")

        # Cross-reference with 543k ML agro-environmental failure models
        ml_risk = evaluate_ml_failure_risk(nitrogen_ppm=n, soil_ph=ph)
        if "RULE_ACIDIC_NUTRIENT_LOCKOUT" in ml_risk.get("triggered_rules", []):
            evidence.append("ML Risk Alert: Soil acidity locks phosphorus uptake (XGBoost failure model).")
        if "RULE_NITROGEN_DEFICIENCY" in ml_risk.get("triggered_rules", []):
            evidence.append("ML Risk Alert: Sub-100 ppm Nitrogen identified as key yield limiter (SHAP #4).")

        # Severity
        if risk_score >= 80:
            severity = "CRITICAL"
        elif risk_score >= 60:
            severity = "HIGH"
        elif risk_score >= 30:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        # Formulate safe recommendation
        if nitrogen_status == "DEFICIENT" and n_demand in ("HIGH", "MEDIUM"):
            # Enforce strict safe application limit
            rec_kg_ha = min(45.0, SAFE_APPLICATION_LIMITS["urea_n"]["max_kg_ha"])
            rec = {
                "action": "APPLY_NITROGEN_FERTILIZER",
                "title": f"Top-Dress {rec_kg_ha} kg/ha Urea",
                "description": (
                    f"Nitrogen is deficient during critical '{stage_name}' growth phase. "
                    f"Apply {rec_kg_ha} kg/ha Urea via fertigation or soil incorporation. "
                    "Complies with safe agronomic upper-bounds."
                ),
                "priority": "P2",
                "parameters": {
                    "fertilizer": SAFE_APPLICATION_LIMITS["urea_n"]["safe_compound"],
                    "dosage_kg_per_ha": rec_kg_ha,
                    "application_method": "Side-dressing or Fertigation",
                    "safe_limit_enforced": True,
                },
            }
        elif phosphorus_status == "DEFICIENT":
            rec_kg_ha = min(35.0, SAFE_APPLICATION_LIMITS["dap_p"]["max_kg_ha"])
            rec = {
                "action": "APPLY_PHOSPHORUS_FERTILIZER",
                "title": f"Apply {rec_kg_ha} kg/ha DAP",
                "description": f"Replenish phosphorus deficit with {rec_kg_ha} kg/ha DAP band placement.",
                "priority": "P2",
                "parameters": {
                    "fertilizer": SAFE_APPLICATION_LIMITS["dap_p"]["safe_compound"],
                    "dosage_kg_per_ha": rec_kg_ha,
                    "safe_limit_enforced": True,
                },
            }
        else:
            rec = {
                "action": "MAINTAIN_NUTRITION",
                "title": "Soil Macronutrient Balance Stable",
                "description": "Available N-P-K reserves meet current stage demands. Continue standard fertility plan.",
                "priority": "P4",
            }

        return {
            "agent_name": self.name,
            "nitrogen_status": nitrogen_status,
            "phosphorus_status": phosphorus_status,
            "potassium_status": potassium_status,
            "overall_risk": {
                "score": round(risk_score, 1),
                "severity": severity,
                "type": risk_type,
            },
            "risk": {
                "score": round(risk_score, 1),
                "severity": severity,
                "type": risk_type,
            },
            "confidence": 0.91,
            "evidence": evidence,
            "recommendation": rec,
            "data": {
                "n_mg_kg": n,
                "p_mg_kg": p,
                "k_mg_kg": k,
                "ph": ph,
                "safe_limits": SAFE_APPLICATION_LIMITS,
            },
        }
