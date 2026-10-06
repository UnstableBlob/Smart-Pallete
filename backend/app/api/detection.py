"""
Smart Palette – Detection API Router.

POST /api/v1/detect       – scan an image with YOLO-World
POST /api/v1/vision/scan  – alias for frontend compatibility
"""
import logging
import time
import uuid
from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.settings import YOLO_CONFIDENCE_THRESHOLD, YOLO_MAX_IMAGE_SIZE_MB
from app.schemas.detection import DetectedIngredient, DetectionResponse
from app.services import counting, detector

logger = logging.getLogger(__name__)

router = APIRouter()

_ALLOWED_CONTENT_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/webp", "image/bmp", "image/gif"
}
_MAX_BYTES = int(YOLO_MAX_IMAGE_SIZE_MB * 1024 * 1024)


async def _read_and_validate_image(file: UploadFile) -> bytes:
    """Read upload, validate content type and size, return raw bytes."""
    content_type = (file.content_type or "").lower()
    if content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail={
                "code": "INVALID_FILE_TYPE",
                "message": f"Unsupported file type '{content_type}'. "
                           "Please upload a JPEG, PNG, or WebP image.",
            },
        )

    image_bytes = await file.read()
    if len(image_bytes) > _MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail={
                "code": "IMAGE_TOO_LARGE",
                "message": f"Image exceeds the {YOLO_MAX_IMAGE_SIZE_MB} MB limit.",
            },
        )
    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail={"code": "EMPTY_FILE", "message": "Uploaded file is empty."},
        )
    return image_bytes


@router.post("/detect", response_model=DetectionResponse)
@router.post("/vision/scan", response_model=DetectionResponse)
async def detect_ingredients(
    image: UploadFile = File(..., description="Fridge / pantry image"),
    confidence_threshold: float | None = Form(default=None, ge=0.0, le=1.0),
):
    """
    Run YOLO-World object detection on the uploaded image.

    Returns a structured list of detected ingredients with counts and
    confidence scores, suitable for the user confirmation step.
    """
    request_id = str(uuid.uuid4())
    t_start = time.perf_counter()

    if not detector.is_model_loaded():
        logger.error("[%s] YOLO model not loaded.", request_id)
        return DetectionResponse(
            success=False,
            request_id=request_id,
            error={
                "code": "MODEL_NOT_LOADED",
                "message": "The AI model is still loading. Please retry in a few seconds.",
            },
        )

    # ── Validate image ────────────────────────────────────────────────────
    try:
        image_bytes = await _read_and_validate_image(image)
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("[%s] Image read error: %s", request_id, exc)
        raise HTTPException(
            status_code=400,
            detail={"code": "IMAGE_READ_ERROR", "message": str(exc)},
        )

    # ── Run inference ─────────────────────────────────────────────────────
    try:
        conf = confidence_threshold if confidence_threshold is not None else YOLO_CONFIDENCE_THRESHOLD
        raw_detections, inference_time_ms = detector.detect(image_bytes, conf)
    except Exception as exc:
        logger.error("[%s] Inference error: %s", request_id, exc, exc_info=True)
        return DetectionResponse(
            success=False,
            request_id=request_id,
            error={"code": "INFERENCE_ERROR", "message": "Detection failed. Please retry."},
        )

    # ── Count and aggregate ───────────────────────────────────────────────
    counted = counting.count_detections(raw_detections)

    if not counted:
        return DetectionResponse(
            success=False,
            request_id=request_id,
            inference_time_ms=inference_time_ms,
            model_version=detector.get_model_version(),
            ingredients=[],
            error={
                "code": "NO_INGREDIENTS_DETECTED",
                "message": "No supported ingredients were detected in the image. "
                           "Try a clearer photo or adjust the confidence threshold.",
            },
        )

    ingredients = [
        DetectedIngredient(
            name=item["name"],
            count=item["count"],
            confidence=item["confidence"],
            bbox=item.get("bbox"),
        )
        for item in counted
    ]

    total_ms = (time.perf_counter() - t_start) * 1000
    logger.info(
        "[%s] Detection OK – %d ingredients, %.1f ms total",
        request_id, len(ingredients), total_ms,
    )

    return DetectionResponse(
        success=True,
        request_id=request_id,
        inference_time_ms=inference_time_ms,
        model_version=detector.get_model_version(),
        ingredients=ingredients,
    )
