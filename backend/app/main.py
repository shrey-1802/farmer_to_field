import time
import uuid
from typing import Callable
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from contextlib import asynccontextmanager

from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import logger, request_id_ctx
from app.db.database import check_db_connection
from app.db.init_db import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and demo seed data is present
    try:
        init_db(seed=True)
    except Exception as exc:
        logger.error(f"Error during database initialization on startup: {exc}")

    # Start virtual sensor telemetry background worker
    from app.simulation.sensor_worker import start_sensor_worker
    start_sensor_worker()
    logger.info("Virtual sensor worker started.")

    yield

    # Shutdown: stop background worker gracefully
    from app.simulation.sensor_worker import stop_sensor_worker
    stop_sensor_worker()
    logger.info("Application shutdown.")



app = FastAPI(
    title=settings.APP_NAME,
    description="Autonomous Farm-to-Field Advisory & Action Orchestration Platform Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# 1. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 2. Request ID & Timing Middleware
@app.middleware("http")
async def request_id_and_timing_middleware(request: Request, call_next: Callable) -> Response:
    req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request_id_ctx.set(req_id)
    start_time = time.time()

    response = await call_next(request)

    process_time = (time.time() - start_time) * 1000
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"

    if request.url.path not in ("/health", "/ready"):
        logger.info(f"{request.method} {request.url.path} - {response.status_code} ({process_time:.2f}ms)")

    return response


# 3. Register Standard Exception Handlers
register_exception_handlers(app)


# 4. Root and Core Health Endpoints
@app.get("/", tags=["System"])
def root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "health_url": "/health",
        "ready_url": "/ready",
        "api_base": "/api",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "simulation_mode": settings.SIMULATION_MODE,
    }


@app.get("/ready", tags=["Health"])
def readiness_check():
    db_ok = check_db_connection()
    if not db_ok:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unready",
                "database": "disconnected",
                "detail": "Database connection is not ready yet."
            },
        )
    return {
        "status": "ready",
        "database": "connected",
        "database_type": "sqlite" if settings.resolved_database_url.startswith("sqlite") else "postgresql",
        "app": settings.APP_NAME,
    }


# 5. Include API Routers (/api and /api/v1)
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix="/api/v1")
