"""
Smart Palette – Database connection and session management.
Uses SQLAlchemy with SQLite (prototype) / PostgreSQL (production).
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config.settings import DATABASE_URL

# SQLite needs check_same_thread=False for async compatibility
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


def get_db():
    """FastAPI dependency – yields a DB session and closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables() -> None:
    """Create all tables declared via Base if they don't already exist."""
    from app.database import models  # noqa: F401 – import triggers table registration
    Base.metadata.create_all(bind=engine)
