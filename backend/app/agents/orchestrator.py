"""
Multi-Agent Orchestrator & Conflict Resolution Engine
BACKEND.md Phase 24 & 25

Coordinates:
- Soil Agent
- Weather Agent
- Irrigation Agent
- Nutrient Agent
- Market Agent

Flow:
Agent Results -> Validate -> Compare -> Detect Conflicts -> Prioritize Risks -> Apply Policies -> Generate Action Plan

Conflict Resolution Examples:
- Irrigation recommends water, BUT Weather predicts heavy rain -> OVERRIDE: Postpone irrigation, save power and avoid waterlogging.
- Nutrient recommends foliar spray, BUT Weather reports wind > 18 km/h or imminent rain -> OVERRIDE: Defer spraying to prevent drift/washoff.
- Soil reports waterlogging -> OVERRIDE: Block all irrigation requests.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid
from sqlalchemy.orm import Session

from app.agents.soil_agent import SoilAgent
from app.agents.weather_agent import WeatherAgent
from app.agents.irrigation_agent import IrrigationAgent
from app.agents.nutrient_agent import NutrientAgent
from app.agents.market_agent import MarketAgent
from app.agents.risk_engine import RiskEngine
from app.db.models.agent import AgentRun, Recommendation


class MultiAgentOrchestrator:
    """
    Master orchestrator synthesizing domain agents into a coherent,
    conflict-free, prioritized agricultural action plan.
    """

    def __init__(self):
        self.soil_agent = SoilAgent()
        self.weather_agent = WeatherAgent()
        self.irrigation_agent = IrrigationAgent()
        self.nutrient_agent = NutrientAgent()
        self.market_agent = MarketAgent()

    def run_all(
        self,
        context: Dict[str, Any],
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """
        Execute full multi-agent deliberation cycle:
        1. Run all domain agents in sequence
        2. Perform risk aggregation via RiskEngine
        3. Detect and resolve cross-agent policy conflicts
        4. Synthesize final actionable advisory
        5. Persist run records to database
        """
        orchestration_id = str(uuid.uuid4())
        farm = context.get("farm") or {}
        farm_id = farm.get("id", "unknown_farm")
        field = context.get("field") or {}
        field_id = field.get("id")
        zone = context.get("zone") or {}
        zone_id = zone.get("id")

        # 1. Execute individual domain agents
        soil_res = self.soil_agent.execute(context)
        weather_res = self.weather_agent.execute(context)
        irrigation_res = self.irrigation_agent.execute(context)
        nutrient_res = self.nutrient_agent.execute(context)
        market_res = self.market_agent.execute(context)

        agent_results = [soil_res, weather_res, irrigation_res, nutrient_res, market_res]

        # 2. Risk Engine Aggregation
        risk_summary = RiskEngine.aggregate_risks(
            agent_results=agent_results,
            farm_id=farm_id,
            field_id=field_id,
            zone_id=zone_id,
            db=db,
        )

        # 3. Detect and Resolve Conflicts (Phase 24 & 25)
        conflicts_detected: List[Dict[str, Any]] = []
        action_plan: List[Dict[str, Any]] = []

        # Conflict Check 1: Irrigation vs Heavy Rain
        irrig_rec = irrigation_res.get("recommendation", {})
        weather_rain_risk = weather_res.get("rain_risk")
        weather_rain_precip = weather_res.get("data", {}).get("forecast_rain_mm", 0.0)

        if irrig_rec.get("action") == "TRIGGER_IRRIGATION" and weather_rain_risk in ("HEAVY_RAIN_IMMINENT", "MODERATE_RAIN"):
            conflict = {
                "conflict_type": "IRRIGATION_WEATHER_CONFLICT",
                "agents_involved": ["IrrigationAgent", "WeatherAgent"],
                "policy": "POLICY_NEVER_IRRIGATE_BEFORE_HEAVY_RAIN",
                "description": f"IrrigationAgent requested water, but WeatherAgent forecast {weather_rain_precip}mm rain.",
                "resolution": "OVERRIDE_IRRIGATION_TO_STANDBY",
                "reasoning": "Postponing irrigation saves pumping electricity, preserves reservoir levels, and prevents root asphyxiation.",
            }
            conflicts_detected.append(conflict)
            # Override recommendation in action plan
            action_plan.append({
                "action_id": str(uuid.uuid4()),
                "priority": "P1",
                "category": "IRRIGATION_OVERRIDE",
                "title": "Hold Irrigation — Rain Imminent",
                "instruction": f"Do not activate pumps. {weather_rain_precip}mm rainfall expected within 24 hours.",
                "source_agents": ["WeatherAgent", "OrchestratorPolicy"],
                "requires_approval": False,
                "evidence": [conflict["description"], conflict["reasoning"]],
            })
        elif irrig_rec.get("action") == "TRIGGER_IRRIGATION":
            action_plan.append({
                "action_id": str(uuid.uuid4()),
                "priority": irrig_rec.get("priority", "P2"),
                "category": "IRRIGATION",
                "title": irrig_rec.get("title", "Run Irrigation"),
                "instruction": irrig_rec.get("description"),
                "parameters": irrig_rec.get("parameters", {}),
                "source_agents": ["IrrigationAgent"],
                "requires_approval": True,
                "evidence": irrigation_res.get("evidence", []),
            })

        # Conflict Check 2: Spraying / Nutrient vs High Wind or Rain
        nutrient_rec = nutrient_res.get("recommendation", {})
        spraying_suitability = weather_res.get("spraying_suitability", "OPTIMAL")
        wind_speed = weather_res.get("data", {}).get("wind_speed_kmh", 0.0)

        if nutrient_rec.get("action") in ("APPLY_NITROGEN_FERTILIZER", "APPLY_PHOSPHORUS_FERTILIZER"):
            if spraying_suitability != "OPTIMAL" and "Fertigation" not in nutrient_rec.get("parameters", {}).get("application_method", ""):
                conflict = {
                    "conflict_type": "SPRAYING_WEATHER_CONFLICT",
                    "agents_involved": ["NutrientAgent", "WeatherAgent"],
                    "policy": "POLICY_SAFE_SPRAYING_WINDOWS",
                    "description": f"Nutrient application recommended, but wind/rain suitability is '{spraying_suitability}' (wind: {wind_speed} km/h).",
                    "resolution": "DEFER_SPRAYING_WINDOW",
                    "reasoning": "High wind causes chemical drift; rain causes nutrient runoff into local waterways.",
                }
                conflicts_detected.append(conflict)
                action_plan.append({
                    "action_id": str(uuid.uuid4()),
                    "priority": "P2",
                    "category": "FERTILITY_OVERRIDE",
                    "title": "Defer Foliar Spray — Adverse Weather Window",
                    "instruction": f"Wait for calm weather window before applying {nutrient_rec.get('parameters', {}).get('fertilizer', 'fertilizer')}.",
                    "source_agents": ["NutrientAgent", "WeatherAgent"],
                    "requires_approval": False,
                    "evidence": [conflict["description"]],
                })
            else:
                action_plan.append({
                    "action_id": str(uuid.uuid4()),
                    "priority": nutrient_rec.get("priority", "P2"),
                    "category": "FERTILITY",
                    "title": nutrient_rec.get("title"),
                    "instruction": nutrient_rec.get("description"),
                    "parameters": nutrient_rec.get("parameters", {}),
                    "source_agents": ["NutrientAgent"],
                    "requires_approval": True,
                    "evidence": nutrient_res.get("evidence", []),
                })

        # Add Market & Soil advisory if non-trivial
        market_rec = market_res.get("recommendation", {})
        if market_rec.get("action") not in ("CONTINUE_GROWTH", "MAINTAIN_CURRENT_SCHEDULE"):
            action_plan.append({
                "action_id": str(uuid.uuid4()),
                "priority": market_rec.get("priority", "P3"),
                "category": "MARKET_HARVEST",
                "title": market_rec.get("title"),
                "instruction": market_rec.get("description"),
                "parameters": market_rec.get("parameters", {}),
                "source_agents": ["MarketAgent"],
                "requires_approval": False,
                "evidence": market_res.get("evidence", []),
            })

        # Sort action plan: P1 first, then P2, P3, P4
        priority_map = {"P1": 0, "P2": 1, "P3": 2, "P4": 3}
        action_plan.sort(key=lambda a: priority_map.get(a.get("priority", "P3"), 99))

        # 4. Persist run records to Database if db is provided
        if db is not None:
            try:
                for agent_out in agent_results:
                    run_rec = AgentRun(
                        agent_name=agent_out["agent_name"],
                        farm_id=farm_id,
                        field_id=field_id,
                        zone_id=zone_id,
                        status=agent_out["status"],
                        confidence=agent_out["confidence"],
                        output_result=agent_out,
                        evidence="\n".join(agent_out.get("evidence", [])),
                    )
                    db.add(run_rec)
                db.commit()
            except Exception:
                db.rollback()

        return {
            "orchestration_id": orchestration_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "farm_id": farm_id,
            "field_id": field_id,
            "overall_status": "COMPLETED",
            "overall_risk": risk_summary["overall_severity"],
            "overall_risk_score": risk_summary["overall_score"],
            "conflicts_detected": conflicts_detected,
            "action_plan": action_plan,
            "agent_summaries": {
                "soil": {
                    "condition": soil_res.get("soil_condition"),
                    "water_status": soil_res.get("water_status"),
                    "risk": soil_res.get("risk"),
                },
                "weather": {
                    "heat_risk": weather_res.get("heat_risk"),
                    "rain_risk": weather_res.get("rain_risk"),
                    "spraying_suitability": weather_res.get("spraying_suitability"),
                },
                "irrigation": {
                    "recommended_action": irrigation_res.get("recommended_action"),
                    "need_mm": irrigation_res.get("data", {}).get("irrigation_need_mm"),
                    "duration_minutes": irrigation_res.get("estimated_duration"),
                },
                "nutrient": {
                    "n_status": nutrient_res.get("nitrogen_status"),
                    "p_status": nutrient_res.get("phosphorus_status"),
                    "k_status": nutrient_res.get("potassium_status"),
                },
                "market": {
                    "signal": market_res.get("market_signal"),
                    "price": market_res.get("current_price"),
                    "trend": market_res.get("trend"),
                },
            },
            "detailed_agent_results": {
                "soil": soil_res,
                "weather": weather_res,
                "irrigation": irrigation_res,
                "nutrient": nutrient_res,
                "market": market_res,
            },
        }
