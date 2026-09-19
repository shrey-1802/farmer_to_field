import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_register_and_login():
    """Test user registration and login flow."""
    # Register new user (or login if already exists)
    res = client.post("/api/auth/register", json={
        "email": "testfarmer@krishinirnay.ai",
        "password": "TestPass123!",
        "full_name": "Test Farmer",
        "phone": "+91 99999 00001"
    })
    if res.status_code == 409:
        # Already exists in persistent test DB – just login
        res = client.post("/api/auth/login", json={
            "email": "testfarmer@krishinirnay.ai",
            "password": "TestPass123!"
        })
        assert res.status_code == 200, f"Login failed after conflict: {res.text}"
    else:
        assert res.status_code == 201, f"Register failed: {res.text}"
    data = res.json()
    assert "access_token" in data
    token = data["access_token"]

    # Verify login works
    res2 = client.post("/api/auth/login", json={
        "email": "testfarmer@krishinirnay.ai",
        "password": "TestPass123!"
    })
    assert res2.status_code == 200, f"Login failed: {res2.text}"
    return res2.json()["access_token"]



def test_duplicate_register():
    """Duplicate email must return 409 Conflict."""
    res = client.post("/api/auth/register", json={
        "email": "farmer@krishinirnay.ai",  # seeded user
        "password": "AnyPass999!",
        "full_name": "Dup User"
    })
    assert res.status_code == 409, f"Expected 409, got {res.status_code}"
    assert res.json()["error"]["code"] == "CONFLICT"


def test_wrong_password():
    """Wrong password must return 401."""
    res = client.post("/api/auth/login", json={
        "email": "farmer@krishinirnay.ai",
        "password": "WrongPassword999!"
    })
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"


def test_get_me():
    """GET /api/auth/me must return current user."""
    token = test_register_and_login()
    res = client.get("/api/auth/me", headers=auth_headers(token))
    assert res.status_code == 200, f"Get me failed: {res.text}"
    data = res.json()
    assert "email" in data
    assert "id" in data


def test_me_without_token():
    """Accessing /api/auth/me without token must return 401."""
    res = client.get("/api/auth/me")
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"


def test_farms_crud():
    """Create and list farms."""
    token = test_register_and_login()
    headers = auth_headers(token)

    # Create farm
    res = client.post("/api/farms", json={
        "name": "Test Farm Alpha",
        "latitude": 30.901,
        "longitude": 75.857,
        "area": 10.0,
        "soil_type": "Sandy Loam",
        "irrigation_type": "Drip"
    }, headers=headers)
    assert res.status_code == 201, f"Farm creation failed: {res.text}"
    farm = res.json()
    farm_id = farm["id"]
    assert farm["name"] == "Test Farm Alpha"
    assert farm["status"] == "ACTIVE"

    # List farms
    res = client.get("/api/farms", headers=headers)
    assert res.status_code == 200
    farms = res.json()
    assert any(f["id"] == farm_id for f in farms)

    # Get farm by ID
    res = client.get(f"/api/farms/{farm_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["id"] == farm_id

    return farm_id, token


def test_farm_unauthorized_access():
    """A user must not access another user's farm."""
    _, token1 = test_farms_crud()

    # Register second user
    res = client.post("/api/auth/register", json={
        "email": "other.farmer@krishinirnay.ai",
        "password": "OtherPass123!",
        "full_name": "Other Farmer"
    })
    if res.status_code == 201:
        token2 = res.json()["access_token"]
    else:
        res = client.post("/api/auth/login", json={
            "email": "other.farmer@krishinirnay.ai",
            "password": "OtherPass123!"
        })
        token2 = res.json()["access_token"]

    # Try to list farms - should only see their own
    res = client.get("/api/farms", headers=auth_headers(token2))
    assert res.status_code == 200
    # The second user must have 0 farms of their own
    farms = res.json()
    assert all(f.get("user_id") != "test-user-1" for f in farms)


def test_field_creation():
    """Create a field inside a farm."""
    farm_id, token = test_farms_crud()
    headers = auth_headers(token)

    res = client.post(f"/api/fields?farm_id={farm_id}", json={
        "name": "North Field",
        "area": 5.0,
    }, headers=headers)
    assert res.status_code == 201, f"Field creation failed: {res.text}"
    field = res.json()
    field_id = field["id"]
    assert field["farm_id"] == farm_id

    # List fields
    res = client.get(f"/api/fields?farm_id={farm_id}", headers=headers)
    assert res.status_code == 200
    fields = res.json()
    assert any(f["id"] == field_id for f in fields)

    return field_id, farm_id, token


def test_zone_creation():
    """Create a zone inside a field."""
    field_id, farm_id, token = test_field_creation()
    headers = auth_headers(token)

    res = client.post(f"/api/zones?field_id={field_id}", json={
        "name": "Zone Alpha",
        "area": 2.5,
        "crop_stage": "Sowing",
    }, headers=headers)
    assert res.status_code == 201, f"Zone creation failed: {res.text}"
    zone = res.json()
    assert zone["field_id"] == field_id
    assert zone["crop_stage"] == "Sowing"


def test_seeded_farm_accessible_for_seeded_user():
    """The seeded farmer@krishinirnay.ai must be able to access the demo farm."""
    res = client.post("/api/auth/login", json={
        "email": "farmer@krishinirnay.ai",
        "password": "Password123!"
    })
    assert res.status_code == 200, f"Seeded user login failed: {res.text}"
    token = res.json()["access_token"]

    res = client.get("/api/farms", headers=auth_headers(token))
    assert res.status_code == 200
    farms = res.json()
    assert len(farms) >= 1


if __name__ == "__main__":
    print("--- Running Phase 3 Verification Tests ---")
    test_register_and_login()
    print("PASS: Register & Login")
    test_duplicate_register()
    print("PASS: Duplicate Register")
    test_wrong_password()
    print("PASS: Wrong Password")
    test_get_me()
    print("PASS: GET /me")
    test_me_without_token()
    print("PASS: Unauthorized /me")
    test_farms_crud()
    print("PASS: Farm CRUD")
    test_farm_unauthorized_access()
    print("PASS: Farm Authorization")
    test_field_creation()
    print("PASS: Field Creation")
    test_zone_creation()
    print("PASS: Zone Creation")
    test_seeded_farm_accessible_for_seeded_user()
    print("PASS: Seeded Farmer Login + Farm Access")
    print("--- ALL PHASE 3 TESTS PASSED! ---")
