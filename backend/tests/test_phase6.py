"""
Phase 6 Comprehensive Test Suite
BACKEND.md Phases 16 - 25:
- Phase 16: Base Agent Contract (run, validate, structured results)
- Phase 17: Soil Agent
- Phase 18: Weather Agent
- Phase 19: Irrigation Agent
- Phase 20: Nutrient Agent & Safe Application Bounds
- Phase 21: Disease / Drone Vision Agent (validation, pathology, weather correlation)
- Phase 22: Market Intelligence Agent
- Phase 23: Risk Engine (0-100 normalization, severity tiers)
- Phase 24 & 25: Multi-Agent Orchestrator & Conflict Resolution Engine
- Agent API Endpoints
"""

import pytest
import io
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.agents.base import BaseAgent
from app.agents.soil_agent import SoilAgent
from app.agents.weather_agent import WeatherAgent
from app.agents.irrigation_agent import IrrigationAgent
from app.agents.nutrient_agent import NutrientAgent
from app.agents.disease_agent import DiseaseAgent
from app.agents.market_agent import MarketAgent
from app.agents.risk_engine import RiskEngine, normalize_risk_score, score_to_severity
from app.agents.orchestrator import MultiAgentOrchestrator
from app.db.database import SessionLocal
from app.db.models.farm import Farm

client = TestClient(app)


# Sample realistic farm context fixture
@pytest.fixture
def mock_context():
    return {
        "context_version": "1.0",
        "farm": {
            "id": "test-farm-id",
            "name": "Green Valley Test Farm",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "soil_type": "Loamy",
        },
        "crop_stage": {
            "crop_id": "wheat",
            "stage_name": "Tillering",
            "soil_moisture_target_pct": 65.0,
            "nitrogen_demand": "HIGH",
        },
        "sensor_summary": {
            "SOIL_MOISTURE": {
                "measurements": {"soil_moisture": 38.0, "soil_temperature": 24.5},
            },
            "NPK": {
                "measurements": {"nitrogen": 110.0, "phosphorus": 18.0, "potassium": 160.0},
            },
            "PH": {
                "measurements": {"ph": 6.5},
            },
            "EC": {
                "measurements": {"ec": 1.2},
            },
        },
        "weather": {
            "weather_available": True,
            "current": {
                "temperature_c": 28.0,
                "relative_humidity_pct": 62.0,
                "wind_speed_kmh": 12.0,
                "precipitation_mm": 0.0,
                "et0_mm": 4.2,
            },
            "daily": {
                "precipitation_sum_mm": [0.0, 0.0],
                "precipitation_prob_max_pct": [10, 20],
            },
        },
    }


# ==============================================================================
# 1. BASE AGENT CONTRACT (PHASE 16)
# ==============================================================================

def test_base_agent_contract():
    """Verify BaseAgent validates input, output, and enforces required fields."""
    agent = SoilAgent()
    meta = agent.get_metadata()
    assert meta["agent_name"] == "SoilAgent"
    assert "supported_inputs" in meta
    assert "supported_outputs" in meta

    status = agent.get_status()
    assert status["status"] == "HEALTHY"

    # Input validation
    assert agent.validate_input({}) is False
    assert agent.validate_input({"farm": {}}) is True

    # Output validation
    valid_res = {
        "agent_name": "TestAgent",
        "run_id": "123",
        "timestamp": "2026-09-19T00:00:00Z",
        "status": "SUCCESS",
        "risk": {"score": 20.0, "severity": "LOW", "type": "NONE"},
        "confidence": 0.90,
        "evidence": ["Normal"],
        "recommendation": {"action": "NONE"},
    }
    assert agent.validate_output(valid_res) is True

    invalid_res = valid_res.copy()
    invalid_res.pop("confidence")
    assert agent.validate_output(invalid_res) is False


# ==============================================================================
# 2. SOIL AGENT (PHASE 17)
# ==============================================================================

def test_soil_agent_deficit_trigger(mock_context):
    """Verify SoilAgent triggers water stress and irrigation alert on low moisture."""
    agent = SoilAgent()
    res = agent.execute(mock_context)
    assert res["status"] == "SUCCESS"
    assert res["water_status"] == "CRITICAL_DEFICIT"
    assert res["risk"]["score"] >= 80.0
    assert res["recommendation"]["action"] == "TRIGGER_IRRIGATION"
    assert len(res["evidence"]) >= 1


# ==============================================================================
# 3. WEATHER AGENT (PHASE 18)
# ==============================================================================

def test_weather_agent_spraying_and_rain_evaluation(mock_context):
    """Verify WeatherAgent evaluates spraying suitability and imminent rain."""
    agent = WeatherAgent()
    res = agent.execute(mock_context)
    assert res["status"] == "SUCCESS"
    assert res["spraying_suitability"] == "OPTIMAL"
    assert res["weather_window"]["spraying_window"] != "CURRENTLY_CLOSED"

    # Test with heavy rain
    wet_context = mock_context.copy()
    wet_context["weather"] = {
        "current": {"temperature_c": 24.0, "wind_speed_kmh": 22.0, "relative_humidity_pct": 85.0},
        "daily": {"precipitation_sum_mm": [35.0], "precipitation_prob_max_pct": [90]},
    }
    wet_res = agent.execute(wet_context)
    assert wet_res["rain_risk"] == "HEAVY_RAIN_IMMINENT"
    assert wet_res["spraying_suitability"] == "UNSUITABLE_HIGH_WIND"
    assert wet_res["irrigation_suitability"] == "DELAY_RAIN_IMMINENT"


# ==============================================================================
# 4. IRRIGATION AGENT (PHASE 19)
# ==============================================================================

def test_irrigation_agent_calculations(mock_context):
    """Verify IrrigationAgent computes moisture deficit and runtime window."""
    agent = IrrigationAgent()
    res = agent.execute(mock_context)
    assert res["status"] == "SUCCESS"
    assert res["recommended_action"] == "TRIGGER_IRRIGATION"
    assert res["estimated_duration"] > 0
    assert "Morning" in res["recommended_window"]
    assert res["data"]["deficit_pct"] == 27.0


# ==============================================================================
# 5. NUTRIENT AGENT & SAFETY LIMITS (PHASE 20)
# ==============================================================================

def test_nutrient_agent_safety_bounds(mock_context):
    """Verify NutrientAgent detects deficiency and caps dosage within safe agronomic limits."""
    agent = NutrientAgent()
    res = agent.execute(mock_context)
    assert res["status"] == "SUCCESS"
    assert res["nitrogen_status"] == "DEFICIENT"
    assert res["recommendation"]["action"] == "APPLY_NITROGEN_FERTILIZER"
    # Verify dosage does not exceed safe upper bound
    dosage = res["recommendation"]["parameters"]["dosage_kg_per_ha"]
    assert dosage <= 65.0
    assert res["recommendation"]["parameters"]["safe_limit_enforced"] is True


# ==============================================================================
# 6. DISEASE / DRONE VISION AGENT (PHASE 21)
# ==============================================================================

def test_disease_agent_validation_and_diagnosis():
    """Verify DiseaseAgent validates input constraints and produces advisory output."""
    agent = DiseaseAgent()

    # Format validation
    valid, msg = agent.validate_image("leaf.jpg", "image/jpeg", 50000)
    assert valid is True

    invalid_type, msg = agent.validate_image("script.sh", "application/x-sh", 5000)
    assert invalid_type is False

    oversize, msg = agent.validate_image("giant.jpg", "image/jpeg", 20 * 1024 * 1024)
    assert oversize is False

    # Inference execution with rust keyword
    res = agent.execute({"filename": "field_rust_spot.jpg", "weather": {"current": {"relative_humidity_pct": 88.0, "temperature_c": 14.0}}})
    assert res["status"] == "SUCCESS"
    assert "Rust" in res["prediction"]
    assert res["severity"] == "CRITICAL"
    assert "disclaimer" in res


# ==============================================================================
# 7. MARKET AGENT (PHASE 22)
# ==============================================================================

def test_market_agent_signals():
    """Verify MarketAgent provides decision support based on stage and spot prices."""
    agent = MarketAgent()
    # Growing phase -> HOLD
    res_growing = agent.execute({"crop_stage": {"crop_id": "wheat", "stage_name": "Tillering"}})
    assert res_growing["market_signal"] == "HOLD_CROP_DEVELOPING"

    # Mature phase -> SELL_ON_PEAK (since wheat trend is UPWARD)
    res_mature = agent.execute({"crop_stage": {"crop_id": "wheat", "stage_name": "Maturity"}})
    assert res_mature["market_signal"] == "SELL_ON_PEAK"
    assert "₹" in res_mature["current_price"]


# ==============================================================================
# 8. RISK ENGINE (PHASE 23)
# ==============================================================================

def test_risk_engine_normalization():
    """Verify RiskEngine normalizes scores to 0-100 and classifies severity tiers."""
    assert normalize_risk_score(-10) == 0.0
    assert normalize_risk_score(150) == 100.0
    assert normalize_risk_score(72.56) == 72.6

    assert score_to_severity(85.0) == "CRITICAL"
    assert score_to_severity(65.0) == "HIGH"
    assert score_to_severity(45.0) == "MEDIUM"
    assert score_to_severity(20.0) == "LOW"


# ==============================================================================
# 9. MULTI-AGENT ORCHESTRATOR & CONFLICT RESOLUTION (PHASE 24 & 25)
# ==============================================================================

def test_orchestrator_conflict_resolution(mock_context):
    """
    CRITICAL TEST:
    Irrigation Agent wants to irrigate due to soil moisture deficit,
    BUT Weather forecast indicates heavy incoming rain.
    Orchestrator must detect conflict and override irrigation to standby!
    """
    orchestrator = MultiAgentOrchestrator()

    # Inject heavy rain forecast
    conflict_context = mock_context.copy()
    conflict_context["weather"]["daily"]["precipitation_sum_mm"] = [30.0]
    conflict_context["weather"]["daily"]["precipitation_prob_max_pct"] = [85]

    res = orchestrator.run_all(conflict_context)
    assert res["overall_status"] == "COMPLETED"
    assert len(res["conflicts_detected"]) >= 1

    conflict = res["conflicts_detected"][0]
    assert conflict["conflict_type"] == "IRRIGATION_WEATHER_CONFLICT"
    assert conflict["resolution"] == "OVERRIDE_IRRIGATION_TO_STANDBY"

    # Action plan should reflect the override
    override_actions = [a for a in res["action_plan"] if a["category"] == "IRRIGATION_OVERRIDE"]
    assert len(override_actions) == 1
    assert "Hold Irrigation" in override_actions[0]["title"]


# ==============================================================================
# 10. MULTI-AGENT API ENDPOINTS
# ==============================================================================

def test_agent_api_endpoints():
    """Verify agent catalog, execution endpoints, and run logs."""
    # 1. Catalog
    res_cat = client.get("/api/agents/catalog")
    assert res_cat.status_code == 200
    assert res_cat.json()["total_agents"] == 6

    # 2. Get existing farm from DB
    db = SessionLocal()
    farm = db.query(Farm).first()
    assert farm is not None
    farm_id = farm.id
    db.close()

    # 3. Single agent run (Soil)
    res_soil = client.post("/api/agents/soil/run", json={"farm_id": farm_id})
    assert res_soil.status_code == 200
    assert res_soil.json()["agent_name"] == "SoilAgent"

    # 4. Full Orchestrator run
    res_orch = client.post("/api/agents/run", json={"farm_id": farm_id})
    assert res_orch.status_code == 200
    orch_data = res_orch.json()
    assert "orchestration_id" in orch_data
    assert "action_plan" in orch_data
    assert "agent_summaries" in orch_data

    # 5. Disease Analysis via API
    res_dis = client.post(
        "/api/agents/disease/analyze",
        data={"farm_id": farm_id},
        files={"file": ("leaf_blight_sample.jpg", io.BytesIO(b"fake-image-bytes" * 50), "image/jpeg")},
    )
    assert res_dis.status_code == 200
    assert "prediction" in res_dis.json()

    # 6. Query runs
    res_runs = client.get(f"/api/agents/runs?farm_id={farm_id}")
    assert res_runs.status_code == 200
    assert len(res_runs.json()) >= 1
