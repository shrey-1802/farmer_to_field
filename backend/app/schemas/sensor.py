from typing import Optional, List, Any
from pydantic import BaseModel, Field
from datetime import datetime


class SensorCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    sensor_type: str = Field(..., description="SOIL_MOISTURE | SOIL_TEMPERATURE | AMBIENT_TEMP | HUMIDITY | NPK | SOLAR_RADIATION")
    field_id: Optional[str] = None
    zone_id: Optional[str] = None
    unit: str = "%"
    source: str = "virtual_sensor"
    configuration: Optional[Any] = None


class SensorResponse(BaseModel):
    id: str
    farm_id: str
    field_id: Optional[str] = None
    zone_id: Optional[str] = None
    name: str
    sensor_type: str
    source: str
    status: str
    unit: str
    last_seen: Optional[datetime] = None
    configuration: Optional[Any] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SensorReadingResponse(BaseModel):
    id: str
    sensor_id: str
    farm_id: str
    field_id: Optional[str] = None
    zone_id: Optional[str] = None
    timestamp: datetime
    measurements: Any
    quality: str
    source: str

    model_config = {"from_attributes": True}


class SimulationTriggerRequest(BaseModel):
    farm_id: str
    zone_id: Optional[str] = None
    params: Optional[Any] = None


class SimulationStatusResponse(BaseModel):
    farm_id: str
    active_scenario: str
    set_at: Optional[str] = None
    params: Optional[Any] = None
