from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    res = client.get("/")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["app"] == "KrishiNirnay AI"
    assert "X-Request-ID" in res.headers


def test_health():
    res = client.get("/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["status"] == "ok"
    assert data["app"] == "KrishiNirnay AI"


def test_ready():
    res = client.get("/ready")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"
    assert data["database_type"] in ["sqlite", "postgresql", "mysql"]


def test_api_status():
    res1 = client.get("/api/status")
    assert res1.status_code == 200
    res2 = client.get("/api/v1/status")
    assert res2.status_code == 200


def test_standardized_error():
    res = client.get("/api/nonexistent-route-for-testing")
    assert res.status_code == 404
    data = res.json()
    assert "error" in data, "Response must contain 'error' key"
    assert data["error"]["code"] == "NOT_FOUND"
    assert "request_id" in data["error"]
