import type { PantryItem, ProfilePreferences, Recipe } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface DetectionResult {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  confidence: number;
  bbox?: [number, number, number, number];
}

class ApiService {
  private async safeFetch<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const headers = new Headers(options?.headers);
      if (!(options?.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        if (res.status === 204) return undefined as T;
        return (await res.json()) as T;
      }
      const detail = await res.text();
      throw new Error(detail || `API error ${res.status}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Section 3.1: POST /api/v1/vision/scan or POST /api/v1/detect
   * Analyzes camera frame or uploaded image and returns detected items
   */
  async scanFridgeImage(file: File): Promise<DetectionResult[]> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await this.safeFetch<{
      success: boolean;
      ingredients: Array<{
        name: string;
        count: number;
        confidence: number;
        bbox?: [number, number, number, number];
      }>;
      error?: { message?: string };
    }>('/api/v1/vision/scan', { method: 'POST', body: formData });

    if (!response.success) {
      throw new Error(response.error?.message || 'No ingredients detected');
    }

    return response.ingredients.map((item, index) => ({
      id: `det-${Date.now()}-${index}`,
      name: item.name,
      quantity: item.count,
      unit: 'pcs',
      category: 'Produce',
      confidence: item.confidence,
      bbox: item.bbox,
    }));
  }

  /**
   * Section 3.2: POST /api/v1/pantry/verify-and-sync
   * Syncs verified ingredients to pantry inventory
   */
  async verifyAndSyncPantry(items: PantryItem[]): Promise<{ success: boolean; syncedCount: number }> {
    return this.safeFetch('/api/v1/pantry/verify-and-sync', {
      method: 'POST',
      body: JSON.stringify({
        items: items.map(({ name, quantity, unit, category, expiryDate, confidence }) => ({
          name, quantity, unit, category, expiry_date: expiryDate, confidence,
        })),
      }),
    });
  }

  /**
   * Section 3.3: GET /api/v1/recipes/generate?tab=zero-waste
   * Fetches zero-waste (100% match) or quick-run (90%+ match) recipes
   */
  async fetchRecipes(
    inventory: PantryItem[],
    profile: ProfilePreferences,
    tab: 'zero-waste' | 'quick-run' = 'zero-waste'
  ): Promise<Recipe[]> {
    const recipe = await this.safeFetch<BackendRecipe>('/api/v1/recipes/generate', {
      method: 'POST',
      body: JSON.stringify({
        inventory: inventory.map(({ name, quantity, unit }) => ({ name, quantity, unit })),
        servings: profile.defaultServings,
        diet: profile.dietaryRestrictions[0] || undefined,
        allergies: profile.dietaryRestrictions.filter((item) => item.includes('allergy')),
        max_time_minutes: profile.cookingSpeed === 'quick' ? 20 : undefined,
      }),
    });
    return [mapRecipe(recipe, tab)];
  }

  /**
   * Section 3.4: POST /api/v1/pantry/deduct-consumed
   */
  async completeMealDeduct(
    _recipeId: string,
    consumed: Array<{ name: string; quantity: number | string }>
  ): Promise<{ success: boolean; timestamp: number }> {
    return this.safeFetch('/api/v1/pantry/deduct-consumed', {
      method: 'POST',
      body: JSON.stringify({ consumed }),
    });
  }

  /**
   * Section 3.5: GET /api/v1/pantry/inventory
   */
  async fetchPantryInventory(): Promise<{ activeStock: PantryItem[]; expiringSoon: PantryItem[] }> {
    const response = await this.safeFetch<{ activeStock: BackendInventoryItem[]; expiringSoon: BackendInventoryItem[] }>(
      '/api/v1/pantry/inventory', { method: 'GET' }
    );
    return {
      activeStock: response.activeStock.map(mapInventoryItem),
      expiringSoon: response.expiringSoon.map(mapInventoryItem),
    };
  }

  /**
   * Section 3.5: PATCH /api/v1/pantry/item/:itemId
   */
  async updateStockItem(itemId: string, updates: Partial<Pick<PantryItem, 'name' | 'quantity' | 'unit' | 'category' | 'expiryDate'>>): Promise<BackendInventoryItem> {
    return this.safeFetch(`/api/v1/inventory/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: updates.name,
        quantity: updates.quantity,
        unit: updates.unit,
        category: updates.category,
        expiry_date: updates.expiryDate,
      }),
    });
  }

  async addStockItem(item: Omit<PantryItem, 'id' | 'addedAt'>): Promise<PantryItem> {
    const response = await this.safeFetch<BackendInventoryItem>('/api/v1/inventory', {
      method: 'POST',
      body: JSON.stringify({
        name: item.name, quantity: item.quantity, unit: item.unit,
        category: item.category, expiry_date: item.expiryDate,
      }),
    });
    return mapInventoryItem(response);
  }

  async deleteStockItem(itemId: string): Promise<void> {
    await this.safeFetch(`/api/v1/inventory/${itemId}`, { method: 'DELETE' });
  }

}

interface BackendInventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string | null;
  expiry_date: string | null;
}

interface BackendRecipe {
  title: string;
  description?: string;
  servings: number;
  preparation_time_minutes: number;
  dietary_tags: string[];
  spice_level?: string;
  difficulty?: string;
  match_score: number;
  match_type: 'zero-waste' | 'quick-run';
  image_url?: string;
  ingredients: Array<{ name: string; quantity: number | string; unit?: string; in_stock?: boolean }>;
  steps: Array<{ step_number: number; instruction: string; timer_seconds?: number }>;
  missing_items: string[];
  utilized_ingredients: string[];
}

function mapInventoryItem(item: BackendInventoryItem): PantryItem {
  return {
    id: String(item.id),
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category || 'Pantry Staples',
    addedAt: 'In stock',
    expiryDate: item.expiry_date || undefined,
  };
}

function mapRecipe(recipe: BackendRecipe, tab: 'zero-waste' | 'quick-run'): Recipe {
  return {
    id: `${tab}-${recipe.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    title: recipe.title,
    description: recipe.description,
    imageUrl: recipe.image_url || '',
    matchScore: recipe.match_score,
    matchType: tab,
    cookTimeMinutes: recipe.preparation_time_minutes,
    spiceLevel: (recipe.spice_level || 'Mild') as Recipe['spiceLevel'],
    difficulty: (recipe.difficulty || 'Easy') as Recipe['difficulty'],
    servings: recipe.servings,
    dietaryTags: recipe.dietary_tags,
    utilizedIngredients: recipe.utilized_ingredients,
    missingItems: recipe.missing_items,
    ingredients: recipe.ingredients.map((item) => ({
      name: item.name, quantity: item.quantity, unit: item.unit, inStock: item.in_stock,
    })),
    steps: recipe.steps.map((step) => ({
      stepNumber: step.step_number, instruction: step.instruction, timerSeconds: step.timer_seconds,
    })),
  };
}

export const api = new ApiService();
