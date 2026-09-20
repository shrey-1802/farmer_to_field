"""
Test Suite: Dataset Integration
Tests all 7 datasets and loaders extracted from agricultural ML notebooks and archives:
- crop_thresholds.json (40 crops)
- disease_catalog.json (38 CNN classes)
- failure_risk_rules.json (SHAP failure risks)
- soil_recommendations.json (Soil guidelines)
- smart_irrigation_benchmarks.json (Moisture by stage, vegetation indices)
- regional_climate_baselines.json (73 districts, 20-year monthly normals)
- soil_crop_matrix.json (Crop suitability by soil & season)
"""

import pytest
from pathlib import Path
from app.services.dataset_loader import (
    load_crop_thresholds,
    get_crop_threshold,
    load_disease_catalog,
    get_disease_by_pattern,
    load_failure_risk_rules,
    evaluate_ml_failure_risk,
    load_soil_recommendations,
    get_crop_recommendation,
    load_smart_irrigation_benchmarks,
    get_crop_moisture_benchmark,
    load_regional_climate_baselines,
    get_district_climate_normal,
    load_soil_crop_matrix,
    get_suitable_crops_for_soil_season,
)
from app.services.crop_service import list_crops, get_crop, get_growth_stage
from app.agents.disease_agent import DiseaseAgent
from app.agents.irrigation_agent import IrrigationAgent
from app.agents.nutrient_agent import NutrientAgent


def test_data_files_exist():
    data_dir = Path(__file__).resolve().parent.parent / "data"
    assert (data_dir / "crop_thresholds.json").exists()
    assert (data_dir / "disease_catalog.json").exists()
    assert (data_dir / "failure_risk_rules.json").exists()
    assert (data_dir / "soil_recommendations.json").exists()
    assert (data_dir / "smart_irrigation_benchmarks.json").exists()
    assert (data_dir / "regional_climate_baselines.json").exists()
    assert (data_dir / "soil_crop_matrix.json").exists()


def test_crop_thresholds_dataset():
    crops = load_crop_thresholds().get("crops", {})
    assert len(crops) >= 39
    assert "wheat" in crops
    assert "rice" in crops
    assert "cotton" in crops
    assert "maize" in crops
    assert "ragi" in crops
    assert "arecanut" in crops
    assert len(crops["wheat"]["stages"]) >= 5


def test_smart_irrigation_benchmarks():
    benchmarks = load_smart_irrigation_benchmarks()
    assert "crop_stage_moisture_targets" in benchmarks
    assert "vegetation_health_benchmarks" in benchmarks
    assert "stress_risk_correlation" in benchmarks

    # Query specific crop stage
    wheat_stage2 = get_crop_moisture_benchmark("wheat", 2)
    assert wheat_stage2 is not None
    assert "optimal_moisture_target" in wheat_stage2
    assert "critical_low_moisture" in wheat_stage2
    assert wheat_stage2["growth_stage_code"] == 2


def test_regional_climate_baselines():
    baselines = load_regional_climate_baselines()
    assert len(baselines.get("districts", {})) >= 70
    assert "Agra" in baselines["districts"]
    assert "statewide_monthly_normals" in baselines

    # Query July monsoon normals for Agra
    agra_july = get_district_climate_normal("Agra", 7)
    assert agra_july is not None
    assert "avg_temp_c" in agra_july
    assert "estimated_monthly_rainfall_mm" in agra_july
    assert agra_july["rain_day_probability"] > 0


def test_soil_crop_matrix():
    matrix = load_soil_crop_matrix()
    assert "by_soil_and_season" in matrix
    
    # Check crops suitable for Black soil in Kharif
    kharif_black_crops = get_suitable_crops_for_soil_season("Black", "Kharif")
    assert len(kharif_black_crops) > 0

    # Check all crops for Loamy soil
    loamy_crops = get_suitable_crops_for_soil_season("Loamy")
    assert len(loamy_crops) > 0


def test_crop_service_integration():
    crops = list_crops()
    assert len(crops) >= 5
    wheat = get_crop("wheat")
    assert wheat["name"] == "Wheat"
    stage = get_growth_stage("wheat", 15)
    assert stage is not None
    assert stage["stage_name"] == "Seedling"
    assert "soil_moisture_target_pct" in stage


def test_disease_catalog_38_classes():
    cat = load_disease_catalog()
    diseases = cat.get("diseases", [])
    assert len(diseases) >= 38

    # Check high-risk diseases from CNN & KisanSahayak notebooks
    high_risk = cat.get("high_risk_diseases", [])
    assert len(high_risk) > 0

    # Pattern lookup
    apple_rot = get_disease_by_pattern("apple_black_rot")
    assert apple_rot is not None
    assert "Black Rot" in apple_rot["display_name"]
    assert apple_rot["severity"] == "HIGH"


def test_disease_agent_extended_classes():
    agent = DiseaseAgent()
    # Test Apple Black Rot
    res_apple = agent.execute({"filename": "apple_black_rot_sample.jpg"})
    assert res_apple["status"] == "SUCCESS"
    assert "Black Rot" in res_apple["prediction"]
    assert res_apple["severity"] == "HIGH"

    # Test Tomato Late Blight
    res_tomato = agent.execute({"filename": "tomato_late_blight_leaf.jpg"})
    assert res_tomato["status"] == "SUCCESS"
    assert "Late Blight" in res_tomato["prediction"]
    assert res_tomato["severity"] == "CRITICAL"


def test_ml_failure_risk_evaluation():
    # Extreme drought + heat
    eval_res = evaluate_ml_failure_risk(soil_moisture_pct=14.0, air_temp_c=35.0)
    assert eval_res["severity"] == "CRITICAL"
    assert eval_res["stress_level"] == "SEVERE"
    assert "RULE_CRITICAL_DROUGHT" in eval_res["triggered_rules"]
    assert "RULE_COMPOUND_HEAT_DROUGHT" in eval_res["triggered_rules"]

    # Waterlogging
    eval_wet = evaluate_ml_failure_risk(soil_moisture_pct=92.0)
    assert "RULE_WATERLOGGING" in eval_wet["triggered_rules"]

    # Acidic lockout
    eval_acid = evaluate_ml_failure_risk(soil_ph=4.8)
    assert "RULE_ACIDIC_NUTRIENT_LOCKOUT" in eval_acid["triggered_rules"]


def test_soil_recommendations_22_crops():
    recs = load_soil_recommendations()
    crops = recs.get("crops", {})
    assert len(crops) == 22
    assert "cotton" in crops
    assert "coffee" in crops
    assert "grapes" in crops
    cotton_rec = get_crop_recommendation("cotton")
    assert "N" in cotton_rec
    assert "rainfall" in cotton_rec


def test_irrigation_agent_incorporates_ml():
    agent = IrrigationAgent()
    # Provide telemetry with extreme heat + drought to trigger compound risk
    context = {
        "sensor_summary": {
            "SOIL_MOISTURE": {"measurements": {"soil_moisture": 16.0}}
        },
        "crop_stage": {"crop_id": "wheat", "stage_name": "Tillering", "soil_moisture_target_pct": 60.0},
        "weather": {
            "current": {"temperature_c": 34.0, "relative_humidity_pct": 35.0, "et0_mm": 5.2},
            "daily": {"precipitation_prob_max_pct": [10], "precipitation_sum_mm": [0.0]}
        }
    }
    res = agent.execute(context)
    assert res["status"] == "SUCCESS"
    assert res["severity"] == "CRITICAL"
    assert res["recommended_action"] == "TRIGGER_IRRIGATION"
    # Ensure evidence mentions ML Risk Alert
    has_ml_evidence = any("ML Risk Alert" in ev for ev in res["evidence"])
    assert has_ml_evidence is True
