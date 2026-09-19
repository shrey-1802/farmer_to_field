from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class CropStage(BaseModel):
    name: str
    days: int
    soil_moisture_target: float
    n_demand: str
    irrigation_freq_days: int


class CropSummary(BaseModel):
    id: str
    name: str
    scientific_name: str
    total_duration_days: int
    water_requirement_mm: float
    stage_count: int


class CropDetail(BaseModel):
    id: str
    name: str
    scientific_name: str
    total_duration_days: int
    water_requirement_mm: float
    stages: List[CropStage]
    critical_temp_min_c: float
    critical_temp_max_c: float
    optimal_soil_ph: List[float]


class GrowthStageDetail(BaseModel):
    crop_id: str
    stage_name: str
    days_in_stage: int
    stage_duration_days: int
    stage_progress_pct: float
    soil_moisture_target_pct: float
    nitrogen_demand: str
    irrigation_freq_days: int
    days_since_sowing: int
    critical_temp_min_c: float
    critical_temp_max_c: float


class IrrigationNeed(BaseModel):
    et0_mm: Optional[float] = None
    soil_moisture_deficit_pct: Optional[float] = None
    etc_mm_per_day: Optional[float] = None
    irrigation_need_mm: Optional[float] = None
    irrigation_need_liters_per_ha: Optional[float] = None
    recommendation: str
