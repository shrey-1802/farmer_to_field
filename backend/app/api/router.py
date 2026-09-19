from fastapi import APIRouter

api_router = APIRouter()


@api_router.get("/status", tags=["Status"])
def api_status():
    return {
        "status": "online",
        "system": "KrishiNirnay AI Orchestration Engine",
        "mode": "autonomous",
        "version": "1.0.0"
    }
