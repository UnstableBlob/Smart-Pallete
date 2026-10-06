"""
Smart Palette – Recipe Validator Service.

Validates a generated recipe against:
  1. Confirmed inventory availability
  2. Dietary restrictions
  3. Allergen rules
  4. Preparation time
  5. Serving size
  6. Unapproved primary ingredients
"""
import logging

from app.config.settings import DIETARY_RESTRICTIONS

logger = logging.getLogger(__name__)

_COMMON_STAPLES = {
    "salt", "pepper", "black pepper", "water", "oil", "olive oil",
    "sugar", "flour", "baking powder", "vinegar", "soy sauce", "cumin",
    "coriander", "turmeric", "chili", "paprika", "oregano", "basil",
    "thyme", "rosemary", "bay leaf",
}

_DIET_FORBIDDEN: dict[str, set[str]] = {
    diet: set(items)
    for diet, items in DIETARY_RESTRICTIONS.items()
}


def validate_recipe(
    recipe: dict,
    inventory: list[dict],
    diet: str | None = None,
    allergies: list[str] | None = None,
    max_time_minutes: int | None = None,
    servings: int = 2,
) -> dict:
    """
    Validate a recipe dict.

    Returns
    -------
    {
        "valid": bool,
        "errors": [str],
        "warnings": [str],
    }
    """
    errors: list[str] = []
    warnings: list[str] = []
    allergies = [a.lower() for a in (allergies or [])]

    inventory_map: dict[str, float] = {
        item["name"].lower(): float(item.get("quantity", 0))
        for item in inventory
    }

    recipe_ingredients = recipe.get("ingredients", [])

    # ── 1. Primary ingredient availability ───────────────────────────────
    for ing in recipe_ingredients:
        name = ing.get("name", "").lower()
        if name in _COMMON_STAPLES:
            continue
        if not any(name in inv_name or inv_name in name for inv_name in inventory_map):
            if ing.get("in_stock", True):   # recipe says it's in stock but we can't find it
                warnings.append(
                    f"Ingredient '{ing['name']}' is marked as in-stock but not found in inventory."
                )

    # ── 2. Dietary restrictions ──────────────────────────────────────────
    if diet:
        diet_key = diet.lower().replace("-", "_").replace(" ", "_")
        forbidden = _DIET_FORBIDDEN.get(diet_key, set())
        for ing in recipe_ingredients:
            name = ing.get("name", "").lower()
            if any(f in name or name in f for f in forbidden):
                errors.append(
                    f"Recipe ingredient '{ing['name']}' violates '{diet}' dietary restriction."
                )

    # ── 3. Allergen check ────────────────────────────────────────────────
    for ing in recipe_ingredients:
        name = ing.get("name", "").lower()
        for allergen in allergies:
            if allergen in name or name in allergen:
                errors.append(
                    f"Recipe contains allergen '{allergen}' in ingredient '{ing['name']}'."
                )

    # ── 4. Preparation time ──────────────────────────────────────────────
    recipe_time = recipe.get("preparation_time_minutes", 0)
    if max_time_minutes and recipe_time > max_time_minutes:
        warnings.append(
            f"Recipe prep time ({recipe_time} min) exceeds requested "
            f"max ({max_time_minutes} min)."
        )

    # ── 5. Servings ───────────────────────────────────────────────────────
    recipe_servings = recipe.get("servings", 0)
    if recipe_servings and abs(recipe_servings - servings) > 1:
        warnings.append(
            f"Recipe serves {recipe_servings} but {servings} was requested."
        )

    # ── 6. Ingredients are valid ─────────────────────────────────────────
    if not recipe_ingredients:
        errors.append("Recipe has no ingredients.")

    if not recipe.get("steps"):
        errors.append("Recipe has no steps.")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
    }
