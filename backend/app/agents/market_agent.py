"""
Market Intelligence & Decision Support Agent
BACKEND.md Phase 22

Inputs:
- crop, market, current price, historical prices, harvest readiness, storage capacity

Outputs:
- current price, trend, market signal, confidence, evidence, recommendation

Safety Disclaimer:
- Strictly advisory / decision support. Never promises guaranteed profit or guaranteed prices.
"""

from typing import Dict, Any, List
from app.agents.base import BaseAgent


# Live/indicative mandi price benchmark catalog (INR / quintal)
MANDI_PRICE_BENCHMARKS = {
    "wheat": {"mandi": "Khanna Mandi, Punjab", "msp": 2275, "modal_price": 2420, "trend": "UPWARD", "weekly_change_pct": 3.4},
    "rice": {"mandi": "Karnal Mandi, Haryana", "msp": 2183, "modal_price": 2350, "trend": "STABLE", "weekly_change_pct": 0.8},
    "cotton": {"mandi": "Rajkot Mandi, Gujarat", "msp": 6620, "modal_price": 7150, "trend": "UPWARD", "weekly_change_pct": 4.2},
    "maize": {"mandi": "Davangere, Karnataka", "msp": 2090, "modal_price": 2150, "trend": "DOWNWARD", "weekly_change_pct": -2.1},
    "sugarcane": {"mandi": "Kolhapur, Maharashtra", "msp": 315, "modal_price": 340, "trend": "STABLE", "weekly_change_pct": 0.0},
    "tomato": {"mandi": "Kolar APMC, Karnataka", "msp": 1200, "modal_price": 1850, "trend": "VOLATILE_UP", "weekly_change_pct": 12.5},
}


class MarketAgent(BaseAgent):
    """
    Synthesizes localized APMC mandi spot prices, MSP floors,
    and stage-of-maturity to provide harvest timing and monetization guidance.
    """

    def __init__(self):
        super().__init__(
            name="MarketAgent",
            version="1.0.0",
            description="Analyzes mandi commodity prices, price trends, and harvest monetization signals",
        )

    def _supported_inputs(self) -> list:
        return ["crop", "crop_stage", "mandi_prices", "harvest_readiness"]

    def validate_input(self, context: Dict[str, Any]) -> bool:
        if not isinstance(context, dict):
            return False
        return "crop_stage" in context or "farm" in context or "crop" in context or "mandi" in context

    def _supported_outputs(self) -> list:
        return ["current_price", "trend", "market_signal", "confidence", "evidence", "recommendation"]

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        crop_stage = context.get("crop_stage") or {}
        crop_id = crop_stage.get("crop_id", "wheat").lower()
        stage_name = crop_stage.get("stage_name", "Vegetative")

        bench = MANDI_PRICE_BENCHMARKS.get(crop_id, MANDI_PRICE_BENCHMARKS["wheat"])
        crop_title = crop_id.capitalize()

        modal_price = bench["modal_price"]
        trend = bench["trend"]
        weekly_pct = bench["weekly_change_pct"]
        mandi = bench["mandi"]
        msp = bench["msp"]

        evidence: List[str] = [
            f"Benchmark Market: {mandi} for {crop_title}.",
            f"Modal Price: ₹{modal_price}/quintal (MSP: ₹{msp}/quintal, Premium: +{round(((modal_price - msp)/msp)*100, 1)}%).",
            f"Weekly Price Trend: {trend} ({weekly_pct:+}%).",
            f"Crop Growth Stage: {stage_name}.",
        ]

        # Determine signal based on harvest readiness & price trend
        is_harvest_ready = stage_name in ("Maturity", "Post-Maturity", "Harvesting", "Ripening", "Boll Opening")

        if is_harvest_ready:
            if trend in ("UPWARD", "VOLATILE_UP"):
                market_signal = "SELL_ON_PEAK"
                rec_action = "PLAN_HARVEST_AND_MARKETING"
                rec_desc = f"Prices are strong (₹{modal_price}/q) and crop is mature. Schedule harvest within 3-5 days to capture peak spot realization."
                priority = "P1"
            else:
                market_signal = "STORE_IF_CAPABLE"
                rec_action = "STORE_FOR_BETTER_REALIZATION"
                rec_desc = f"Crop is harvest-ready but prices are currently softer. If safe hermetic storage is available, consider holding for 2-3 weeks."
                priority = "P2"
        else:
            market_signal = "HOLD_CROP_DEVELOPING"
            rec_action = "CONTINUE_GROWTH"
            rec_desc = f"Crop is still in {stage_name} phase. Monitor weekly price movements towards targeted harvest window."
            priority = "P4"

        evidence.append(f"Derived Market Signal: {market_signal}.")

        rec = {
            "action": rec_action,
            "title": f"Market Signal: {market_signal.replace('_', ' ')}",
            "description": rec_desc,
            "priority": priority,
            "parameters": {
                "modal_price_per_quintal": modal_price,
                "msp_per_quintal": msp,
                "market_location": mandi,
                "weekly_change_pct": weekly_pct,
            },
        }

        return {
            "agent_name": self.name,
            "current_price": f"₹{modal_price}/quintal",
            "trend": trend,
            "market_signal": market_signal,
            "confidence": 0.88,
            "evidence": evidence,
            "recommendation": rec,
            "risk": {
                "score": 25.0 if trend != "DOWNWARD" else 55.0,
                "severity": "LOW" if trend != "DOWNWARD" else "MEDIUM",
                "type": "MARKET_SIGNAL",
            },
            "disclaimer": "Market intelligence is provided solely for decision support and does not represent guaranteed future price returns.",
            "data": {
                "crop_id": crop_id,
                "mandi": mandi,
                "modal_price": modal_price,
                "msp": msp,
                "weekly_change_pct": weekly_pct,
                "trend": trend,
            },
        }
