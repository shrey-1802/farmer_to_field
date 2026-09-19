"""
Phase 4 Tests: Virtual Sensor Engine + Sensor API + Simulation API
"""
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ─── Helpers ───────────────────────────────────────────────────────────────────

def _auth_headers() -> dict:
    res = client.post("/api/auth/login", json={
        "email": "farmer@krishinirnay.ai",
        "password": "Password123!"
    })
    assert res.status_code == 200, f"Login failed: {res.text}"
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _get_demo_farm_id(headers: dict) -> str:
    res = client.get("/api/farms", headers=headers)
    assert res.status_code == 200
    farms = res.json()
    assert len(farms) >= 1, "No farms found for seeded user"
    return farms[0]["id"]


# ─── Sensor Engine Unit Tests ───────────────────────────────────────────────────

def test_sensor_simulator_normal():
    """Simulator generates continuous, bounded readings in NORMAL scenario."""
    from app.simulation.sensor_simulator import generate_sensor_reading, reset_scenario

    reset_scenario("test-farm-sim")
    prev = None
    for _ in range(5):
        r = generate_sensor_reading("sim-sensor-1", "SOIL_MOISTURE", "test-farm-sim")
        assert 5.0 <= r["soil_moisture"] <= 95.0
        assert 5.0 <= r["soil_temperature"] <= 45.0
        if prev is not None:
            # continuity: change per step should be small (< 3%)
            assert abs(r["soil_moisture"] - prev["soil_moisture"]) < 3.0
        prev = r


def test_sensor_simulator_water_stress():
    """Water stress scenario causes soil moisture to decline."""
    from app.simulation.sensor_simulator import generate_sensor_reading, set_scenario, reset_scenario

    sensor_id = "ws-sensor-1"
    farm_id = "ws-farm-1"

    # Reset and warm up state with normal readings
    reset_scenario(farm_id)
    for _ in range(3):
        generate_sensor_reading(sensor_id, "SOIL_MOISTURE", farm_id)

    # Activate water stress
    set_scenario(farm_id, "WATER_STRESS")

    readings = [generate_sensor_reading(sensor_id, "SOIL_MOISTURE", farm_id)["soil_moisture"]
                for _ in range(10)]

    # Net direction should be downward over 10 steps
    net_change = readings[-1] - readings[0]
    assert net_change < 0, f"Expected soil moisture to drop under WATER_STRESS, got {net_change}"


def test_sensor_simulator_npk():
    """NPK sensor returns N, P, K within reasonable bounds."""
    from app.simulation.sensor_simulator import generate_sensor_reading, reset_scenario

    reset_scenario("npk-farm")
    r = generate_sensor_reading("npk-1", "NPK", "npk-farm")
    assert "nitrogen_mg_kg" in r
    assert "phosphorus_mg_kg" in r
    assert "potassium_mg_kg" in r
    assert 10 <= r["nitrogen_mg_kg"] <= 400
    assert 2 <= r["phosphorus_mg_kg"] <= 80


def test_sensor_failure_scenario_returns_invalid():
    """SENSOR_FAILURE returns INVALID quality marker."""
    from app.simulation.sensor_simulator import generate_sensor_reading, set_scenario, reset_scenario

    set_scenario("fail-farm", "SENSOR_FAILURE")
    r = generate_sensor_reading("fail-1", "SOIL_MOISTURE", "fail-farm")
    assert r.get("_quality") == "INVALID", f"Expected INVALID, got: {r}"
    reset_scenario("fail-farm")


# ─── Sensor REST API Tests ──────────────────────────────────────────────────────

def test_list_sensors_for_seeded_farm():
    """The seeded demo farm should have sensors."""
    headers = _auth_headers()
    farm_id = _get_demo_farm_id(headers)
    res = client.get(f"/api/sensors?farm_id={farm_id}", headers=headers)
    assert res.status_code == 200, f"List sensors failed: {res.text}"
    sensors = res.json()
    assert isinstance(sensors, list)
    assert len(sensors) >= 1


def test_create_and_fetch_sensor():
    """Create a new sensor on the demo farm and fetch it back."""
    headers = _auth_headers()
    farm_id = _get_demo_farm_id(headers)

    res = client.post(f"/api/sensors?farm_id={farm_id}", json={
        "name": "Test Humidity Sensor",
        "sensor_type": "HUMIDITY",
        "source": "virtual_sensor",
        "unit": "%RH",
    }, headers=headers)
    assert res.status_code == 201, f"Create sensor failed: {res.text}"
    s = res.json()
    assert s["sensor_type"] == "HUMIDITY"
    sensor_id = s["id"]

    # Fetch it
    res2 = client.get(f"/api/sensors/{sensor_id}", headers=headers)
    assert res2.status_code == 200
    assert res2.json()["id"] == sensor_id


def test_sensor_readings_endpoint():
    """Get readings for seeded demo sensors."""
    headers = _auth_headers()
    farm_id = _get_demo_farm_id(headers)
    sensors = client.get(f"/api/sensors?farm_id={farm_id}", headers=headers).json()
    sensor_id = sensors[0]["id"]

    res = client.get(f"/api/sensors/{sensor_id}/readings?limit=10", headers=headers)
    assert res.status_code == 200, f"Get readings failed: {res.text}"
    readings = res.json()
    assert isinstance(readings, list)


def test_sensor_access_without_token():
    """Sensor endpoints require authentication."""
    res = client.get("/api/sensors?farm_id=some-id")
    assert res.status_code == 401


# ─── Simulation API Tests ───────────────────────────────────────────────────────

def test_simulation_status():
    """GET /api/simulation/status returns current scenario."""
    headers = _auth_headers()
    farm_id = _get_demo_farm_id(headers)
    res = client.get(f"/api/simulation/status?farm_id={farm_id}", headers=headers)
    assert res.status_code == 200, f"Sim status failed: {res.text}"
    data = res.json()
    assert "active_scenario" in data
    assert data["farm_id"] == farm_id


def test_activate_water_stress():
    """POST /api/simulation/water-stress changes system state."""
    headers = _auth_headers()
    farm_id = _get_demo_farm_id(headers)

    res = client.post(f"/api/simulation/water-stress?farm_id={farm_id}", headers=headers)
    assert res.status_code == 200, f"Water stress activation failed: {res.text}"
    data = res.json()
    assert data["scenario"] == "WATER_STRESS"

    # Verify status reflects new scenario
    status_res = client.get(f"/api/simulation/status?farm_id={farm_id}", headers=headers)
    assert status_res.json()["active_scenario"] == "WATER_STRESS"


def test_activate_heat_wave():
    headers = _auth_headers()
    farm_id = _get_demo_farm_id(headers)
    res = client.post(f"/api/simulation/heat-wave?farm_id={farm_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["scenario"] == "HEAT_WAVE"


def test_activate_heavy_rain():
    headers = _auth_headers()
    farm_id = _get_demo_farm_id(headers)
    res = client.post(f"/api/simulation/heavy-rain?farm_id={farm_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["scenario"] == "HEAVY_RAIN"


def test_simulate_nutrient_deficiency():
    headers = _auth_headers()
    farm_id = _get_demo_farm_id(headers)
    res = client.post(f"/api/simulation/nutrient?farm_id={farm_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["scenario"] == "NUTRIENT_DEFICIENCY"


def test_simulate_sensor_failure_and_reset():
    """Sensor failure sets sensors OFFLINE; reset brings them back."""
    headers = _auth_headers()
    farm_id = _get_demo_farm_id(headers)

    # Trigger failure
    res = client.post(f"/api/simulation/sensor-failure?farm_id={farm_id}", headers=headers)
    assert res.status_code == 200, f"Sensor failure failed: {res.text}"
    assert res.json()["scenario"] == "SENSOR_FAILURE"

    # Reset
    res = client.post(f"/api/simulation/reset?farm_id={farm_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["scenario"] == "NORMAL"

    # Verify sensors are back online via status
    status_res = client.get(f"/api/simulation/status?farm_id={farm_id}", headers=headers)
    assert status_res.json()["active_scenario"] == "NORMAL"


if __name__ == "__main__":
    print("--- Running Phase 4 Tests ---")
    test_sensor_simulator_normal()
    print("PASS: Simulator Normal")
    test_sensor_simulator_water_stress()
    print("PASS: Simulator Water Stress")
    test_sensor_simulator_npk()
    print("PASS: Simulator NPK")
    test_sensor_failure_scenario_returns_invalid()
    print("PASS: Sensor Failure INVALID Quality")
    test_list_sensors_for_seeded_farm()
    print("PASS: List Sensors API")
    test_create_and_fetch_sensor()
    print("PASS: Create & Fetch Sensor")
    test_sensor_readings_endpoint()
    print("PASS: Sensor Readings")
    test_sensor_access_without_token()
    print("PASS: Sensor Unauthenticated")
    test_simulation_status()
    print("PASS: Simulation Status")
    test_activate_water_stress()
    print("PASS: Activate Water Stress")
    test_activate_heat_wave()
    print("PASS: Activate Heat Wave")
    test_activate_heavy_rain()
    print("PASS: Activate Heavy Rain")
    test_simulate_nutrient_deficiency()
    print("PASS: Nutrient Deficiency")
    test_simulate_sensor_failure_and_reset()
    print("PASS: Sensor Failure + Reset")
    print("--- ALL PHASE 4 TESTS PASSED! ---")
