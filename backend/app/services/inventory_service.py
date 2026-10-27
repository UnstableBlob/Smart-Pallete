"""
Smart Palette – Inventory Service.

CRUD operations for the InventoryItem database table, plus
confirm-from-detection and consume-after-cooking helpers.
"""
import logging
from datetime import date

from sqlalchemy.orm import Session

from app.config.settings import PERISHABILITY_MAP
from app.database.models import InventoryItem
from app.schemas.inventory import (
    ConfirmedInventoryItem,
    InventoryItemCreate,
    InventoryItemResponse,
    InventoryItemUpdate,
)

from app.services.unit_converter import convert_deduction

logger = logging.getLogger(__name__)



# ── Helpers ────────────────────────────────────────────────────────────────

def _to_response(item: InventoryItem) -> InventoryItemResponse:
    return InventoryItemResponse(
        id=item.id,
        name=item.name,
        quantity=item.quantity,
        unit=item.unit,
        category=item.category,
        expiry_date=item.expiry_date,
        perishability=item.perishability,
        days_until_expiry=item.days_until_expiry(),
    )


# ── CRUD ───────────────────────────────────────────────────────────────────

def get_all(db: Session) -> list[InventoryItemResponse]:
    items = db.query(InventoryItem).order_by(InventoryItem.name).all()
    return [_to_response(i) for i in items]


def get_by_id(db: Session, item_id: int) -> InventoryItem | None:
    return db.query(InventoryItem).filter(InventoryItem.id == item_id).first()


def create_item(db: Session, payload: InventoryItemCreate) -> InventoryItemResponse:
    perishability = payload.perishability or PERISHABILITY_MAP.get(
        payload.name.lower(), "low"
    )
    item = InventoryItem(
        name=payload.name,
        quantity=payload.quantity,
        unit=payload.unit,
        category=payload.category,
        expiry_date=payload.expiry_date,
        perishability=perishability,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _to_response(item)


def update_item(
    db: Session, item_id: int, payload: InventoryItemUpdate
) -> InventoryItemResponse | None:
    item = get_by_id(db, item_id)
    if item is None:
        return None
    if payload.name is not None:
        item.name = payload.name
    if payload.quantity is not None:
        item.quantity = payload.quantity
    if payload.unit is not None:
        item.unit = payload.unit
    if payload.category is not None:
        item.category = payload.category
    if payload.expiry_date is not None:
        item.expiry_date = payload.expiry_date
    if payload.perishability is not None:
        item.perishability = payload.perishability
    db.commit()
    db.refresh(item)
    return _to_response(item)


def delete_item(db: Session, item_id: int) -> bool:
    item = get_by_id(db, item_id)
    if item is None:
        return False
    db.delete(item)
    db.commit()
    return True


# ── Confirm from detection ─────────────────────────────────────────────────

def confirm_inventory(
    db: Session, items: list[ConfirmedInventoryItem]
) -> list[InventoryItemResponse]:
    """
    Upsert user-confirmed scan results into the database.
    If an item with the same name already exists, update its quantity.
    """
    results: list[InventoryItemResponse] = []

    for ci in items:
        existing = (
            db.query(InventoryItem)
            .filter(InventoryItem.name.ilike(ci.name))
            .first()
        )
        perishability = PERISHABILITY_MAP.get(ci.name.lower(), "low")

        if existing:
            existing.quantity = ci.quantity
            existing.unit = ci.unit
            if ci.expiry_date:
                existing.expiry_date = ci.expiry_date
            existing.perishability = perishability
            if ci.category:
                existing.category = ci.category
        else:
            existing = InventoryItem(
                name=ci.name,
                quantity=ci.quantity,
                unit=ci.unit,
                category=ci.category,
                expiry_date=ci.expiry_date,
                perishability=perishability,
            )
            db.add(existing)

        db.commit()
        db.refresh(existing)
        results.append(_to_response(existing))

    return results


# ── Consume after cooking ──────────────────────────────────────────────────

def consume_ingredients(
    db: Session, consumed: list[dict]
) -> dict:
    """
    Deduct ingredient quantities after a recipe is cooked.

    consumed: [{name: str, quantity: float, unit?: str}]
    Returns a summary of updated items.
    """
    updated: list[str] = []
    not_found: list[str] = []

    for entry in consumed:
        name = entry.get("name", "").strip()
        if not name:
            continue
        qty = float(entry.get("quantity", 0))
        unit = entry.get("unit")

        # Fuzzy or exact match against pantry inventory
        item = (
            db.query(InventoryItem)
            .filter(InventoryItem.name.ilike(f"%{name}%") | InventoryItem.name.ilike(name))
            .first()
        )
        if item is None:
            # Try inverse match
            all_items = db.query(InventoryItem).all()
            for cand in all_items:
                if cand.name.lower() in name.lower() or name.lower() in cand.name.lower():
                    item = cand
                    break

        if item is None:
            not_found.append(name)
            continue

        # Convert deduction to matching pantry stock units
        deduct_amount = convert_deduction(
            item_name=item.name,
            consumed_qty=qty,
            consumed_unit=unit,
            inventory_unit=item.unit,
        )

        new_qty = max(0.0, round(item.quantity - deduct_amount, 2))
        item.quantity = new_qty
        db.commit()
        updated.append(f"{item.name}: {item.quantity} {item.unit} remaining")

    return {
        "success": True,
        "updated": updated,
        "not_found": not_found,
    }



# ── Zero-waste priority ────────────────────────────────────────────────────

def get_priority_ingredients(db: Session) -> list[dict]:
    """
    Return inventory items sorted by perishability (high first) and
    days until expiry (soonest first), for zero-waste recipe generation.
    """
    items = db.query(InventoryItem).filter(InventoryItem.quantity > 0).all()

    perishability_order = {"high": 0, "medium": 1, "low": 2}

    def sort_key(item: InventoryItem):
        p = perishability_order.get(item.perishability or "low", 2)
        d = item.days_until_expiry()
        days = d if d is not None else 9999
        return (p, days)

    items.sort(key=sort_key)

    return [
        {
            "name": i.name,
            "quantity": i.quantity,
            "unit": i.unit,
            "perishability": i.perishability,
            "days_until_expiry": i.days_until_expiry(),
        }
        for i in items
    ]
