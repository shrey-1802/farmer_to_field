from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.farms import router as farms_router
from app.api.routes.fields import router as fields_router
from app.api.routes.zones import router as zones_router
from app.api.routes.sensors import router as sensors_router
from app.api.routes.sensor_lookup import zones_sensor_router, fields_sensor_router
from app.api.routes.simulation import router as simulation_router
from app.api.routes.weather import router as weather_router
from app.api.routes.crops import router as crops_router
from app.api.routes.context import router as context_router
from app.api.routes.agents import router as agents_router

api_router = APIRouter()

# Core status
@api_router.get("/status", tags=["Status"])
def api_status():
    return {
        "status": "online",
        "system": "KrishiNirnay AI Orchestration Engine",
        "mode": "autonomous",
        "version": "1.0.0",
    }

# Register route modules
api_router.include_router(auth_router)
api_router.include_router(farms_router)
api_router.include_router(fields_router)
api_router.include_router(zones_router)
api_router.include_router(sensors_router)
api_router.include_router(zones_sensor_router)
api_router.include_router(fields_sensor_router)
api_router.include_router(simulation_router)
api_router.include_router(weather_router)
api_router.include_router(crops_router)
api_router.include_router(context_router)
api_router.include_router(agents_router)


