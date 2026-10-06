"""
Smart Palette – FastAPI Application Entry Point.

Startup lifecycle:
  1. Create DB tables (SQLite auto-init)
  2. Load YOLO-World model into memory (once)
  3. Register API routers
  4. Enable CORS for the frontend
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import CORS_ORIGINS, DEBUG

# ── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if DEBUG else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan ───────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup:  initialise DB + load YOLO model.
    Shutdown: nothing special needed (SQLite handles it).
    """
    logger.info("=== Smart Palette backend starting ===")

    # 1. Create database tables
    from app.database.database import create_all_tables
    create_all_tables()
    logger.info("Database tables ensured.")

    # 2. Load YOLO-World (blocking, but happens only once)
    from app.services.detector import load_model
    logger.info("Loading YOLO-World model – this may take a moment...")
    load_model()

    logger.info("=== Smart Palette backend ready ===")
    yield
    logger.info("=== Smart Palette backend shutting down ===")


# ── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Smart Palette API",
    description=(
        "AI-powered cooking assistant backend. "
        "Detects ingredients via YOLO-World and generates recipes via LLM."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────
from app.api import detection, inventory, recipes  # noqa: E402

API_PREFIX = "/api/v1"
app.include_router(detection.router, prefix=API_PREFIX, tags=["Detection"])
app.include_router(inventory.router, prefix=API_PREFIX, tags=["Inventory"])
app.include_router(recipes.router, prefix=API_PREFIX, tags=["Recipes"])


# ── Health / root ──────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "service": "Smart Palette API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health", tags=["Health"])
def health():
    from app.services.detector import is_model_loaded, get_model_version
    return {
        "status": "healthy",
        "model_loaded": is_model_loaded(),
        "model_version": get_model_version(),
    }
