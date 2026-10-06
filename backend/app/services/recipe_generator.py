"""
Smart Palette – Recipe Generator Service.

Calls the Groq LLM with a structured prompt that includes the confirmed
inventory, user constraints, and perishability information.  Returns a
validated GeneratedRecipe Pydantic model.
"""
import json
import logging
import re
from typing import Any

from app.config.settings import GROQ_API_KEY, GROQ_MODEL
from app.schemas.recipe import GeneratedRecipe, RecipeIngredient, RecipeStep

logger = logging.getLogger(__name__)

# ── Fallback templates when Groq is unavailable ────────────────────────────
_FALLBACK_RECIPE = {
    "title": "Simple Stir-Fry",
    "description": "A quick and easy stir-fry using available ingredients.",
    "servings": 2,
    "preparation_time_minutes": 15,
    "dietary_tags": ["Vegetarian"],
    "spice_level": "Medium",
    "difficulty": "Easy",
    "match_score": 90,
    "match_type": "zero-waste",
    "ingredients": [],
    "steps": [
        {"step_number": 1, "instruction": "Chop all available vegetables."},
        {"step_number": 2, "instruction": "Heat oil in a pan over medium heat."},
        {"step_number": 3, "instruction": "Stir-fry vegetables for 5–7 minutes."},
        {"step_number": 4, "instruction": "Season with salt and pepper. Serve hot."},
    ],
    "missing_items": [],
    "utilized_ingredients": [],
}


def _build_system_prompt() -> str:
    return (
        "You are a professional chef and recipe generator for Smart Palette, "
        "a zero-waste AI cooking assistant. Your role is to generate recipes "
        "that primarily use the confirmed ingredient inventory provided by the user. "
        "You MUST:\n"
        "- Use only the confirmed ingredients as primary ingredients.\n"
        "- Strictly respect dietary restrictions and allergies (hard constraints).\n"
        "- Stay within the requested preparation time.\n"
        "- Match the requested serving size.\n"
        "- Prefer ingredients marked as high-perishability or close to expiry.\n"
        "- Return a single valid JSON object and nothing else.\n"
        "- Never invent primary ingredients not in the inventory.\n"
        "- Common pantry staples like salt, pepper, water, and basic spices are allowed.\n"
        "The JSON must match this schema exactly:\n"
        "{\n"
        '  "title": string,\n'
        '  "description": string,\n'
        '  "servings": integer,\n'
        '  "preparation_time_minutes": integer,\n'
        '  "diet": string | null,\n'
        '  "dietary_tags": [string],\n'
        '  "spice_level": "Mild" | "Medium" | "Hot" | "Extra Hot",\n'
        '  "difficulty": "Easy" | "Medium" | "Hard",\n'
        '  "match_score": integer (0-100),\n'
        '  "match_type": "zero-waste" | "quick-run",\n'
        '  "ingredients": [{"name": string, "quantity": number|string, "unit": string, "in_stock": boolean}],\n'
        '  "steps": [{"step_number": integer, "instruction": string, "timer_seconds": integer | null}],\n'
        '  "missing_items": [string],\n'
        '  "utilized_ingredients": [string]\n'
        "}"
    )


def _build_user_prompt(
    inventory: list[dict],
    servings: int,
    diet: str | None,
    allergies: list[str],
    max_time_minutes: int | None,
    budget: str | None,
    cuisine_preference: str | None,
    forbidden_ingredients: list[str],
    priority_ingredients: list[str],
) -> str:
    inv_lines = "\n".join(
        f"  - {item['name']}: {item.get('quantity', '?')} {item.get('unit', 'pcs')}"
        for item in inventory
    )

    constraints = []
    if diet:
        constraints.append(f"Diet: {diet}")
    if allergies:
        constraints.append(f"Allergies (hard exclude): {', '.join(allergies)}")
    if max_time_minutes:
        constraints.append(f"Max preparation time: {max_time_minutes} minutes")
    constraints.append(f"Servings: {servings}")
    if budget:
        constraints.append(f"Budget: {budget}")
    if cuisine_preference:
        constraints.append(f"Cuisine preference: {cuisine_preference}")
    if forbidden_ingredients:
        constraints.append(f"Forbidden ingredients: {', '.join(forbidden_ingredients)}")
    if priority_ingredients:
        constraints.append(
            f"PRIORITIZE these ingredients (perishable/close to expiry): "
            f"{', '.join(priority_ingredients)}"
        )

    constraint_text = "\n".join(f"  • {c}" for c in constraints)

    return (
        f"Generate one recipe using the following confirmed ingredient inventory:\n"
        f"{inv_lines}\n\n"
        f"Constraints:\n{constraint_text}\n\n"
        "Return ONLY the JSON object. No explanation, no markdown, no code fences."
    )


def _parse_llm_json(raw: str) -> dict[str, Any]:
    """Extract JSON from LLM response, handling markdown fences."""
    # Strip markdown code fences if present
    cleaned = re.sub(r"```(?:json)?", "", raw, flags=re.IGNORECASE).strip().strip("`")
    # Find the first { ... } block
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError("No valid JSON object found in LLM response.")


def generate_recipe(
    inventory: list[dict],
    servings: int = 2,
    diet: str | None = None,
    allergies: list[str] | None = None,
    max_time_minutes: int | None = None,
    budget: str | None = None,
    cuisine_preference: str | None = None,
    forbidden_ingredients: list[str] | None = None,
    priority_ingredients: list[str] | None = None,
) -> GeneratedRecipe:
    """
    Generate a recipe via Groq LLM.
    Falls back to a basic template if Groq is unavailable.
    """
    allergies = allergies or []
    forbidden_ingredients = forbidden_ingredients or []
    priority_ingredients = priority_ingredients or []

    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        logger.warning("GROQ_API_KEY not set – returning fallback recipe.")
        return _build_fallback_recipe(inventory, servings)

    try:
        from groq import Groq  # type: ignore

        client = Groq(api_key=GROQ_API_KEY)

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": _build_system_prompt()},
                {
                    "role": "user",
                    "content": _build_user_prompt(
                        inventory,
                        servings,
                        diet,
                        allergies,
                        max_time_minutes,
                        budget,
                        cuisine_preference,
                        forbidden_ingredients,
                        priority_ingredients,
                    ),
                },
            ],
            temperature=0.7,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )

        raw_content = response.choices[0].message.content or ""
        logger.debug("LLM raw response: %s", raw_content[:500])

        recipe_data = json.loads(raw_content)
        return _dict_to_recipe(recipe_data)

    except Exception as exc:
        logger.error("LLM recipe generation failed: %s", exc, exc_info=True)
        return _build_fallback_recipe(inventory, servings)


def _build_fallback_recipe(inventory: list[dict], servings: int) -> GeneratedRecipe:
    """Build a simple fallback recipe from the inventory without LLM."""
    ing_names = [item["name"] for item in inventory[:5]]
    recipe = dict(_FALLBACK_RECIPE)
    recipe["servings"] = servings
    recipe["utilized_ingredients"] = ing_names
    recipe["ingredients"] = [
        {"name": item["name"], "quantity": item.get("quantity", 1),
         "unit": item.get("unit", "pcs"), "in_stock": True}
        for item in inventory[:5]
    ]
    return _dict_to_recipe(recipe)


def _dict_to_recipe(data: dict) -> GeneratedRecipe:
    """Convert a raw dict to a GeneratedRecipe model."""
    ingredients = [
        RecipeIngredient(
            name=i.get("name", ""),
            quantity=i.get("quantity", 1),
            unit=i.get("unit"),
            in_stock=i.get("in_stock", True),
        )
        for i in data.get("ingredients", [])
    ]

    steps = [
        RecipeStep(
            step_number=s.get("step_number", idx + 1),
            instruction=s.get("instruction", ""),
            timer_seconds=s.get("timer_seconds"),
        )
        for idx, s in enumerate(data.get("steps", []))
    ]

    return GeneratedRecipe(
        title=data.get("title", "Recipe"),
        description=data.get("description"),
        servings=data.get("servings", 2),
        preparation_time_minutes=data.get("preparation_time_minutes", 20),
        diet=data.get("diet"),
        dietary_tags=data.get("dietary_tags", []),
        spice_level=data.get("spice_level", "Mild"),
        difficulty=data.get("difficulty", "Easy"),
        match_score=data.get("match_score", 90),
        match_type=data.get("match_type", "zero-waste"),
        image_url=data.get("image_url"),
        ingredients=ingredients,
        steps=steps,
        missing_items=data.get("missing_items", []),
        utilized_ingredients=data.get("utilized_ingredients", []),
    )
