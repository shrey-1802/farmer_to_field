from datetime import datetime, timezone, timedelta, date
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.core.security import get_password_hash
from app.db.database import SessionLocal, Base, engine
from app.db.models import (
    User, UserRole,
    Farm, Field, Zone,
    Crop, CropCycle, SoilProfile,
    Sensor, SensorReading, SensorSource, SensorStatus, ReadingQuality,
    WeatherRecord, MarketPrice, Alert
)


def seed_database(db: Session, force: bool = False) -> None:
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    existing_user = db.query(User).filter(User.email == "farmer@krishinirnay.ai").first()
    if existing_user and not force:
        logger.info("Database already seeded with demo data. Skipping.")
        return

    logger.info("Starting database seeding for KrishiNirnay AI...")

    # 1. Users
    farmer = User(
        id="usr-farmer-001",
        email="farmer@krishinirnay.ai",
        hashed_password=get_password_hash("Password123!"),
        full_name="Ramesh Patel",
        role=UserRole.FARMER.value,
        is_active=True,
        phone="+91 98765 43210"
    )
    admin = User(
        id="usr-admin-001",
        email="admin@krishinirnay.ai",
        hashed_password=get_password_hash("AdminPassword123!"),
        full_name="KrishiNirnay Admin",
        role=UserRole.ADMIN.value,
        is_active=True,
        phone="+91 98765 00000"
    )
    db.add_all([farmer, admin])
    db.flush()

    # 2. Crops
    wheat = Crop(
        id="crop-wheat-001",
        name="Wheat",
        scientific_name="Triticum aestivum",
        category="Cereal",
        optimal_moisture_min=45.0,
        optimal_moisture_max=65.0,
        optimal_temp_min=15.0,
        optimal_temp_max=28.0,
        optimal_ph_min=6.0,
        optimal_ph_max=7.5,
        description="Winter wheat crop with high sensitivity to water stress during tillering and flowering."
    )
    cotton = Crop(
        id="crop-cotton-001",
        name="Cotton",
        scientific_name="Gossypium hirsutum",
        category="Fiber",
        optimal_moisture_min=40.0,
        optimal_moisture_max=60.0,
        optimal_temp_min=21.0,
        optimal_temp_max=35.0,
        optimal_ph_min=5.8,
        optimal_ph_max=8.0,
        description="Kharif fiber cash crop, requires controlled moisture."
    )
    db.add_all([wheat, cotton])
    db.flush()

    # 3. Farm
    farm = Farm(
        id="farm-001",
        user_id=farmer.id,
        name="KrishiNirnay Demo Farm - Punjab Sector",
        description="Flagship precision agriculture deployment with autonomous virtual IoT sensor grid.",
        latitude=30.9010,
        longitude=75.8573,
        area=25.0,
        soil_type="Alluvial Clay Loam",
        irrigation_type="Automated Drip & Sprinkler Network",
        boundary={
            "type": "Polygon",
            "coordinates": [[[75.855, 30.899], [75.860, 30.899], [75.860, 30.903], [75.855, 30.903], [75.855, 30.899]]]
        },
        status="ACTIVE"
    )
    db.add(farm)
    db.flush()

    # 4. Fields
    field_wheat = Field(
        id="field-001",
        farm_id=farm.id,
        name="North Wheat Field",
        area=12.5,
        crop_id=wheat.id,
        boundary={
            "type": "Polygon",
            "coordinates": [[[75.855, 30.901], [75.860, 30.901], [75.860, 30.903], [75.855, 30.903], [75.855, 30.901]]]
        },
        status="ACTIVE"
    )
    field_cotton = Field(
        id="field-002",
        farm_id=farm.id,
        name="South Cotton Field",
        area=12.5,
        crop_id=cotton.id,
        boundary={
            "type": "Polygon",
            "coordinates": [[[75.855, 30.899], [75.860, 30.899], [75.860, 30.901], [75.855, 30.901], [75.855, 30.899]]]
        },
        status="ACTIVE"
    )
    db.add_all([field_wheat, field_cotton])
    db.flush()

    # 5. Crop Cycle & Soil Profile
    cycle_wheat = CropCycle(
        id="cycle-001",
        crop_id=wheat.id,
        field_id=field_wheat.id,
        variety="HD-3086 (Pusa Gautami)",
        planting_date=date.today() - timedelta(days=45),
        expected_harvest_date=date.today() + timedelta(days=75),
        growth_stage="Tillering & Jointing",
        area=12.5,
        status="ACTIVE"
    )
    soil_wheat = SoilProfile(
        id="soil-001",
        field_id=field_wheat.id,
        soil_type="Clay Loam",
        ph=7.2,
        ec=1.1,
        baseline_n=280.0,
        baseline_p=24.0,
        baseline_k=195.0,
        water_holding_characteristics={
            "field_capacity_pct": 34.0,
            "wilting_point_pct": 14.0,
            "saturation_pct": 48.0
        }
    )
    db.add_all([cycle_wheat, soil_wheat])
    db.flush()

    # 6. Zones
    zone_a = Zone(
        id="zone-001",
        field_id=field_wheat.id,
        name="Zone A - Upper Elevation",
        crop_stage="Tillering",
        area=6.0,
        boundary={
            "type": "Polygon",
            "coordinates": [[[75.855, 30.902], [75.860, 30.902], [75.860, 30.903], [75.855, 30.903], [75.855, 30.902]]]
        },
        status="ACTIVE"
    )
    zone_b = Zone(
        id="zone-002",
        field_id=field_wheat.id,
        name="Zone B - Low Basin",
        crop_stage="Tillering",
        area=6.5,
        boundary={
            "type": "Polygon",
            "coordinates": [[[75.855, 30.901], [75.860, 30.901], [75.860, 30.902], [75.855, 30.902], [75.855, 30.901]]]
        },
        status="ACTIVE"
    )
    db.add_all([zone_a, zone_b])
    db.flush()

    # 7. Virtual IoT Sensors
    sensor_moisture = Sensor(
        id="sensor-v-soil-01",
        farm_id=farm.id,
        field_id=field_wheat.id,
        zone_id=zone_a.id,
        name="Zone A Soil Moisture Sensor (Virtual)",
        sensor_type="SOIL_MOISTURE",
        source=SensorSource.VIRTUAL_SENSOR,
        status=SensorStatus.ONLINE,
        unit="%",
        configuration={"baseline": 48.0, "decay_rate_per_hour": 0.35, "noise_amplitude": 0.4}
    )
    sensor_temp = Sensor(
        id="sensor-v-soil-02",
        farm_id=farm.id,
        field_id=field_wheat.id,
        zone_id=zone_a.id,
        name="Zone A Soil Temperature Sensor (Virtual)",
        sensor_type="SOIL_TEMPERATURE",
        source=SensorSource.VIRTUAL_SENSOR,
        status=SensorStatus.ONLINE,
        unit="°C",
        configuration={"baseline": 22.5, "noise_amplitude": 0.3}
    )
    sensor_ambient = Sensor(
        id="sensor-v-ambient-01",
        farm_id=farm.id,
        field_id=field_wheat.id,
        zone_id=zone_a.id,
        name="Zone A Ambient Weather Station (Virtual)",
        sensor_type="AMBIENT_TEMP",
        source=SensorSource.VIRTUAL_SENSOR,
        status=SensorStatus.ONLINE,
        unit="°C",
        configuration={"baseline": 26.0}
    )
    sensor_humidity = Sensor(
        id="sensor-v-hum-01",
        farm_id=farm.id,
        field_id=field_wheat.id,
        zone_id=zone_a.id,
        name="Zone A Humidity Sensor (Virtual)",
        sensor_type="HUMIDITY",
        source=SensorSource.VIRTUAL_SENSOR,
        status=SensorStatus.ONLINE,
        unit="%",
        configuration={"baseline": 58.0}
    )
    sensor_npk = Sensor(
        id="sensor-v-npk-01",
        farm_id=farm.id,
        field_id=field_wheat.id,
        zone_id=zone_a.id,
        name="Zone A Optical NPK Sensor (Virtual)",
        sensor_type="NPK",
        source=SensorSource.VIRTUAL_SENSOR,
        status=SensorStatus.ONLINE,
        unit="mg/kg",
        configuration={"baseline_n": 275.0, "baseline_p": 23.0, "baseline_k": 190.0}
    )
    db.add_all([sensor_moisture, sensor_temp, sensor_ambient, sensor_humidity, sensor_npk])
    db.flush()

    # 8. Seed Recent Telemetry Readings
    now = datetime.now(timezone.utc)
    for i in range(12, -1, -1):
        reading_time = now - timedelta(hours=i)
        reading = SensorReading(
            sensor_id=sensor_moisture.id,
            farm_id=farm.id,
            field_id=field_wheat.id,
            zone_id=zone_a.id,
            timestamp=reading_time,
            measurements={"soil_moisture": round(46.0 - (i * 0.25), 2), "soil_temperature": round(23.0 + (i * 0.1), 2)},
            quality=ReadingQuality.GOOD,
            source=SensorSource.VIRTUAL_SENSOR
        )
        db.add(reading)

    # 9. Baseline Weather Record
    weather = WeatherRecord(
        farm_id=farm.id,
        latitude=farm.latitude,
        longitude=farm.longitude,
        timestamp=now,
        temperature=27.4,
        relative_humidity=54.0,
        precipitation=0.0,
        wind_speed=9.2,
        weather_code=1,
        source="open-meteo",
        is_stale=False
    )
    db.add(weather)

    # 10. Mandi Market Prices
    mandi_wheat = MarketPrice(
        crop_name="Wheat",
        mandi="Khanna Grain Market (Punjab)",
        price_per_quintal=2450.0,
        trend="UP",
        price_date=date.today()
    )
    mandi_cotton = MarketPrice(
        crop_name="Cotton",
        mandi="Abohar Cotton Market (Punjab)",
        price_per_quintal=7150.0,
        trend="STABLE",
        price_date=date.today()
    )
    db.add_all([mandi_wheat, mandi_cotton])

    # 11. Initial Welcome Alert
    alert = Alert(
        farm_id=farm.id,
        field_id=field_wheat.id,
        severity="INFO",
        title="Virtual IoT Telemetry Active",
        message="Zone A Virtual Soil Moisture and Environmental Sensors are continuously transmitting telemetry.",
        is_acknowledged=False
    )
    db.add(alert)

    db.commit()
    logger.info("Database successfully seeded with KrishiNirnay AI demo dataset!")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db, force=True)
    finally:
        db.close()
