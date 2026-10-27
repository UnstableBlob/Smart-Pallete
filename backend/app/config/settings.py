"""
Smart Palette Backend
Configuration settings loaded from environment variables.
"""
import json
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend root
_backend_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(_backend_root / ".env")

# ── Paths ──────────────────────────────────────────────────────────────────
APP_DIR = Path(__file__).resolve().parent.parent          # backend/app
CONFIG_DIR = APP_DIR / "config"
MODELS_DIR = APP_DIR / "models"

# ── Load ingredient vocabulary ─────────────────────────────────────────────
with open(CONFIG_DIR / "ingredients.json") as _f:
    _ingredient_config = json.load(_f)

INGREDIENT_CLASSES: list[str] = _ingredient_config["ingredients"]
PERISHABILITY_MAP: dict[str, str] = _ingredient_config.get("perishability", {})
DIETARY_RESTRICTIONS: dict[str, list[str]] = _ingredient_config.get("dietary_restrictions", {})

# ── YOLO ───────────────────────────────────────────────────────────────────
YOLO_MODEL_NAME: str = os.getenv("YOLO_MODEL_NAME", "yolov8s-worldv2.pt")
YOLO_MODEL_PATH: Path = MODELS_DIR / YOLO_MODEL_NAME
if not YOLO_MODEL_PATH.exists():
    bundled_model_path = _backend_root / YOLO_MODEL_NAME
    if bundled_model_path.exists():
        YOLO_MODEL_PATH = bundled_model_path
YOLO_CONFIDENCE_THRESHOLD: float = float(os.getenv("YOLO_CONFIDENCE_THRESHOLD", "0.12"))
YOLO_MAX_IMAGE_SIZE_MB: float = float(os.getenv("YOLO_MAX_IMAGE_SIZE_MB", "10"))

# ── Groq / LLM ─────────────────────────────────────────────────────────────
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")

# ── Database ───────────────────────────────────────────────────────────────
DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{_backend_root}/smart_palette.db")

# ── Server ─────────────────────────────────────────────────────────────────
BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

# ── CORS ───────────────────────────────────────────────────────────────────
_cors_raw: str = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
)
CORS_ORIGINS: list[str] = [o.strip() for o in _cors_raw.split(",") if o.strip()]
