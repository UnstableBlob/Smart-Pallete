"""
Smart Palette – SQLAlchemy ORM models.
"""
from datetime import date, datetime

from sqlalchemy import (
    Column, Date, DateTime, Float, Integer,
    String, Text, func,
)

from app.database.database import Base


class InventoryItem(Base):
    """Persistent ingredient inventory record."""
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    quantity = Column(Float, nullable=False, default=0.0)
    unit = Column(String(50), nullable=False, default="pcs")
    category = Column(String(100), nullable=True)
    expiry_date = Column(Date, nullable=True)
    perishability = Column(String(20), nullable=True)   # "high" | "medium" | "low"
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def days_until_expiry(self) -> int | None:
        if self.expiry_date is None:
            return None
        return (self.expiry_date - date.today()).days


class Recipe(Base):
    """Persisted recipe record (optional caching)."""
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    servings = Column(Integer, nullable=True)
    preparation_time_minutes = Column(Integer, nullable=True)
    diet = Column(String(50), nullable=True)
    recipe_json = Column(Text, nullable=False)   # full JSON stored as text
    created_at = Column(DateTime, default=func.now())


class DetectionLog(Base):
    """Audit log for every inference request."""
    __tablename__ = "detection_logs"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(64), unique=True, index=True)
    inference_time_ms = Column(Float, nullable=True)
    num_detections = Column(Integer, nullable=True)
    model_version = Column(String(100), nullable=True)
    confidence_threshold = Column(Float, nullable=True)
    success = Column(Integer, default=1)   # 1 = success, 0 = failure
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
