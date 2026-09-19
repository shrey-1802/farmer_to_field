from app.db.database import SessionLocal
from app.db.init_db import init_db
from app.db.models import (
    User, Farm, Field, Zone, Crop, SoilProfile,
    Sensor, SensorReading, WeatherRecord, MarketPrice, Alert
)
from app.db.repositories.base import BaseRepository


def test_init_and_seed():
    # Initialize and seed
    init_db(seed=True)
    db = SessionLocal()
    try:
        # Check User
        farmer = db.query(User).filter(User.email == "farmer@krishinirnay.ai").first()
        assert farmer is not None, "Farmer user must exist"
        assert farmer.full_name == "Ramesh Patel"
        assert farmer.role == "FARMER"

        admin = db.query(User).filter(User.email == "admin@krishinirnay.ai").first()
        assert admin is not None, "Admin user must exist"
        assert admin.role == "ADMIN"

        # Check Farm
        farm = db.query(Farm).filter(Farm.id == "farm-001").first()
        assert farm is not None, "Demo farm must exist"
        assert len(farm.fields) == 2, "Farm should have 2 fields"
        assert farm.owner.id == farmer.id, "Farm owner relationship must work"

        # Check Field and Zones
        wheat_field = db.query(Field).filter(Field.name == "North Wheat Field").first()
        assert wheat_field is not None
        assert wheat_field.crop.name == "Wheat"
        assert wheat_field.soil_profile is not None
        assert wheat_field.soil_profile.ph == 7.2
        assert len(wheat_field.zones) == 2

        # Check Virtual Sensors
        sensors = db.query(Sensor).filter(Sensor.farm_id == farm.id).all()
        assert len(sensors) >= 5
        moisture_sensor = db.query(Sensor).filter(Sensor.sensor_type == "SOIL_MOISTURE").first()
        assert moisture_sensor is not None
        assert moisture_sensor.source == "virtual_sensor"
        assert len(moisture_sensor.readings) > 0

        # Check Weather & Market
        weather = db.query(WeatherRecord).filter(WeatherRecord.farm_id == farm.id).first()
        assert weather is not None
        assert weather.temperature > 0

        market = db.query(MarketPrice).all()
        assert len(market) >= 2

        # Check Alert
        alert = db.query(Alert).filter(Alert.farm_id == farm.id).first()
        assert alert is not None
        assert alert.severity == "INFO"

    finally:
        db.close()


def test_base_repository():
    db = SessionLocal()
    try:
        repo = BaseRepository(Crop, db)
        # Create test crop
        test_crop = Crop(
            id="test-crop-sugarcane",
            name="Sugarcane Test",
            category="Cash Crop",
            optimal_moisture_min=60.0,
            optimal_moisture_max=80.0
        )
        created = repo.create(test_crop)
        assert created.id == "test-crop-sugarcane"

        # Read
        fetched = repo.get("test-crop-sugarcane")
        assert fetched is not None
        assert fetched.name == "Sugarcane Test"

        # Update
        updated = repo.update(fetched, {"category": "Sugar/Biofuel"})
        assert updated.category == "Sugar/Biofuel"

        # Delete
        repo.remove("test-crop-sugarcane")
        deleted = repo.get("test-crop-sugarcane")
        assert deleted is None
    finally:
        db.close()
