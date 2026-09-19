from app.core.logging import logger
from app.db.database import Base, engine, SessionLocal
import app.db.models  # Ensure all models are registered
from app.db.seed import seed_database


def init_db(seed: bool = True) -> None:
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema initialized successfully.")

    if seed:
        db = SessionLocal()
        try:
            seed_database(db, force=False)
        finally:
            db.close()
