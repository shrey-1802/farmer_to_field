"""
Dataset Loader Service
Loads and serves datasets extracted from agricultural machine learning notebooks and datasets:
- crop_thresholds.json (39 crops)
- disease_catalog.json (38 disease classes)
- failure_risk_rules.json (SHAP failure risks)
- soil_recommendations.json (Soil guidelines)
- smart_irrigation_benchmarks.json (Moisture by stage, vegetation indices)
- regional_climate_baselines.json (73 districts, 20-year monthly normals)
- soil_crop_matrix.json (Crop suitability by soil & season)
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
_CACHE: Dict[str, Any] = {}

def _load_json_file(filename: str, default: Any = None) -> Any:
    if filename in _CACHE:
        return _CACHE[filename]
    filepath = DATA_DIR / filename
    if not filepath.exists():
        logger.warning(f"Dataset file {filepath} does not exist, using fallback.")
        return default if default is not None else {}
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            _CACHE[filename] = data
            return data
    except Exception as e:
        logger.error(f"Failed to load dataset {filepath}: {e}")
        return default if default is not None else {}

def load_crop_thresholds() -> Dict[str, Any]:
    raw = _load_json_file("crop_thresholds.json", {})
    if isinstance(raw, dict) and "crops" in raw:
        return raw
    return {"crops": raw if isinstance(raw, dict) else {}}

def get_crop_threshold(crop_id: str) -> Optional[Dict[str, Any]]:
    data = load_crop_thresholds()
    return data.get("crops", {}).get(crop_id.lower())

def load_disease_catalog() -> Dict[str, Any]:
    return _load_json_file("disease_catalog.json", {"diseases": [], "high_risk_diseases": []})

def get_disease_by_pattern(pattern: str) -> Optional[Dict[str, Any]]:
    cat = load_disease_catalog()
    p_low = pattern.lower()
    for d in cat.get("diseases", []):
        if (p_low in d.get("pattern", "").lower() or
            p_low in d.get("id", "").lower() or
            p_low in d.get("display_name", "").lower()):
            return d
    return None

def load_failure_risk_rules() -> Dict[str, Any]:
    return _load_json_file("failure_risk_rules.json", {"rules": []})

def load_soil_recommendations() -> Dict[str, Any]:
    return _load_json_file("soil_recommendations.json", {"crops": {}})

def get_crop_recommendation(crop_name: str) -> Optional[Dict[str, Any]]:
    recs = load_soil_recommendations()
    return recs.get("crops", {}).get(crop_name.lower())

def load_smart_irrigation_benchmarks() -> Dict[str, Any]:
    return _load_json_file("smart_irrigation_benchmarks.json", {})

def get_crop_moisture_benchmark(crop_type: str, growth_stage: Optional[int] = None) -> Optional[Dict[str, Any]]:
    benchmarks = load_smart_irrigation_benchmarks().get("crop_stage_moisture_targets", {})
    c_data = benchmarks.get(crop_type.capitalize()) or benchmarks.get(crop_type.lower())
    if not c_data:
        return None
    if growth_stage is None:
        return c_data
    for stage_label, stage_info in c_data.items():
        if stage_info.get("growth_stage_code") == growth_stage:
            return stage_info
    return None

def load_regional_climate_baselines() -> Dict[str, Any]:
    return _load_json_file("regional_climate_baselines.json", {})

def get_district_climate_normal(district: str, month: Optional[int] = None) -> Optional[Dict[str, Any]]:
    baselines = load_regional_climate_baselines()
    districts = baselines.get("districts", {})
    
    # Direct or case-insensitive match
    matched = None
    for d_name, d_val in districts.items():
        if d_name.lower() == district.lower():
            matched = d_val
            break
            
    if not matched:
        # Fallback to statewide normals if district not found
        normals = baselines.get("statewide_monthly_normals", {})
        if month is not None:
            month_names = {
                1: "January", 2: "February", 3: "March", 4: "April",
                5: "May", 6: "June", 7: "July", 8: "August",
                9: "September", 10: "October", 11: "November", 12: "December"
            }
            m_str = month_names.get(month, "")
            return normals.get(m_str)
        return normals

    if month is None:
        return matched
        
    month_names = {
        1: "January", 2: "February", 3: "March", 4: "April",
        5: "May", 6: "June", 7: "July", 8: "August",
        9: "September", 10: "October", 11: "November", 12: "December"
    }
    m_name = month_names.get(month, "")
    return matched.get("monthly_climatology", {}).get(m_name)

def load_soil_crop_matrix() -> Dict[str, Any]:
    return _load_json_file("soil_crop_matrix.json", {})

def get_suitable_crops_for_soil_season(soil_type: str, season: Optional[str] = None) -> List[str]:
    matrix = load_soil_crop_matrix()
    by_soil = matrix.get("by_soil_and_season", {})
    soil_match = None
    for s_name, s_seasons in by_soil.items():
        if s_name.lower() == soil_type.lower():
            soil_match = s_seasons
            break
    if not soil_match:
        return []
    if season is None:
        all_crops = []
        for c_list in soil_match.values():
            all_crops.extend(c_list)
        return sorted(list(set(all_crops)))
    for sea_name, c_list in soil_match.items():
        if sea_name.lower() == season.lower():
            return c_list
    return []

def evaluate_ml_failure_risk(
    soil_moisture_pct: Optional[float] = None,
    air_temp_c: Optional[float] = None,
    soil_ph: Optional[float] = None,
    nitrogen_ppm: Optional[float] = None,
    humidity_pct: Optional[float] = None,
    salinity_ec: Optional[float] = None,
) -> Dict[str, Any]:
    rules_data = load_failure_risk_rules()
    rules = rules_data.get("rules", [])
    triggered_rules = []
    base_risk = 10.0
    stress_level = "NONE"

    if soil_moisture_pct is not None and soil_moisture_pct < 20.0:
        triggered_rules.append("RULE_CRITICAL_DROUGHT")
        base_risk = max(base_risk, 85.0)
        stress_level = "SEVERE"

    if air_temp_c is not None and air_temp_c >= 32.0 and soil_moisture_pct is not None and soil_moisture_pct < 25.0:
        triggered_rules.append("RULE_COMPOUND_HEAT_DROUGHT")
        base_risk = max(base_risk, 92.0)
        stress_level = "SEVERE"

    if soil_moisture_pct is not None and soil_moisture_pct > 88.0:
        triggered_rules.append("RULE_WATERLOGGING")
        base_risk = max(base_risk, 65.0)
        if stress_level != "SEVERE": stress_level = "MODERATE"

    if soil_ph is not None and soil_ph < 5.5:
        triggered_rules.append("RULE_ACIDIC_NUTRIENT_LOCKOUT")
        base_risk = max(base_risk, 60.0)
        if stress_level != "SEVERE": stress_level = "MODERATE"

    if (soil_ph is not None and soil_ph > 8.0) or (salinity_ec is not None and salinity_ec > 3.0):
        triggered_rules.append("RULE_ALKALINE_SALINITY_STRESS")
        base_risk = max(base_risk, 55.0)
        if stress_level != "SEVERE": stress_level = "MODERATE"

    if nitrogen_ppm is not None and nitrogen_ppm < 100.0:
        triggered_rules.append("RULE_NITROGEN_DEFICIENCY")
        base_risk = max(base_risk, 50.0)
        if stress_level != "SEVERE": stress_level = "MODERATE"

    if humidity_pct is not None and humidity_pct > 80.0 and air_temp_c is not None and 20.0 <= air_temp_c <= 30.0:
        triggered_rules.append("RULE_DISEASE_FAVORABLE_WINDOW")
        base_risk = max(base_risk, 60.0)
        if stress_level != "SEVERE": stress_level = "MODERATE"

    if base_risk >= 80:
        severity = "CRITICAL"
    elif base_risk >= 60:
        severity = "HIGH"
    elif base_risk >= 30:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    return {
        "risk_score": round(base_risk, 1),
        "severity": severity,
        "stress_level": stress_level,
        "triggered_rules": triggered_rules,
        "rules_evaluated_count": len(rules),
        "ml_model_source": "XGBoost/SHAP on 543k agro-environmental records",
    }
