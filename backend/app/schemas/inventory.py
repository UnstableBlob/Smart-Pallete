"""
Smart Palette – Pydantic schemas for inventory API.
"""
from datetime import date

from pydantic import BaseModel, Field


class InventoryItemCreate(BaseModel):
    name: str
    quantity: float = Field(ge=0)
    unit: str = "pcs"
    category: str | None = None
    expiry_date: date | None = None
    perishability: str | None = None    # "high" | "medium" | "low"


class InventoryItemUpdate(BaseModel):
    quantity: float | None = Field(default=None, ge=0)
    unit: str | None = None
    expiry_date: date | None = None
    perishability: str | None = None


class InventoryItemResponse(BaseModel):
    id: int
    name: str
    quantity: float
    unit: str
    category: str | None
    expiry_date: date | None
    perishability: str | None
    days_until_expiry: int | None

    model_config = {"from_attributes": True}


class ConfirmedInventoryItem(BaseModel):
    """Single item from the user-confirmed detection result."""
    name: str
    quantity: float
    unit: str = "pcs"
    category: str | None = None
    confidence: float | None = None
    expiry_date: date | None = None


class ConfirmInventoryRequest(BaseModel):
    """POST /api/v1/inventory/confirm – save user-corrected scan results."""
    items: list[ConfirmedInventoryItem]


class ConsumeRequest(BaseModel):
    """POST /api/v1/inventory/consume – deduct after a recipe is cooked."""
    consumed: list[dict]   # [{"name": str, "quantity": float}]
