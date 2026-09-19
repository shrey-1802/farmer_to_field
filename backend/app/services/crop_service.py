"""
Crop Intelligence Service
BACKEND.md Phase 15 (Farm Context - Crop/Stage component)

Provides:
- Crop registry with growth stages, durations, critical thresholds
- ET0-based irrigation need calculator
- Growth stage detector based on days-since-sowing
"""

from typing import Optional


# ── Crop Registry ─────────────────────────────────────────────────────────────
# Each crop defines growth stages with: duration_days, soil_moisture_target,
# NPK_demand, critical_temp_range, irrigation_intensity
CROP_REGISTRY = {
    "wheat": {
        "name": "Wheat",
        "scientific_name": "Triticum aestivum",
        "total_duration_days": 120,
        "water_requirement_mm": 450,
        "stages": [
            {"name": "Germination",    "days": 10, "soil_moisture_target": 70, "n_demand": "LOW",    "irrigation_freq_days": 2},
            {"name": "Seedling",       "days": 20, "soil_moisture_target": 65, "n_demand": "LOW",    "irrigation_freq_days": 3},
            {"name": "Tillering",      "days": 25, "soil_moisture_target": 60, "n_demand": "HIGH",   "irrigation_freq_days": 4},
            {"name": "Jointing",       "days": 20, "soil_moisture_target": 65, "n_demand": "HIGH",   "irrigation_freq_days": 3},
            {"name": "Heading",        "days": 15, "soil_moisture_target": 70, "n_demand": "MEDIUM", "irrigation_freq_days": 3},
            {"name": "Grain Filling",  "days": 20, "soil_moisture_target": 60, "n_demand": "LOW",    "irrigation_freq_days": 5},
            {"name": "Maturity",       "days": 10, "soil_moisture_target": 40, "n_demand": "NONE",   "irrigation_freq_days": 0},
        ],
        "critical_temp_min_c": 3,
        "critical_temp_max_c": 35,
        "optimal_soil_ph": (6.0, 7.5),
    },
    "rice": {
        "name": "Rice",
        "scientific_name": "Oryza sativa",
        "total_duration_days": 130,
        "water_requirement_mm": 1200,
        "stages": [
            {"name": "Nursery",        "days": 25, "soil_moisture_target": 85, "n_demand": "MEDIUM", "irrigation_freq_days": 1},
            {"name": "Transplanting",  "days": 10, "soil_moisture_target": 90, "n_demand": "HIGH",   "irrigation_freq_days": 1},
            {"name": "Vegetative",     "days": 35, "soil_moisture_target": 85, "n_demand": "HIGH",   "irrigation_freq_days": 2},
            {"name": "Reproductive",   "days": 30, "soil_moisture_target": 90, "n_demand": "MEDIUM", "irrigation_freq_days": 1},
            {"name": "Ripening",       "days": 30, "soil_moisture_target": 60, "n_demand": "LOW",    "irrigation_freq_days": 4},
        ],
        "critical_temp_min_c": 15,
        "critical_temp_max_c": 40,
        "optimal_soil_ph": (5.5, 7.0),
    },
    "cotton": {
        "name": "Cotton",
        "scientific_name": "Gossypium hirsutum",
        "total_duration_days": 180,
        "water_requirement_mm": 700,
        "stages": [
            {"name": "Germination",    "days": 10, "soil_moisture_target": 65, "n_demand": "LOW",    "irrigation_freq_days": 3},
            {"name": "Seedling",       "days": 20, "soil_moisture_target": 60, "n_demand": "LOW",    "irrigation_freq_days": 4},
            {"name": "Squaring",       "days": 35, "soil_moisture_target": 65, "n_demand": "HIGH",   "irrigation_freq_days": 5},
            {"name": "Flowering",      "days": 30, "soil_moisture_target": 70, "n_demand": "HIGH",   "irrigation_freq_days": 4},
            {"name": "Boll Development",  "days": 45, "soil_moisture_target": 65, "n_demand": "MEDIUM", "irrigation_freq_days": 5},
            {"name": "Boll Opening",   "days": 40, "soil_moisture_target": 40, "n_demand": "NONE",   "irrigation_freq_days": 0},
        ],
        "critical_temp_min_c": 15,
        "critical_temp_max_c": 42,
        "optimal_soil_ph": (6.0, 8.0),
    },
    "maize": {
        "name": "Maize / Corn",
        "scientific_name": "Zea mays",
        "total_duration_days": 100,
        "water_requirement_mm": 500,
        "stages": [
            {"name": "Germination",    "days": 8,  "soil_moisture_target": 70, "n_demand": "LOW",    "irrigation_freq_days": 2},
            {"name": "Vegetative",     "days": 30, "soil_moisture_target": 65, "n_demand": "HIGH",   "irrigation_freq_days": 4},
            {"name": "Tasseling",      "days": 12, "soil_moisture_target": 75, "n_demand": "HIGH",   "irrigation_freq_days": 3},
            {"name": "Silking",        "days": 10, "soil_moisture_target": 80, "n_demand": "MEDIUM", "irrigation_freq_days": 3},
            {"name": "Grain Filling",  "days": 25, "soil_moisture_target": 65, "n_demand": "LOW",    "irrigation_freq_days": 5},
            {"name": "Maturity",       "days": 15, "soil_moisture_target": 40, "n_demand": "NONE",   "irrigation_freq_days": 0},
        ],
        "critical_temp_min_c": 10,
        "critical_temp_max_c": 38,
        "optimal_soil_ph": (5.8, 7.0),
    },
    "sugarcane": {
        "name": "Sugarcane",
        "scientific_name": "Saccharum officinarum",
        "total_duration_days": 360,
        "water_requirement_mm": 1800,
        "stages": [
            {"name": "Germination",    "days": 30, "soil_moisture_target": 75, "n_demand": "LOW",    "irrigation_freq_days": 3},
            {"name": "Tillering",      "days": 60, "soil_moisture_target": 70, "n_demand": "HIGH",   "irrigation_freq_days": 5},
            {"name": "Grand Growth",   "days": 150, "soil_moisture_target": 65, "n_demand": "HIGH",  "irrigation_freq_days": 7},
            {"name": "Maturity",       "days": 120, "soil_moisture_target": 45, "n_demand": "LOW",   "irrigation_freq_days": 14},
        ],
        "critical_temp_min_c": 20,
        "critical_temp_max_c": 45,
        "optimal_soil_ph": (6.0, 7.5),
    },
    "tomato": {
        "name": "Tomato",
        "scientific_name": "Solanum lycopersicum",
        "total_duration_days": 90,
        "water_requirement_mm": 400,
        "stages": [
            {"name": "Seedling",       "days": 15, "soil_moisture_target": 65, "n_demand": "LOW",    "irrigation_freq_days": 2},
            {"name": "Vegetative",     "days": 25, "soil_moisture_target": 70, "n_demand": "HIGH",   "irrigation_freq_days": 2},
            {"name": "Flowering",      "days": 20, "soil_moisture_target": 70, "n_demand": "MEDIUM", "irrigation_freq_days": 2},
            {"name": "Fruiting",       "days": 30, "soil_moisture_target": 75, "n_demand": "MEDIUM", "irrigation_freq_days": 3},
        ],
        "critical_temp_min_c": 10,
        "critical_temp_max_c": 38,
        "optimal_soil_ph": (6.0, 7.0),
    },
}


def list_crops() -> list:
    """Return summary list of all crops in registry."""
    return [
        {
            "id": crop_id,
            "name": info["name"],
            "scientific_name": info["scientific_name"],
            "total_duration_days": info["total_duration_days"],
            "water_requirement_mm": info["water_requirement_mm"],
            "stage_count": len(info["stages"]),
        }
        for crop_id, info in CROP_REGISTRY.items()
    ]


def get_crop(crop_id: str) -> Optional[dict]:
    """Get full crop details including all growth stages."""
    info = CROP_REGISTRY.get(crop_id.lower())
    if not info:
        return None
    return {"id": crop_id, **info}


def get_growth_stage(crop_id: str, days_since_sowing: int) -> Optional[dict]:
    """
    Given crop type and days since sowing, return current growth stage details.
    """
    crop = CROP_REGISTRY.get(crop_id.lower())
    if not crop:
        return None

    elapsed = 0
    for stage in crop["stages"]:
        elapsed += stage["days"]
        if days_since_sowing <= elapsed:
            days_in_stage = days_since_sowing - (elapsed - stage["days"])
            stage_pct = round(min(100, (days_in_stage / stage["days"]) * 100), 1)
            return {
                "stage_name": stage["name"],
                "days_in_stage": days_in_stage,
                "stage_duration_days": stage["days"],
                "stage_progress_pct": stage_pct,
                "soil_moisture_target_pct": stage["soil_moisture_target"],
                "nitrogen_demand": stage["n_demand"],
                "irrigation_freq_days": stage["irrigation_freq_days"],
                "days_since_sowing": days_since_sowing,
                "crop_id": crop_id,
                "critical_temp_min_c": crop["critical_temp_min_c"],
                "critical_temp_max_c": crop["critical_temp_max_c"],
            }

    # Post-maturity
    return {
        "stage_name": "Post-Maturity",
        "days_in_stage": days_since_sowing - crop["total_duration_days"],
        "stage_duration_days": 0,
        "stage_progress_pct": 100,
        "soil_moisture_target_pct": 30,
        "nitrogen_demand": "NONE",
        "irrigation_freq_days": 0,
        "days_since_sowing": days_since_sowing,
        "crop_id": crop_id,
        "critical_temp_min_c": crop["critical_temp_min_c"],
        "critical_temp_max_c": crop["critical_temp_max_c"],
    }


def calculate_irrigation_need(
    et0_mm: Optional[float],
    soil_moisture_pct: Optional[float],
    target_soil_moisture_pct: float,
    crop_coefficient: float = 1.0,
    area_ha: float = 1.0,
) -> dict:
    """
    Calculate irrigation need using ET0 and soil moisture deficit.

    Formula: Water Deficit = (Target_SM - Current_SM) / 100 * Soil_Depth_mm
             ETc = ET0 * Kc
    """
    result: dict = {
        "et0_mm": et0_mm,
        "soil_moisture_deficit_pct": None,
        "etc_mm_per_day": None,
        "irrigation_need_liters_per_ha": None,
        "irrigation_need_mm": None,
        "recommendation": "UNKNOWN",
    }

    if soil_moisture_pct is not None:
        deficit = target_soil_moisture_pct - soil_moisture_pct
        result["soil_moisture_deficit_pct"] = round(deficit, 2)

        # Simplified soil depth = 300mm effective root zone
        soil_depth_mm = 300
        irrigation_need_mm = max(0, (deficit / 100) * soil_depth_mm)
        result["irrigation_need_mm"] = round(irrigation_need_mm, 2)
        result["irrigation_need_liters_per_ha"] = round(irrigation_need_mm * 10_000 / 1000, 1)

        if deficit > 15:
            result["recommendation"] = "IRRIGATE_IMMEDIATELY"
        elif deficit > 8:
            result["recommendation"] = "IRRIGATE_SOON"
        elif deficit > 0:
            result["recommendation"] = "MONITOR"
        else:
            result["recommendation"] = "NO_IRRIGATION_NEEDED"

    if et0_mm is not None:
        result["etc_mm_per_day"] = round(et0_mm * crop_coefficient, 2)

    return result
