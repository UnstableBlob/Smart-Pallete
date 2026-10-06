# Smart Palette – Backend

AI-powered cooking assistant backend built with **FastAPI + YOLO-World + Groq LLM**.

## Architecture

```
frontend_new/
    → POST /api/v1/detect          → YOLO-World detection
    → POST /api/v1/inventory/confirm → save confirmed scan
    → POST /api/v1/recipes/generate  → Groq LLM recipe
    → POST /api/v1/inventory/consume → deduct after cooking
```

## Quick Start

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Configure environment
cp .env.example .env
# Edit .env and set GROQ_API_KEY

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The server starts at **http://localhost:8000**  
API docs at **http://localhost:8000/docs**

## Configuration

Edit `backend/.env`:

| Variable | Description | Default |
|---|---|---|
| `GROQ_API_KEY` | Groq API key (get from console.groq.com) | — |
| `GROQ_MODEL` | LLM model name | `llama-3.1-70b-versatile` |
| `YOLO_CONFIDENCE_THRESHOLD` | Detection confidence cutoff | `0.30` |
| `DATABASE_URL` | SQLite or PostgreSQL URL | `sqlite:///./smart_palette.db` |
| `CORS_ORIGINS` | Frontend origins (comma-separated) | `http://localhost:5173,...` |

## API Endpoints

### Detection
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/detect` | Scan image with YOLO-World |
| `POST` | `/api/v1/vision/scan` | Alias (frontend compat) |

### Inventory
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/inventory` | List all items |
| `POST` | `/api/v1/inventory` | Add item |
| `PUT` | `/api/v1/inventory/{id}` | Update item |
| `DELETE` | `/api/v1/inventory/{id}` | Delete item |
| `POST` | `/api/v1/inventory/confirm` | Save scan results |
| `POST` | `/api/v1/inventory/consume` | Deduct after cooking |
| `GET` | `/api/v1/inventory/priority` | Zero-waste sorted list |

### Recipes
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/recipes/generate` | Generate recipe via LLM |
| `POST` | `/api/v1/recipes/validate` | Validate recipe |

### Health
| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Root / status |
| `GET` | `/health` | Model loaded + version |

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app + lifespan
│   ├── api/
│   │   ├── detection.py     # /detect endpoints
│   │   ├── inventory.py     # /inventory endpoints
│   │   └── recipes.py       # /recipes endpoints
│   ├── services/
│   │   ├── detector.py      # YOLO-World singleton
│   │   ├── counting.py      # Aggregate detections
│   │   ├── constraint_engine.py  # Diet/allergy rules
│   │   ├── recipe_generator.py   # Groq LLM integration
│   │   ├── recipe_validator.py   # Recipe validation
│   │   └── inventory_service.py  # DB CRUD + zero-waste
│   ├── schemas/
│   │   ├── detection.py     # Pydantic models
│   │   ├── inventory.py
│   │   └── recipe.py
│   ├── database/
│   │   ├── database.py      # SQLAlchemy engine
│   │   └── models.py        # ORM models
│   └── config/
│       ├── settings.py      # All config from .env
│       └── ingredients.json # Vocabulary + perishability
├── tests/
│   └── test_api.py
├── requirements.txt
├── .env.example
└── Dockerfile
```

## Running Tests

```bash
source venv/bin/activate
pytest tests/ -v
```

## Ingredient Vocabulary

Defined in `app/config/ingredients.json`. Currently 26 classes:
- egg, tomato, onion, potato, carrot, capsicum, spinach, mushroom
- apple, banana, lemon, milk, bread, cheese, paneer, peas, corn
- cucumber, garlic, ginger, broccoli, butter, yogurt, pasta, rice, chicken

Expand by adding to the `ingredients` array – no code changes needed.
