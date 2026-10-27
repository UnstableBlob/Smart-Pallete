"""
Smart Palette – Unit Converter and Normalization Service.

Provides normalized conversions between weight, volume, and count units,
allowing recipes with fractional or kitchen-measure units (grams, cups, tbsp)
to correctly deduct from inventory tracked in pieces, grams, or volume.
"""
import logging
import re

logger = logging.getLogger(__name__)

# Standard volume in milliliters (ml)
VOLUME_TO_ML: dict[str, float] = {
    "ml": 1.0,
    "milliliter": 1.0,
    "milliliters": 1.0,
    "tsp": 5.0,
    "teaspoon": 5.0,
    "teaspoons": 5.0,
    "tbsp": 15.0,
    "tablespoon": 15.0,
    "tablespoons": 15.0,
    "fl oz": 29.5735,
    "cup": 240.0,
    "cups": 240.0,
    "pint": 473.176,
    "pints": 473.176,
    "quart": 946.353,
    "quarts": 946.353,
    "l": 1000.0,
    "liter": 1000.0,
    "liters": 1000.0,
}

# Standard mass in grams (g)
MASS_TO_GRAMS: dict[str, float] = {
    "g": 1.0,
    "gram": 1.0,
    "grams": 1.0,
    "kg": 1000.0,
    "kilogram": 1000.0,
    "kilograms": 1000.0,
    "oz": 28.3495,
    "ounce": 28.3495,
    "ounces": 28.3495,
    "lb": 453.592,
    "pound": 453.592,
    "pounds": 453.592,
}

# Estimated average weight in grams for common items tracked by pieces / count
ITEM_PIECE_WEIGHT_GRAMS: dict[str, float] = {
    "tomato": 130.0,
    "onion": 150.0,
    "red onion": 150.0,
    "potato": 170.0,
    "sweet potato": 200.0,
    "egg": 50.0,
    "eggs": 50.0,
    "apple": 180.0,
    "banana": 120.0,
    "carrot": 80.0,
    "bell pepper": 150.0,
    "capsicum": 150.0,
    "garlic": 40.0,          # 1 head
    "garlic clove": 5.0,
    "lemon": 60.0,
    "lime": 45.0,
    "cucumber": 200.0,
    "avocado": 150.0,
    "bread": 35.0,           # slice
    "bread slice": 35.0,
    "cheese": 25.0,          # slice
    "chicken breast": 200.0,
    "mushroom": 20.0,
    "zucchini": 200.0,
    "cabbage": 900.0,        # 1 head
    "broccoli": 300.0,       # 1 head
}

COUNT_UNITS = {"pcs", "piece", "pieces", "count", "head", "heads", "clove", "cloves", "slice", "slices", "item", "items"}


def _normalize_unit(unit: str | None) -> str:
    if not unit:
        return "pcs"
    cleaned = unit.strip().lower()
    cleaned = re.sub(r"[^a-z0-9\s]", "", cleaned)
    return cleaned


def _get_item_piece_weight(name: str) -> float:
    name_lower = name.lower()
    for key, weight in ITEM_PIECE_WEIGHT_GRAMS.items():
        if key in name_lower or name_lower in key:
            return weight
    return 100.0  # safe generic fallback: 100g per piece


def convert_deduction(
    item_name: str,
    consumed_qty: float,
    consumed_unit: str | None,
    inventory_unit: str | None,
) -> float:
    """
    Calculate how much of the inventory item to deduct in terms of the
    inventory item's unit.

    Examples:
      - 200g of tomato deducted from inventory in 'pcs' -> ~1.54 pcs
      - 2 pcs of tomato deducted from inventory in 'grams' -> 260g
      - 2 cups of milk deducted from inventory in 'ml' -> 480ml
      - 500ml of broth deducted from inventory in 'cups' -> ~2.08 cups
    """
    if consumed_qty <= 0:
        return 0.0

    c_unit = _normalize_unit(consumed_unit)
    inv_unit = _normalize_unit(inventory_unit)

    # 1. Exact or count match
    if c_unit == inv_unit or (c_unit in COUNT_UNITS and inv_unit in COUNT_UNITS):
        return consumed_qty

    # 2. Both are mass units (e.g. grams <-> kg)
    if c_unit in MASS_TO_GRAMS and inv_unit in MASS_TO_GRAMS:
        grams = consumed_qty * MASS_TO_GRAMS[c_unit]
        return grams / MASS_TO_GRAMS[inv_unit]

    # 3. Both are volume units (e.g. cup <-> ml, tbsp <-> l)
    if c_unit in VOLUME_TO_ML and inv_unit in VOLUME_TO_ML:
        ml = consumed_qty * VOLUME_TO_ML[c_unit]
        return ml / VOLUME_TO_ML[inv_unit]

    # 4. Consumed mass -> Inventory pieces
    piece_weight = _get_item_piece_weight(item_name)
    if c_unit in MASS_TO_GRAMS and inv_unit in COUNT_UNITS:
        grams = consumed_qty * MASS_TO_GRAMS[c_unit]
        pcs = grams / piece_weight
        return round(pcs, 2)

    # 5. Consumed pieces -> Inventory mass (e.g. inventory in grams or kg)
    if c_unit in COUNT_UNITS and inv_unit in MASS_TO_GRAMS:
        grams = consumed_qty * piece_weight
        return round(grams / MASS_TO_GRAMS[inv_unit], 2)

    # 6. Water-like density fallback for volume <-> mass (1ml ~ 1g)
    if c_unit in VOLUME_TO_ML and inv_unit in MASS_TO_GRAMS:
        grams = consumed_qty * VOLUME_TO_ML[c_unit]
        return round(grams / MASS_TO_GRAMS[inv_unit], 2)

    if c_unit in MASS_TO_GRAMS and inv_unit in VOLUME_TO_ML:
        ml = consumed_qty * MASS_TO_GRAMS[c_unit]
        return round(ml / VOLUME_TO_ML[inv_unit], 2)

    # Default fallback: return consumed_qty directly
    return consumed_qty
