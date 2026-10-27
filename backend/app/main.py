"""
Smart Palette – FastAPI Application Entry Point.

Startup lifecycle:
  1. Create DB tables (SQLite auto-init)
  2. Load YOLO-World model into memory (once)
  3. Register API routers
  4. Enable CORS for the frontend
"""
import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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


def _error_response(request: Request, status_code: int, code: str, message: str) -> JSONResponse:
    request_id = str(uuid.uuid4())
    logger.error("[%s] API error %s %s %s", request_id, code, request.method, request.url.path)
    return JSONResponse(
        status_code=status_code,
        content={"code": code, "message": message, "request_id": request_id},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, dict) else {}
    code = detail.get("code", f"HTTP_{exc.status_code}")
    message = detail.get("message", str(exc.detail))
    return _error_response(request, exc.status_code, code, message)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return _error_response(request, 422, "VALIDATION_ERROR", "Request validation failed.")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled API exception: %s", exc)
    return _error_response(request, 500, "INTERNAL_SERVER_ERROR", "An unexpected server error occurred.")

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
