"""
Smart Palette – Recipes API Router.

POST /api/v1/recipes/generate   – generate recipe via LLM
POST /api/v1/recipes/validate   – validate a recipe against constraints
GET  /api/v1/recipes/generate   – alias for frontend fetchRecipes (tab param)
"""
import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.recipe import (
    GenerateRecipeRequest,
    GeneratedRecipe,
    RecipeGenerationResponse,
    ValidateRecipeRequest,
    ValidationResult,
)
from app.config.settings import INGREDIENT_CLASSES
from app.services import constraint_engine, recipe_generator, recipe_validator
from app.services import inventory_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/recipes/generate", response_model=RecipeGenerationResponse)
def generate_recipe(payload: GenerateRecipeRequest, db: Session = Depends(get_db)):
    """
    Generate recipes from confirmed inventory and user constraints.

    Pipeline:
      1. Run constraint engine (hard rules check)
      2. Call Groq LLM with structured prompt
      3. Validate generated recipes
      4. Return recipe JSON (list or single)
    """
    # ── 1. Constraint check ───────────────────────────────────────────────
    db_priority = inventory_service.get_priority_ingredients(db)
    priority_names = [i["name"] for i in db_priority]

    constraint_result = constraint_engine.validate_constraints(
        inventory=payload.inventory,
        diet=payload.diet,
        allergies=payload.allergies,
        max_time_minutes=payload.max_time_minutes,
        servings=payload.servings,
        budget=payload.budget,
    )

    if not constraint_result["valid"]:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail={
                "code": "CONSTRAINT_VIOLATION",
                "errors": constraint_result["errors"],
                "message": "; ".join(constraint_result["errors"]),
            },
        )

    if constraint_result["warnings"]:
        logger.warning("Constraint warnings: %s", constraint_result["warnings"])

    # ── 2. LLM recipe generation ──────────────────────────────────────────
    recipes = recipe_generator.generate_recipe(
        inventory=payload.inventory,
        servings=payload.servings,
        diet=payload.diet,
        allergies=payload.allergies,
        spice_level=payload.spice_level,
        max_time_minutes=payload.max_time_minutes,
        budget=payload.budget,
        cuisine_preference=payload.cuisine_preference,
        forbidden_ingredients=constraint_result["forbidden_ingredients"],
        priority_ingredients=constraint_result["priority_ingredients"] or priority_names[:5],
        match_type=payload.match_type,
        count=payload.count,
    )

    # ── 3. Validation ──────────────────────────────────────────────────────
    valid_recipes = []
    suggested_ingredients: list[str] = []
    for recipe in recipes:
        recipe_dict = recipe.model_dump()
        validation = recipe_validator.validate_recipe(
            recipe=recipe_dict,
            inventory=payload.inventory,
            diet=payload.diet,
            allergies=payload.allergies,
            max_time_minutes=payload.max_time_minutes,
            servings=payload.servings,
        )
        if validation["valid"]:
            valid_recipes.append(recipe)
        else:
            logger.warning(
                "Discarding invalid recipe '%s': %s",
                recipe.title,
                validation["errors"],
            )
        for item in recipe.missing_items:
            if item and item.lower() not in {name.lower() for name in suggested_ingredients}:
                suggested_ingredients.append(item)

    if not valid_recipes:
        inventory_names = {item["name"].lower() for item in payload.inventory}
        forbidden = [item.lower() for item in constraint_result["forbidden_ingredients"]]
        eligible_inventory = [
            item for item in payload.inventory
            if not any(rule in item["name"].lower() or item["name"].lower() in rule for rule in forbidden)
        ]
        last_resort = None
        if eligible_inventory:
            candidate = recipe_generator.build_last_resort_recipe(
                eligible_inventory, payload.servings, payload.match_type
            )
            candidate_validation = recipe_validator.validate_recipe(
                recipe=candidate.model_dump(),
                inventory=payload.inventory,
                diet=payload.diet,
                allergies=payload.allergies,
                max_time_minutes=payload.max_time_minutes,
                servings=payload.servings,
            )
            if candidate_validation["valid"]:
                last_resort = candidate

        for ingredient in INGREDIENT_CLASSES:
            if ingredient.lower() not in inventory_names and ingredient.lower() not in {
                name.lower() for name in suggested_ingredients
            } and len(suggested_ingredients) < 5:
                suggested_ingredients.append(ingredient)

        if last_resort:
            return RecipeGenerationResponse(
                recipes=[last_resort],
                available=False,
                last_resort=True,
                message="No complete recipe matched your constraints. This last-resort meal uses only your current pantry items.",
                suggested_ingredients=suggested_ingredients,
            )

        return RecipeGenerationResponse(
            recipes=[],
            available=False,
            message="No recipes are available with the current ingredients and dietary restrictions.",
            suggested_ingredients=suggested_ingredients,
        )

    logger.info("Generated %d valid recipe(s)", len(valid_recipes))
    if payload.count > 1 or len(valid_recipes) > 1:
        selected = valid_recipes
    else:
        selected = [valid_recipes[0]]
    return RecipeGenerationResponse(
        recipes=selected,
        available=True,
        message="Recipes generated from your complete pantry.",
        suggested_ingredients=[],
    )



@router.post("/recipes/validate", response_model=ValidationResult)
def validate_recipe(payload: ValidateRecipeRequest):
    """Validate an existing recipe against the confirmed inventory and constraints."""
    recipe_dict = payload.recipe.model_dump()
    result = recipe_validator.validate_recipe(
        recipe=recipe_dict,
        inventory=payload.inventory,
        diet=payload.diet,
        allergies=payload.allergies,
        max_time_minutes=payload.max_time_minutes,
        servings=payload.servings,
    )
    return ValidationResult(**result)


@router.get("/recipes/generate")
def fetch_recipes_alias(
    tab: str = Query(default="zero-waste", description="'zero-waste' or 'quick-run'"),
    db: Session = Depends(get_db),
):
    """
    Frontend alias: GET /api/v1/recipes/generate?tab=zero-waste
    Returns inventory-based recipe suggestions from the database context.
    Since this is a GET request without full inventory payload, we return
    available inventory for client-side filtering.
    """
    priority_items = inventory_service.get_priority_ingredients(db)
    return {
        "tab": tab,
        "inventory": priority_items,
        "message": "Use POST /api/v1/recipes/generate with inventory payload to generate recipes.",
    }
