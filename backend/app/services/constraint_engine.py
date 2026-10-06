"""
Smart Palette – Constraint Engine.

Validates that user constraints (diet, allergies, time, servings, budget)
are feasible given the confirmed inventory, BEFORE sending to the LLM.
This acts as a hard-rule layer so the LLM is not the sole safety net.
"""
import logging

from app.config.settings import DIETARY_RESTRICTIONS

logger = logging.getLogger(__name__)

# ── Diet → forbidden ingredient groups ────────────────────────────────────
_DIET_RULES: dict[str, list[str]] = {
    "vegan": DIETARY_RESTRICTIONS.get("vegan", []),
    "vegetarian": DIETARY_RESTRICTIONS.get("vegetarian", []),
    "gluten-free": DIETARY_RESTRICTIONS.get("gluten_free", []),
    "gluten_free": DIETARY_RESTRICTIONS.get("gluten_free", []),
    "dairy-free": DIETARY_RESTRICTIONS.get("dairy_free", []),
    "dairy_free": DIETARY_RESTRICTIONS.get("dairy_free", []),
}

_BUDGET_UPPER_COST: dict[str, float] = {
    "low": 5.0,
    "medium": 15.0,
    "high": 50.0,
}


def validate_constraints(
    inventory: list[dict],
    diet: str | None,
    allergies: list[str],
    max_time_minutes: int | None,
    servings: int,
    budget: str | None,
) -> dict:
    """
    Returns:
        {
            "valid": bool,
            "errors": [str],          # hard violations → block generation
            "warnings": [str],        # soft issues → warn but continue
            "forbidden_ingredients": [str],
            "priority_ingredients": [str],  # high-perishability items
            "context_note": str,      # summary string for LLM prompt
        }
    """
    errors: list[str] = []
    warnings: list[str] = []
    forbidden: list[str] = []

    inventory_names = {item["name"].lower() for item in inventory}

    # ── 1. Dietary restrictions ────────────────────────────────────────────
    if diet:
        diet_key = diet.lower().replace(" ", "-")
        diet_forbidden = _DIET_RULES.get(diet_key, [])
        forbidden.extend(diet_forbidden)

        conflicting = [
            name for name in diet_forbidden
            if any(name in inv_name or inv_name in name for inv_name in inventory_names)
        ]
        if conflicting:
            warnings.append(
                f"Diet '{diet}' conflicts with inventory items: {', '.join(conflicting)}. "
                "These will be excluded from the recipe."
            )

    # ── 2. Allergies (hard constraint) ────────────────────────────────────
    for allergen in allergies:
        allergen_lower = allergen.lower()
        forbidden.append(allergen_lower)
        if any(allergen_lower in inv for inv in inventory_names):
            warnings.append(
                f"Allergen '{allergen}' found in inventory – will be excluded from recipe."
            )

    # ── 3. Inventory must not be empty ────────────────────────────────────
    if not inventory:
        errors.append("Inventory is empty. Please scan or add ingredients first.")

    # ── 4. Servings sanity check ──────────────────────────────────────────
    if servings < 1 or servings > 20:
        errors.append(f"Invalid serving size: {servings}. Must be between 1 and 20.")

    # ── 5. Max time sanity ────────────────────────────────────────────────
    if max_time_minutes is not None and max_time_minutes < 5:
        warnings.append(
            f"Requested max time of {max_time_minutes} min is very short; "
            "recipe may not be achievable."
        )

    # ── 6. Priority ingredients (perishable / close-to-expiry) ────────────
    from app.config.settings import PERISHABILITY_MAP

    priority: list[str] = []
    for item in inventory:
        name = item["name"].lower()
        perishability = PERISHABILITY_MAP.get(name, "low")
        days_left = item.get("days_until_expiry")
        if perishability == "high" or (days_left is not None and days_left <= 3):
            priority.append(item["name"])

    # ── 7. Build context note for LLM ────────────────────────────────────
    parts = []
    if diet:
        parts.append(f"diet={diet}")
    if allergies:
        parts.append(f"allergies={','.join(allergies)}")
    if max_time_minutes:
        parts.append(f"max_time={max_time_minutes}min")
    if servings:
        parts.append(f"servings={servings}")
    if budget:
        parts.append(f"budget={budget}")
    if priority:
        parts.append(f"prioritize={','.join(priority)}")

    context_note = "; ".join(parts)

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "forbidden_ingredients": list(set(forbidden)),
        "priority_ingredients": priority,
        "context_note": context_note,
    }
