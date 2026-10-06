"""
Smart Palette – YOLO-World detector service.

Loads yolov8s-worldv2.pt ONCE at startup, then exposes `detect(image_bytes)`
for synchronous inference.  The model is stored as a module-level singleton so
FastAPI's lifespan event can initialise it before the first request arrives.
"""
import io
import logging
import time
from pathlib import Path

from PIL import Image

from app.config.settings import (
    INGREDIENT_CLASSES,
    YOLO_CONFIDENCE_THRESHOLD,
    YOLO_MODEL_NAME,
    YOLO_MODEL_PATH,
)

logger = logging.getLogger(__name__)

# ── Singleton holder ───────────────────────────────────────────────────────
_model = None
_model_version: str = ""


def load_model() -> None:
    """
    Download (if necessary) and load YOLO-World model into memory.
    Called once during application startup.
    """
    global _model, _model_version

    try:
        from ultralytics import YOLO  # type: ignore

        model_path = str(YOLO_MODEL_PATH) if YOLO_MODEL_PATH.exists() else YOLO_MODEL_NAME
        logger.info("Loading YOLO model: %s", model_path)
        _model = YOLO(model_path)

        # Set the ingredient vocabulary for open-vocabulary detection
        _model.set_classes(INGREDIENT_CLASSES)
        _model_version = YOLO_MODEL_NAME
        logger.info(
            "YOLO model loaded with %d ingredient classes: %s",
            len(INGREDIENT_CLASSES),
            INGREDIENT_CLASSES,
        )
    except Exception as exc:
        logger.error("Failed to load YOLO model: %s", exc, exc_info=True)
        # Allow backend to start without YOLO – detection will return an error
        _model = None


def is_model_loaded() -> bool:
    return _model is not None


def get_model_version() -> str:
    return _model_version


def detect(
    image_bytes: bytes,
    confidence_threshold: float | None = None,
) -> tuple[list[dict], float]:
    """
    Run YOLO-World inference on the supplied image bytes.

    Returns
    -------
    detections : list[dict]
        Each dict has keys: name, confidence, bbox  (raw, per-instance).
    inference_time_ms : float
    """
    if _model is None:
        raise RuntimeError("YOLO model not loaded. Call load_model() first.")

    conf = confidence_threshold if confidence_threshold is not None else YOLO_CONFIDENCE_THRESHOLD

    # Decode bytes → PIL image
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    t0 = time.perf_counter()
    results = _model.predict(image, conf=conf, verbose=False)
    inference_time_ms = (time.perf_counter() - t0) * 1000

    detections: list[dict] = []
    for result in results:
        if result.boxes is None:
            continue
        boxes = result.boxes
        for i in range(len(boxes)):
            cls_id = int(boxes.cls[i].item())
            conf_score = float(boxes.conf[i].item())
            bbox = boxes.xyxy[i].tolist()   # [x1, y1, x2, y2]
            name = INGREDIENT_CLASSES[cls_id] if cls_id < len(INGREDIENT_CLASSES) else str(cls_id)
            detections.append(
                {"name": name, "confidence": conf_score, "bbox": bbox}
            )

    logger.info(
        "Inference done in %.1f ms – %d raw detections", inference_time_ms, len(detections)
    )
    return detections, inference_time_ms
