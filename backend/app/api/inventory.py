"""
Smart Palette – Inventory API Router.

GET    /api/v1/inventory           – list all items
POST   /api/v1/inventory           – add item
PUT    /api/v1/inventory/{id}      – update item
DELETE /api/v1/inventory/{id}      – delete item
POST   /api/v1/inventory/confirm   – save confirmed scan results
POST   /api/v1/inventory/consume   – deduct after cooking
GET    /api/v1/inventory/priority  – zero-waste sorted list
GET    /api/v1/pantry/inventory    – alias (frontend compatibility)
POST   /api/v1/pantry/verify-and-sync   – alias
POST   /api/v1/pantry/deduct-consumed   – alias
PATCH  /api/v1/pantry/item/{id}         – alias
"""
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.inventory import (
    ConfirmInventoryRequest,
    ConsumeRequest,
    InventoryItemCreate,
    InventoryItemResponse,
    InventoryItemUpdate,
)
from app.services import inventory_service

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Core CRUD ──────────────────────────────────────────────────────────────

@router.get("/inventory", response_model=list[InventoryItemResponse])
def list_inventory(db: Session = Depends(get_db)):
    """Retrieve all current inventory items."""
    return inventory_service.get_all(db)


@router.post("/inventory", response_model=InventoryItemResponse, status_code=201)
def add_inventory_item(payload: InventoryItemCreate, db: Session = Depends(get_db)):
    """Add a new ingredient to the inventory."""
    return inventory_service.create_item(db, payload)


@router.put("/inventory/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    item_id: int, payload: InventoryItemUpdate, db: Session = Depends(get_db)
):
    """Update an existing inventory item by ID."""
    result = inventory_service.update_item(db, item_id, payload)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Item {item_id} not found.")
    return result


@router.delete("/inventory/{item_id}", status_code=204)
def delete_inventory_item(item_id: int, db: Session = Depends(get_db)):
    """Delete an inventory item by ID."""
    if not inventory_service.delete_item(db, item_id):
        raise HTTPException(status_code=404, detail=f"Item {item_id} not found.")


# ── Confirm from scan ──────────────────────────────────────────────────────

@router.post("/inventory/confirm", response_model=list[InventoryItemResponse])
def confirm_inventory(payload: ConfirmInventoryRequest, db: Session = Depends(get_db)):
    """
    Save user-confirmed detection results.
    Upserts items – updates quantity if ingredient already exists.
    """
    return inventory_service.confirm_inventory(db, payload.items)


# ── Consume after cooking ──────────────────────────────────────────────────

@router.post("/inventory/consume")
def consume_ingredients(payload: ConsumeRequest, db: Session = Depends(get_db)):
    """Deduct ingredient quantities after a recipe has been cooked."""
    return inventory_service.consume_ingredients(db, payload.consumed)


# ── Zero-waste priority ────────────────────────────────────────────────────

@router.get("/inventory/priority")
def get_priority(db: Session = Depends(get_db)):
    """Return inventory sorted by perishability and expiry for zero-waste recommendations."""
    return inventory_service.get_priority_ingredients(db)


# ── Frontend compatibility aliases ─────────────────────────────────────────

@router.get("/pantry/inventory")
def get_pantry_inventory(db: Session = Depends(get_db)):
    """Alias: /api/v1/pantry/inventory → list inventory."""
    items = inventory_service.get_all(db)
    expiring_soon = [i for i in items if i.days_until_expiry is not None and i.days_until_expiry <= 3]
    active_stock = [i for i in items if i not in expiring_soon]
    return {"activeStock": active_stock, "expiringSoon": expiring_soon}


@router.post("/pantry/verify-and-sync")
def pantry_verify_and_sync(payload: ConfirmInventoryRequest, db: Session = Depends(get_db)):
    """Alias: /api/v1/pantry/verify-and-sync → confirm inventory."""
    results = inventory_service.confirm_inventory(db, payload.items)
    return {"success": True, "syncedCount": len(results)}


@router.post("/pantry/deduct-consumed")
def pantry_deduct_consumed(payload: ConsumeRequest, db: Session = Depends(get_db)):
    """Alias: /api/v1/pantry/deduct-consumed → consume ingredients."""
    return inventory_service.consume_ingredients(db, payload.consumed)


@router.patch("/pantry/item/{item_id}")
def patch_pantry_item(item_id: int, payload: InventoryItemUpdate, db: Session = Depends(get_db)):
    """Alias: PATCH /api/v1/pantry/item/:id → update item."""
    result = inventory_service.update_item(db, item_id, payload)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Item {item_id} not found.")
    return {"success": True, "item": result}
