"""
Smart Palette – Pydantic schemas for detection API.
"""
from pydantic import BaseModel, Field


class DetectedIngredient(BaseModel):
    """Single ingredient detected by YOLO-World."""
    name: str
    count: int = Field(ge=1, description="Number of instances detected")
    confidence: float = Field(ge=0.0, le=1.0)
    bbox: list[float] | None = Field(default=None, description="Bounding box [x1,y1,x2,y2]")


class DetectionResponse(BaseModel):
    """Response from POST /api/v1/detect."""
    success: bool
    request_id: str
    inference_time_ms: float | None = None
    model_version: str | None = None
    ingredients: list[DetectedIngredient] = []
    error: dict | None = None
