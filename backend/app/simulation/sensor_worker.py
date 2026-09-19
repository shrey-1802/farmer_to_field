"""
Sensor Worker - Background Telemetry Generator
BACKEND.md Phase 38 (Sensor Scheduling)

Runs as a background thread and generates virtual sensor readings
on a configurable interval. Stores readings to the database.
"""

import threading
import time
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.core.logging import logger
from app.db.database import SessionLocal
from app.db.models.sensor import Sensor, SensorReading, SensorSource, SensorStatus, ReadingQuality
from app.simulation.sensor_simulator import generate_sensor_reading, ScenarioType

# Global scheduler state
_scheduler_thread: Optional[threading.Thread] = None
_stop_event = threading.Event()

TELEMETRY_INTERVAL_SECONDS = 30  # Generate a reading every 30 seconds


def _generate_all_virtual_readings() -> None:
    """For all ONLINE virtual sensors in DB, generate and persist a new reading."""
    db: Session = SessionLocal()
    try:
        sensors = db.query(Sensor).filter(
            Sensor.source == SensorSource.VIRTUAL_SENSOR,
            Sensor.status.in_([SensorStatus.ONLINE, SensorStatus.STALE]),
        ).all()

        for sensor in sensors:
            try:
                measurements = generate_sensor_reading(
                    sensor_id=sensor.id,
                    sensor_type=sensor.sensor_type,
                    farm_id=sensor.farm_id,
                    configuration=sensor.configuration,
                )

                # Determine quality and status from result
                quality = ReadingQuality.GOOD
                if measurements.get("_quality") == "INVALID":
                    quality = ReadingQuality.INVALID
                    sensor.status = SensorStatus.OFFLINE
                    db.commit()
                    continue

                # Remove internal keys
                measurements = {k: v for k, v in measurements.items() if not k.startswith("_")}

                reading = SensorReading(
                    sensor_id=sensor.id,
                    farm_id=sensor.farm_id,
                    field_id=sensor.field_id,
                    zone_id=sensor.zone_id,
                    timestamp=datetime.now(timezone.utc),
                    measurements=measurements,
                    quality=quality,
                    source=SensorSource.VIRTUAL_SENSOR,
                )
                db.add(reading)

                # Update sensor last_seen
                sensor.last_seen = datetime.now(timezone.utc)
                sensor.status = SensorStatus.ONLINE
                db.commit()

            except Exception as exc:
                logger.error(f"Error generating reading for sensor {sensor.id}: {exc}")
                db.rollback()

    except Exception as exc:
        logger.error(f"Sensor worker DB error: {exc}")
    finally:
        db.close()


def _worker_loop() -> None:
    logger.info(f"Virtual sensor worker started (interval: {TELEMETRY_INTERVAL_SECONDS}s)")
    while not _stop_event.is_set():
        try:
            _generate_all_virtual_readings()
        except Exception as exc:
            logger.error(f"Sensor worker loop error: {exc}")
        _stop_event.wait(TELEMETRY_INTERVAL_SECONDS)
    logger.info("Virtual sensor worker stopped.")


def start_sensor_worker() -> None:
    global _scheduler_thread, _stop_event
    if _scheduler_thread and _scheduler_thread.is_alive():
        logger.info("Sensor worker already running.")
        return
    _stop_event.clear()
    _scheduler_thread = threading.Thread(target=_worker_loop, daemon=True, name="sensor-worker")
    _scheduler_thread.start()


def stop_sensor_worker() -> None:
    global _stop_event
    _stop_event.set()
    logger.info("Sensor worker stop requested.")
