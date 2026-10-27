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

_SIMPLE_RECIPE_LIMIT = 5
_VEGETABLES = {
    "broccoli", "cabbage", "capsicum", "carrot", "corn", "cucumber",
    "garlic", "ginger", "lettuce", "mushroom", "onion", "peas", "potato",
    "radish", "spinach", "tomato",
}


def build_simple_recipes(
    inventory: list[dict],
    servings: int,
    match_type: str | None = None,
    forbidden_ingredients: list[str] | None = None,
    count: int = 2,
) -> list[GeneratedRecipe]:
    """Create simple, pantry-only recipes when the LLM is unavailable."""
    forbidden = {item.lower() for item in (forbidden_ingredients or [])}
    allowed = [
        item for item in inventory
        if item.get("name", "").lower() not in forbidden
        and not any(
            rule in item.get("name", "").lower()
            or item.get("name", "").lower() in rule
            for rule in forbidden
        )
    ]
    by_name = {item.get("name", "").lower(): item for item in allowed}
    vegetables = [item for item in allowed if item.get("name", "").lower() in _VEGETABLES]

    groups = [
        ("Easy Vegetable Skillet", "A simple one-pan meal using a few fresh pantry vegetables.", vegetables[:4]),
        ("Roasted Pantry Vegetables", "A straightforward roasted tray of the vegetables you have on hand.", [
            by_name[name] for name in ("potato", "carrot", "onion", "capsicum") if name in by_name
        ][:4]),
        ("Tomato and Greens Saute", "A quick saute built from tomatoes, greens, and a few available vegetables.", [
            by_name[name] for name in ("tomato", "spinach", "mushroom", "onion") if name in by_name
        ][:4]),
    ]

    recipes: list[GeneratedRecipe] = []
    seen_ingredient_sets: set[tuple[str, ...]] = set()
    for title, description, group in groups:
        selected = group[:_SIMPLE_RECIPE_LIMIT]
        if not selected:
            continue
        names = tuple(item["name"].lower() for item in selected)
        if names in seen_ingredient_sets:
            continue
        seen_ingredient_sets.add(names)
        recipes.append(_dict_to_recipe({
            "title": title,
            "description": description,
            "servings": servings,
            "preparation_time_minutes": 20,
            "dietary_tags": [],
            "spice_level": "Mild",
            "difficulty": "Easy",
            "match_score": 100,
            "match_type": match_type or "zero-waste",
            "ingredients": [
                {"name": item["name"], "quantity": item.get("quantity", 1),
                 "unit": item.get("unit", "pcs"), "in_stock": True}
                for item in selected
            ],
            "steps": [
                {"step_number": 1, "instruction": "Wash and cut the ingredients into similar-sized pieces."},
                {"step_number": 2, "instruction": "Heat a pan or oven and cook the ingredients until tender."},
                {"step_number": 3, "instruction": "Season with available pantry staples and serve."},
            ],
            "missing_items": [],
            "utilized_ingredients": [item["name"] for item in selected],
        }, match_type))
        if len(recipes) >= count:
            break
    return recipes

def _build_system_prompt() -> str:
    return (
        "You are a professional chef and recipe generator for Smart Palette, "
        "a zero-waste AI cooking assistant. Your role is to generate recipes "
        "that primarily use the confirmed ingredient inventory provided by the user. "
        "You MUST:\n"
        "- Generate EXACTLY the number of recipes requested (count field in the user prompt).\n"
        "- Each recipe MUST have a distinct title and different primary cooking method.\n"
        "- Use confirmed ingredients as primary ingredients.\n"
        "- If match_type is 'zero-waste', use ONLY available inventory items (match_score: 100, missing_items: []).\n"
        "- If match_type is 'quick-run', the recipe may require 1-2 minor missing ingredients (e.g., spices, cream, garnish) with match_score between 85-95, and provide realistic substitutions from available ingredients.\n"
        "- Strictly respect dietary restrictions and allergies (hard constraints).\n"
        "- Stay within the requested preparation time.\n"
        "- Match the requested serving size.\n"
        "- Prefer ingredients marked as high-perishability or close to expiry.\n"
        "- Return a single valid JSON object containing an array of 'recipes'. "
        "The schema for each recipe must match:\n"
        "{\n"
        '  "recipes": [\n'
        "    {\n"
        '      "title": string,\n'
        '      "description": string,\n'
        '      "servings": integer,\n'
        '      "preparation_time_minutes": integer,\n'
        '      "diet": string | null,\n'
        '      "dietary_tags": [string],\n'
        '      "spice_level": "Mild" | "Medium" | "Hot" | "Extra Hot",\n'
        '      "difficulty": "Easy" | "Medium" | "Hard",\n'
        '      "match_score": integer (0-100),\n'
        '      "match_type": "zero-waste" | "quick-run",\n'
        '      "ingredients": [{"name": string, "quantity": number|string, "unit": string, "in_stock": boolean}],\n'
        '      "steps": [{"step_number": integer, "instruction": string, "timer_seconds": integer | null}],\n'
        '      "missing_items": [string],\n'
        '      "utilized_ingredients": [string],\n'
        '      "substitutes": [{"missing": string, "use": string}]\n'
        "    }\n"
        "  ]\n"
        "}"
    )


def _build_user_prompt(
    inventory: list[dict],
    servings: int,
    diet: str | None,
    allergies: list[str],
    spice_level: str | None,
    max_time_minutes: int | None,
    budget: str | None,
    cuisine_preference: str | None,
    forbidden_ingredients: list[str],
    priority_ingredients: list[str],
    match_type: str | None = None,
    count: int = 1,
) -> str:
    inv_lines = "\n".join(
        f"  - {item['name']}: {item.get('quantity', '?')} {item.get('unit', 'pcs')}"
        for item in inventory
    )

    constraints = []
    if match_type:
        constraints.append(f"Match type: {match_type}")
    if diet:
        constraints.append(f"Diet: {diet}")
    if allergies:
        constraints.append(f"Allergies (hard exclude): {', '.join(allergies)}")
    if spice_level:
        constraints.append(f"Maximum spice level: {spice_level}")
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
        f"Generate {count} {match_type or 'zero-waste'} recipe(s) using the following confirmed ingredient inventory:\n"
        f"{inv_lines}\n\n"
        f"Constraints:\n{constraint_text}\n\n"
        "Return ONLY the JSON object with the 'recipes' array. No markdown, no commentary."
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


from app.schemas.recipe import GeneratedRecipe, RecipeIngredient, RecipeStep, SubstituteInfo

def generate_recipe(
    inventory: list[dict],
    servings: int = 2,
    diet: str | None = None,
    allergies: list[str] | None = None,
    spice_level: str | None = None,
    max_time_minutes: int | None = None,
    budget: str | None = None,
    cuisine_preference: str | None = None,
    forbidden_ingredients: list[str] | None = None,
    priority_ingredients: list[str] | None = None,
    match_type: str | None = None,
    count: int = 1,
) -> list[GeneratedRecipe]:
    """
    Generate one or more recipes via Groq LLM.
    Returns no recipes when the real generation service is unavailable or
    produces no parseable recipes. The API decides whether a pantry-only
    last-resort recipe is appropriate after validation.
    """
    allergies = allergies or []
    forbidden_ingredients = forbidden_ingredients or []
    priority_ingredients = priority_ingredients or []

    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        logger.warning("GROQ_API_KEY is not configured; using pantry recipe builder.")
        return build_simple_recipes(
            inventory, servings, match_type, forbidden_ingredients, count
        )

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
                        inventory=inventory,
                        servings=servings,
                        diet=diet,
                        allergies=allergies,
                        spice_level=spice_level,
                        max_time_minutes=max_time_minutes,
                        budget=budget,
                        cuisine_preference=cuisine_preference,
                        forbidden_ingredients=forbidden_ingredients,
                        priority_ingredients=priority_ingredients,
                        match_type=match_type,
                        count=count,
                    ),
                },
            ],
            temperature=0.7,
            max_tokens=4000,
            response_format={"type": "json_object"},

        )

        raw_content = response.choices[0].message.content or ""
        logger.debug("LLM raw response: %s", raw_content[:500])

        parsed_data = json.loads(raw_content)
        # Handle {"recipes": [...]} or single recipe dict
        recipes_list: list[dict] = []
        if isinstance(parsed_data, dict):
            if "recipes" in parsed_data and isinstance(parsed_data["recipes"], list):
                recipes_list = parsed_data["recipes"]
            else:
                recipes_list = [parsed_data]
        elif isinstance(parsed_data, list):
            recipes_list = parsed_data

        results = [_dict_to_recipe(r, match_type) for r in recipes_list]
        return results

    except Exception as exc:
        logger.error("LLM recipe generation failed: %s", exc, exc_info=True)
        return build_simple_recipes(
            inventory, servings, match_type, forbidden_ingredients, count
        )


def build_last_resort_recipe(
    inventory: list[dict],
    servings: int,
    match_type: str | None = None,
) -> GeneratedRecipe:
    """Build one recipe strictly from the user's available pantry items."""
    ingredients = [
        {"name": item["name"], "quantity": item.get("quantity", 1),
         "unit": item.get("unit", "pcs"), "in_stock": True}
        for item in inventory[:_SIMPLE_RECIPE_LIMIT]
    ]
    return _dict_to_recipe({
        "title": "Last-Resort Pantry Meal",
        "description": "A last-resort recipe using only the ingredients currently in your pantry.",
        "servings": servings,
        "preparation_time_minutes": 20,
        "dietary_tags": [],
        "spice_level": "Mild",
        "difficulty": "Easy",
        "match_score": 100,
        "match_type": match_type or "zero-waste",
        "ingredients": ingredients,
        "steps": [
            {"step_number": 1, "instruction": "Prepare and cut the available ingredients into bite-sized pieces."},
            {"step_number": 2, "instruction": "Cook the ingredients using the safest method for their type until tender and cooked through."},
            {"step_number": 3, "instruction": "Combine, taste, and serve the finished pantry meal."},
        ],
        "missing_items": [],
        "utilized_ingredients": [item["name"] for item in inventory[:_SIMPLE_RECIPE_LIMIT]],
    }, match_type)


def _dict_to_recipe(data: dict, match_type: str | None = None) -> GeneratedRecipe:
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

    substitutes = [
        SubstituteInfo(
            missing=sub.get("missing", ""),
            use=sub.get("use", ""),
        )
        for sub in data.get("substitutes", [])
        if isinstance(sub, dict) and "missing" in sub and "use" in sub
    ]

    recipe_match_type = data.get("match_type") or match_type or "zero-waste"
    default_score = 100 if recipe_match_type == "zero-waste" else 90

    return GeneratedRecipe(
        title=data.get("title", "Fresh Pantry Meal"),
        description=data.get("description"),
        servings=data.get("servings", 2),
        preparation_time_minutes=data.get("preparation_time_minutes", 20),
        diet=data.get("diet"),
        dietary_tags=data.get("dietary_tags", []),
        spice_level=data.get("spice_level", "Mild"),
        difficulty=data.get("difficulty", "Easy"),
        match_score=data.get("match_score", default_score),
        match_type=recipe_match_type,
        image_url=data.get("image_url"),
        ingredients=ingredients,
        steps=steps,
        missing_items=data.get("missing_items", []),
        utilized_ingredients=data.get("utilized_ingredients", []),
        substitutes=substitutes,
    )

