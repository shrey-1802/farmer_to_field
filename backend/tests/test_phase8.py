"""
Phase 8 Comprehensive Test Suite
BACKEND.md Phases 31 - 33:
- Phase 31: Expert Escalation System
- Phase 32: Alert Notification Engine (Categories & Severities)
- Phase 33: Internal Decoupled Event System (Pub/Sub EventBus)
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import SessionLocal
from app.db.init_db import init_db
from app.db.models.farm import Farm
from app.services.event_bus import event_bus

client = TestClient(app)

# Ensure database tables exist and demo data is seeded
init_db(seed=True)



# ==============================================================================
# 1. INTERNAL EVENT BUS PUB/SUB (PHASE 33)
# ==============================================================================

def test_event_bus_pub_sub():
    """Verify event subscription, publishing, and telemetry history."""
    received_events = []

    def sample_handler(payload):
        received_events.append(payload)

    event_bus.subscribe("risk.detected", sample_handler)
    event_bus.publish("risk.detected", {"risk_type": "WATER_STRESS", "score": 85.0})

    assert len(received_events) == 1
    assert received_events[0]["risk_type"] == "WATER_STRESS"

    # Check recent event history
    history = event_bus.get_recent_events(limit=10)
    assert any(e["event_type"] == "risk.detected" for e in history)


# ==============================================================================
# 2. ALERT NOTIFICATION ENGINE (PHASE 32)
# ==============================================================================

def test_alert_creation_listing_and_acknowledgment():
    """Phase 32: Alert categories, severities, and acknowledgement lifecycle."""
    db = SessionLocal()
    farm = db.query(Farm).first()
    assert farm is not None
    db.close()

    payload = {
        "farm_id": farm.id,
        "category": "WEATHER",
        "severity": "HIGH",
        "title": "Severe Frost Warning",
        "message": "Night temperature expected to drop below 3°C.",
    }

    # Create alert
    res_create = client.post("/api/alerts", json=payload)
    assert res_create.status_code == 201
    data = res_create.json()
    assert data["category"] == "WEATHER"
    assert data["severity"] == "HIGH"
    assert data["is_acknowledged"] is False
    alert_id = data["id"]

    # Filter by category
    res_list = client.get(f"/api/alerts?farm_id={farm.id}&category=WEATHER&is_acknowledged=false")
    assert res_list.status_code == 200
    assert any(a["id"] == alert_id for a in res_list.json())

    # Acknowledge alert
    res_ack = client.post(f"/api/alerts/{alert_id}/acknowledge")
    assert res_ack.status_code == 200
    assert res_ack.json()["is_acknowledged"] is True
    assert res_ack.json()["acknowledged_at"] is not None


# ==============================================================================
# 3. EXPERT CASE ESCALATION (PHASE 31)
# ==============================================================================

def test_expert_case_escalation_lifecycle():
    """Phase 31: Escalate case to agronomists and resolve with expert notes."""
    db = SessionLocal()
    farm = db.query(Farm).first()
    db.close()

    # Escalate case
    payload = {
        "farm_id": farm.id,
        "escalation_reason": "Uncertain disease diagnosis from drone image",
        "notes": "Low model confidence (54%) on suspected bacterial spot.",
    }
    res_create = client.post("/api/experts/cases", json=payload)
    assert res_create.status_code == 201
    case_data = res_create.json()
    assert case_data["status"] == "OPEN"
    case_id = case_data["id"]

    # List open cases
    res_list = client.get(f"/api/experts/cases?farm_id={farm.id}&status=OPEN")
    assert res_list.status_code == 200
    assert any(c["id"] == case_id for c in res_list.json())

    # Expert resolves case
    resolve_payload = {
        "expert_id": "Agronomist_Dr_Sharma",
        "expert_notes": "Confirmed early Septoria leaf spot. Recommend Copper Oxychloride 50% WP @ 2.5g/L.",
        "resolution": "APPROVED",
    }
    res_res = client.post(f"/api/experts/cases/{case_id}/resolve", json=resolve_payload)
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "RESOLVED"
    assert res_res.json()["expert_id"] == "Agronomist_Dr_Sharma"
    assert "Septoria" in res_res.json()["expert_notes"]
