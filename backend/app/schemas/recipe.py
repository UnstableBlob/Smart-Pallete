"""
Smart Palette – Pydantic schemas for recipe API.
"""
from pydantic import BaseModel, Field


class RecipeIngredient(BaseModel):
    name: str
    quantity: float | str
    unit: str | None = None
    in_stock: bool | None = None


class RecipeStep(BaseModel):
    step_number: int
    instruction: str
    timer_seconds: int | None = None


class GeneratedRecipe(BaseModel):
    title: str
    description: str | None = None
    servings: int
    preparation_time_minutes: int
    diet: str | None = None
    dietary_tags: list[str] = []
    spice_level: str | None = None
    difficulty: str | None = None
    match_score: int = 100
    match_type: str = "zero-waste"
    image_url: str | None = None
    ingredients: list[RecipeIngredient]
    steps: list[RecipeStep]
    missing_items: list[str] = []
    utilized_ingredients: list[str] = []


class GenerateRecipeRequest(BaseModel):
    """POST /api/v1/recipes/generate"""
    inventory: list[dict] = Field(
        ...,
        description="[{name: str, quantity: float, unit?: str}]"
    )
    servings: int = Field(default=2, ge=1, le=20)
    diet: str | None = None         # "vegetarian" | "vegan" | "gluten-free" | etc.
    allergies: list[str] = []
    max_time_minutes: int | None = None
    budget: str | None = None       # "low" | "medium" | "high"
    cuisine_preference: str | None = None


class ValidateRecipeRequest(BaseModel):
    """POST /api/v1/recipes/validate"""
    recipe: GeneratedRecipe
    inventory: list[dict]
    servings: int = 2
    diet: str | None = None
    allergies: list[str] = []
    max_time_minutes: int | None = None


class ValidationResult(BaseModel):
    valid: bool
    errors: list[str] = []
    warnings: list[str] = []
