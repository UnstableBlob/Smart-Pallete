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

# ── Detection Vocabulary and Canonical Mapping ─────────────────────────────
DETECTION_PROMPTS: list[str] = [
    # Bottles, jars, cans, containers
    "bottle", "glass bottle", "green glass bottle", "water bottle", "sauce bottle",
    "condiment bottle", "milk bottle", "milk carton", "jar", "glass jar",
    "tin can", "can", "canned food", "food container", "container",
    # Dairy & Eggs
    "egg", "eggs", "cheese", "cheese block", "cheese wheel", "butter", "yogurt", "paneer",
    # Vegetables
    "tomato", "cherry tomato", "fresh tomato", "capsicum", "bell pepper", "green bell pepper",
    "yellow bell pepper", "red bell pepper", "cucumber", "carrot", "carrots", "onion",
    "potato", "garlic", "ginger", "broccoli", "mushroom", "peas", "corn", "spinach",
    "lettuce", "cabbage", "leafy greens", "radish",
    # Fruits
    "apple", "banana", "lemon", "yellow lemon", "lime", "orange", "oranges",
    "grapes", "green grapes", "red grapes", "strawberry",
    # Bakery / Protein / Prepared
    "bread", "sliced bread", "sandwich", "chicken", "meat"
]

CANONICAL_NAME_MAP: dict[str, str] = {
    "green glass bottle": "bottle",
    "glass bottle": "bottle",
    "water bottle": "bottle",
    "sauce bottle": "sauce",
    "condiment bottle": "sauce",
    "milk bottle": "milk",
    "milk carton": "milk",
    "glass jar": "jar",
    "tin can": "can",
    "canned food": "can",
    "food container": "container",
    "eggs": "egg",
    "cheese block": "cheese",
    "cheese wheel": "cheese",
    "cherry tomato": "tomato",
    "fresh tomato": "tomato",
    "bell pepper": "capsicum",
    "green bell pepper": "capsicum",
    "yellow bell pepper": "capsicum",
    "red bell pepper": "capsicum",
    "carrots": "carrot",
    "leafy greens": "lettuce",
    "greens": "lettuce",
    "yellow lemon": "lemon",
    "lime": "lemon",
    "oranges": "orange",
    "green grapes": "grapes",
    "red grapes": "grapes",
    "sliced bread": "bread",
    "sandwich": "bread",
}

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

        # Set the rich ingredient vocabulary for open-vocabulary detection
        _model.set_classes(DETECTION_PROMPTS)
        _model_version = YOLO_MODEL_NAME
        logger.info(
            "YOLO model loaded with %d open-vocabulary detection prompts",
            len(DETECTION_PROMPTS),
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
    imgsz: int = 1024,
) -> tuple[list[dict], float]:
    """
    Run YOLO-World inference on the supplied image bytes with high-recall
    multi-scale detection and class-agnostic NMS.

    Returns
    -------
    detections : list[dict]
        Each dict has keys: name, raw_name, confidence, bbox  (raw, per-instance).
    inference_time_ms : float
    """
    if _model is None:
        raise RuntimeError("YOLO model not loaded. Call load_model() first.")

    conf = confidence_threshold if confidence_threshold is not None else YOLO_CONFIDENCE_THRESHOLD

    # Decode bytes → PIL image
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    t0 = time.perf_counter()
    # Primary inference with class-agnostic NMS to eliminate overlapping synonyms
    results = _model.predict(
        image,
        conf=conf,
        imgsz=imgsz,
        agnostic_nms=True,
        iou=0.45,
        verbose=False,
    )

    # Adaptive recall fallback for dim / heavily occluded fridge shots
    first_boxes = results[0].boxes if results else None
    if (first_boxes is None or len(first_boxes) < 3) and confidence_threshold is None and conf > 0.08:
        logger.info("Low detection count (%d) at conf=%.2f, running adaptive pass at conf=0.08",
                    len(first_boxes) if first_boxes is not None else 0, conf)
        adaptive_results = _model.predict(
            image,
            conf=0.08,
            imgsz=imgsz,
            agnostic_nms=True,
            iou=0.45,
            verbose=False,
        )
        if adaptive_results and adaptive_results[0].boxes is not None and len(adaptive_results[0].boxes) > len(first_boxes or []):
            results = adaptive_results

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
            raw_name = DETECTION_PROMPTS[cls_id] if cls_id < len(DETECTION_PROMPTS) else str(cls_id)
            canonical_name = CANONICAL_NAME_MAP.get(raw_name, raw_name)
            detections.append(
                {
                    "name": canonical_name,
                    "raw_name": raw_name,
                    "confidence": conf_score,
                    "bbox": bbox,
                }
            )

    logger.info(
        "Inference done in %.1f ms – %d raw detections", inference_time_ms, len(detections)
    )
    return detections, inference_time_ms
