from typing import Optional, List, Any
from pydantic import BaseModel, Field
from datetime import datetime, date


# ========================
# Farm Schemas
# ========================

class FarmCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    area: float = Field(..., gt=0)
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None
    boundary: Optional[Any] = None


class FarmResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    area: float
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None
    boundary: Optional[Any] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FarmSummary(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    area: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ========================
# Field Schemas
# ========================

class FieldCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    area: float = Field(..., gt=0)
    crop_id: Optional[str] = None
    sowing_date: Optional[date] = None
    boundary: Optional[Any] = None


class FieldResponse(BaseModel):
    id: str
    farm_id: str
    name: str
    area: float
    crop_id: Optional[str] = None
    crop_name: Optional[str] = None
    sowing_date: Optional[date] = None
    boundary: Optional[Any] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FieldSummary(BaseModel):
    id: str
    farm_id: str
    name: str
    area: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ========================
# Zone Schemas
# ========================

class ZoneCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    area: float = Field(..., gt=0)
    crop_stage: Optional[str] = "Vegetative"
    boundary: Optional[Any] = None


class ZoneResponse(BaseModel):
    id: str
    field_id: str
    name: str
    area: float
    crop_stage: str
    boundary: Optional[Any] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
