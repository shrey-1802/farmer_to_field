from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.farms import router as farms_router
from app.api.routes.fields import router as fields_router
from app.api.routes.zones import router as zones_router

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
