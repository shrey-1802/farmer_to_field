from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class WeatherLocation(BaseModel):
    latitude: float
    longitude: float
    timezone: Optional[str] = "UTC"


class CurrentWeather(BaseModel):
    time: Optional[str] = None
    temperature_c: Optional[float] = None
    feels_like_c: Optional[float] = None
    relative_humidity_pct: Optional[float] = None
    precipitation_mm: Optional[float] = 0.0
    rain_mm: Optional[float] = 0.0
    cloud_cover_pct: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    wind_direction_deg: Optional[float] = None
    weather_code: Optional[int] = None
    et0_mm: Optional[float] = None


class HourlyWeather(BaseModel):
    times: List[str] = []
    temperature_c: List[float] = []
    humidity_pct: List[float] = []
    precipitation_prob_pct: List[float] = []
    precipitation_mm: List[float] = []
    wind_speed_kmh: List[float] = []
    et0_mm: List[float] = []


class DailyForecast(BaseModel):
    dates: List[str] = []
    temp_max_c: List[float] = []
    temp_min_c: List[float] = []
    precipitation_sum_mm: List[float] = []
    precipitation_prob_max_pct: List[float] = []
    et0_mm: List[float] = []
    wind_max_kmh: List[float] = []
    weather_codes: List[int] = []


class WeatherResponse(BaseModel):
    source: Optional[str] = None
    stale: bool = False
    weather_available: bool = True
    location: WeatherLocation
    current: Optional[CurrentWeather] = None
    hourly: Optional[HourlyWeather] = None
    daily: Optional[DailyForecast] = None
    fetched_at: Optional[str] = None
