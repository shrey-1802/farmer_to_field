"""
Integration & Unit Tests for Backend Phases 38-53
- Phase 38: Sensor Scheduling Worker
- Phase 39: In-Process Caching & WeatherCache
- Phase 40: StorageService Abstraction
- Phase 41: Reporting Engine & Endpoints
- Phase 48: Audit Logging Service & API
- Phase 50: LLM Advisory Service with Fallback
- Phase 53: End-to-End Water-Stress Demo Loop
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.init_db import init_db
from app.services.cache_service import cache, weather_cache, rate_limit_cache
from app.services.storage_service import storage_service, StorageError
from app.services.audit_service import audit_log, get_audit_logs, AuditAction
from app.services.llm_service import llm_service
from app.simulation.sensor_worker import _generate_all_virtual_readings
from app.db.database import SessionLocal

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    init_db(seed=True)


# ------------------------------------------------------------------ #
#  Phase 38: Sensor Scheduling Worker                                 #
# ------------------------------------------------------------------ #

def test_sensor_worker_execution():
    """Verify virtual sensor background worker execution generates readings."""
    _generate_all_virtual_readings()
    db = SessionLocal()
    try:
        from app.db.models.sensor import SensorReading
        readings_count = db.query(SensorReading).count()
        assert readings_count > 0
    finally:
        db.close()


# ------------------------------------------------------------------ #
#  Phase 39: Caching Service                                          #
# ------------------------------------------------------------------ #

def test_cache_service():
    """Verify in-process key-value, weather, and rate-limiting cache operations."""
    cache.set("test_key", "test_val", ttl_seconds=10)
    assert cache.get("test_key") == "test_val"

    weather_cache.set(18.52, 73.85, {"temp": 28.5})
    assert weather_cache.get(18.52, 73.85) == {"temp": 28.5}

    count1 = rate_limit_cache.increment("user_123", "/api/login")
    count2 = rate_limit_cache.increment("user_123", "/api/login")
    assert count1 == 1
    assert count2 == 2


# ------------------------------------------------------------------ #
#  Phase 40: Storage Service                                          #
# ------------------------------------------------------------------ #

def test_storage_service():
    """Verify storage service validates files and stores them correctly."""
    stored = storage_service.store(
        data=b"dummy image bytes",
        original_name="crop_leaf.jpg",
        content_type="image/jpeg",
    )
    assert stored.file_id is not None
    assert stored.url.endswith(".jpg")

    # Invalid extension error check
    with pytest.raises(StorageError):
        storage_service.store(b"bad", "malicious.exe")


# ------------------------------------------------------------------ #
#  Phase 41: Reporting API Endpoints                                  #
# ------------------------------------------------------------------ #

def test_reporting_endpoints():
    """Test all 8 reporting endpoints return 200 with valid structures."""
    farm_id = "farm-demo-001"

    endpoints = [
        f"/api/reports/field-performance?farm_id={farm_id}",
        f"/api/reports/yield-estimation?farm_id={farm_id}",
        f"/api/reports/risk-summary?farm_id={farm_id}",
        f"/api/reports/action-effectiveness?farm_id={farm_id}",
        f"/api/reports/water-usage?farm_id={farm_id}",
        f"/api/reports/sensor-history?farm_id={farm_id}",
        f"/api/reports/agent-activity?farm_id={farm_id}",
        "/api/reports/market-analysis",
    ]

    for ep in endpoints:
        res = client.get(ep)
        assert res.status_code == 200, f"Endpoint {ep} failed with {res.status_code}"
        data = res.json()
        assert "report" in data or "crops" in data or "total" in data


# ------------------------------------------------------------------ #
#  Phase 48: Audit Logging Service                                    #
# ------------------------------------------------------------------ #

def test_audit_logging():
    """Verify audit logging records action and sanitizes sensitive fields."""
    db = SessionLocal()
    try:
        log_entry = audit_log(
            db,
            action=AuditAction.FARM_CREATED,
            entity_type="Farm",
            entity_id="farm-test-999",
            user_id="user-demo-001",
            metadata={"name": "Green Acres", "password": "secret_password"},
        )
        assert log_entry.id is not None
        assert log_entry.changes["password"] == "***REDACTED***"

        logs = get_audit_logs(db, entity_type="Farm")
        assert logs["total"] > 0
    finally:
        db.close()


# ------------------------------------------------------------------ #
#  Phase 50: LLM Advisory Service                                     #
# ------------------------------------------------------------------ #

def test_llm_advisory_service():
    """Verify LLM advisory returns structured response and fallback when key absent."""
    res = llm_service.generate_advisory_explanation(
        action_plan={"title": "Test Irrigation", "instruction": "Apply 20mm water"},
        agent_summaries={},
    )
    assert "summary" in res
    assert res["is_fallback"] is True or res["confidence"] > 0.8


# ------------------------------------------------------------------ #
#  Phase 53: Water Stress Demo Autonomous Loop                        #
# ------------------------------------------------------------------ #

def test_water_stress_demo_flow():
    """Verify end-to-end water stress autonomous simulation endpoint."""
    # Obtain auth token
    login_res = client.post(
        "/api/auth/login",
        json={"email": "farmer@krishinirnay.ai", "password": "Password123!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    farm_res = client.get("/api/farms", headers=headers)
    assert farm_res.status_code == 200
    farms = farm_res.json()
    assert len(farms) > 0
    farm_id = farms[0]["id"]

    req_payload = {
        "farm_id": farm_id,
        "soil_moisture": 15.0,
        "auto_execute": True,
    }
    res = client.post(f"/api/simulation/water-stress-demo?farm_id={farm_id}", json=req_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["demo"] == "WATER_STRESS_CLOSED_LOOP"
    assert "orchestration_summary" in data
