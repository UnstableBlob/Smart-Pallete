"""
Smart Palette – Basic API tests.
Run with: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient

# Patch detector to avoid loading the YOLO model during tests
import app.services.detector as _detector_module
_detector_module._model = object()   # non-None sentinel
_detector_module._model_version = "test-mock"

from app.main import app  # noqa: E402

client = TestClient(app)


def test_root():
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["service"] == "Smart Palette API"
    assert data["status"] == "running"


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True


def test_get_inventory_empty():
    resp = client.get("/api/v1/inventory")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_add_and_delete_inventory_item():
    payload = {"name": "test_tomato", "quantity": 3, "unit": "pcs"}
    resp = client.post("/api/v1/inventory", json=payload)
    assert resp.status_code == 201
    item = resp.json()
    assert item["name"] == "test_tomato"
    item_id = item["id"]

    # Delete it
    del_resp = client.delete(f"/api/v1/inventory/{item_id}")
    assert del_resp.status_code == 204


def test_confirm_inventory():
    payload = {
        "items": [
            {"name": "spinach", "quantity": 200, "unit": "grams"},
            {"name": "egg", "quantity": 4, "unit": "pcs"},
        ]
    }
    resp = client.post("/api/v1/inventory/confirm", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2


def test_pantry_inventory_alias():
    resp = client.get("/api/v1/pantry/inventory")
    assert resp.status_code == 200
    data = resp.json()
    assert "activeStock" in data
    assert "expiringSoon" in data


def test_recipe_generate_empty_inventory():
    payload = {"inventory": [], "servings": 2}
    resp = client.post("/api/v1/recipes/generate", json=payload)
    # Should return 422 due to empty inventory constraint
    assert resp.status_code == 422


def test_recipe_validate():
    recipe_payload = {
        "recipe": {
            "title": "Test Recipe",
            "servings": 2,
            "preparation_time_minutes": 15,
            "ingredients": [
                {"name": "tomato", "quantity": 2, "unit": "pcs", "in_stock": True}
            ],
            "steps": [
                {"step_number": 1, "instruction": "Chop tomatoes."}
            ],
            "dietary_tags": [],
            "match_score": 100,
            "match_type": "zero-waste",
            "missing_items": [],
            "utilized_ingredients": ["tomato"],
        },
        "inventory": [{"name": "tomato", "quantity": 3}],
        "servings": 2,
    }
    resp = client.post("/api/v1/recipes/validate", json=recipe_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "valid" in data
    assert "errors" in data
