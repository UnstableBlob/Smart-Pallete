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
    ValidateRecipeRequest,
    ValidationResult,
)
from app.services import constraint_engine, recipe_generator, recipe_validator
from app.services import inventory_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/recipes/generate", response_model=GeneratedRecipe)
def generate_recipe(payload: GenerateRecipeRequest, db: Session = Depends(get_db)):
    """
    Generate a recipe from confirmed inventory and user constraints.

    Pipeline:
      1. Run constraint engine (hard rules check)
      2. Call Groq LLM with structured prompt
      3. Validate generated recipe
      4. Return recipe JSON
    """
    # ── 1. Constraint check ───────────────────────────────────────────────
    # Build an augmented inventory with perishability context from DB
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
    recipe = recipe_generator.generate_recipe(
        inventory=payload.inventory,
        servings=payload.servings,
        diet=payload.diet,
        allergies=payload.allergies,
        max_time_minutes=payload.max_time_minutes,
        budget=payload.budget,
        cuisine_preference=payload.cuisine_preference,
        forbidden_ingredients=constraint_result["forbidden_ingredients"],
        priority_ingredients=constraint_result["priority_ingredients"] or priority_names[:5],
    )

    # ── 3. Validation ──────────────────────────────────────────────────────
    recipe_dict = recipe.model_dump()
    validation = recipe_validator.validate_recipe(
        recipe=recipe_dict,
        inventory=payload.inventory,
        diet=payload.diet,
        allergies=payload.allergies,
        max_time_minutes=payload.max_time_minutes,
        servings=payload.servings,
    )

    if not validation["valid"]:
        logger.warning(
            "Recipe validation failed: %s – returning recipe with warnings.",
            validation["errors"],
        )
        # Still return the recipe but log for monitoring

    logger.info("Recipe generated: '%s'", recipe.title)
    return recipe


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
