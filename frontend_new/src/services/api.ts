import type { PantryItem, ProfilePreferences, Recipe } from '../types';
import { getIngredientCategory } from './ingredientUtils';

// In development, the Vite proxy forwards /api → http://localhost:8000
// In production, set VITE_API_URL to the deployed backend URL.
const BASE_URL = import.meta.env.VITE_API_URL || '';


export class ApiError extends Error {
  code: string;
  status?: number;
  endpoint: string;

  constructor(message: string, code: string, endpoint: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.endpoint = endpoint;
  }
}

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
    const method = options?.method || 'GET';
    const requestUrl = `${BASE_URL}${endpoint}`;
    const startedAt = performance.now();
    const requestBody = describeRequestBody(options?.body);
    console.info('[Smart Palette API] CALL', {
      method,
      endpoint,
      url: requestUrl,
      body: requestBody,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const headers = new Headers(options?.headers);
      if (!(options?.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      const res = await fetch(requestUrl, {
        ...options,
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const responseBody = res.status === 204 ? undefined : await readResponseBody(res);
        console.info('[Smart Palette API] RESPONSE', {
          method,
          endpoint,
          status: res.status,
          durationMs: Math.round(performance.now() - startedAt),
          body: responseBody,
        });
        return responseBody as T;
      }
      const responseBody = await readResponseBody(res);
      const errorBody = isErrorBody(responseBody) ? responseBody : {};
      const detail = typeof errorBody.detail === 'object' ? errorBody.detail : undefined;
      const code = errorBody.code || detail?.code || `HTTP_${res.status}`;
      const message = errorBody.message || detail?.message || (typeof errorBody.detail === 'string' ? errorBody.detail : JSON.stringify(responseBody)) || `API error ${res.status}`;
      const error = new ApiError(message, code, endpoint, res.status);
      console.error('[Smart Palette API] ERROR', {
        method,
        endpoint,
        status: res.status,
        durationMs: Math.round(performance.now() - startedAt),
        code: error.code,
        message: error.message,
        requestBody,
        responseBody,
      });
      throw error;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      const isAbort = error instanceof DOMException && error.name === 'AbortError';
      const apiError = new ApiError(
        isAbort ? 'The request timed out.' : 'Could not connect to the backend.',
        isAbort ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
        endpoint,
      );
      console.error('[Smart Palette API] ERROR', {
        method,
        endpoint,
        durationMs: Math.round(performance.now() - startedAt),
        code: apiError.code,
        message: apiError.message,
        requestBody,
        cause: error,
      });
      throw apiError;
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
      error?: { code?: string; message?: string };
    }>('/api/v1/vision/scan', { method: 'POST', body: formData });

    if (!response.success && response.error) {
      const code = response.error.code || 'SCAN_FAILED';
      console.error('[Smart Palette API]', { code, endpoint: '/api/v1/vision/scan', message: response.error.message });
      throw new ApiError(response.error.message || 'Failed to scan image', code, '/api/v1/vision/scan');
    }

    return (response.ingredients || []).map((item, index) => ({
      id: `det-${Date.now()}-${index}`,
      name: item.name,
      quantity: item.count,
      unit: 'pcs',
      category: getIngredientCategory(item.name),
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
   * Section 3.3: POST /api/v1/recipes/generate
   * Fetches zero-waste (100% match) AND quick-run (90%+ match) recipes in parallel.
   * Returns a unified result with recipes from both match types combined.
   */
  async fetchRecipes(
    inventory: PantryItem[],
    profile: ProfilePreferences,
    tab: 'zero-waste' | 'quick-run' = 'zero-waste'
  ): Promise<RecipeGenerationResult> {
    const inventoryPayload = inventory.map(({ name, quantity, unit }) => ({ name, quantity, unit }));
    const spiceLevelLabel = (['Mild', 'Medium', 'Hot', 'Extra Hot'] as const)[profile.spiceLevel] ?? 'Mild';
    const maxTime = profile.cookingSpeed === 'quick' ? 20 : undefined;
    const diet = profile.dietaryRestrictions[0] || undefined;
    const allergies = profile.dietaryRestrictions.filter(
      (item) => item.includes('allergy') || item === 'dairy-free'
    );

    const makeRequest = (matchType: 'zero-waste' | 'quick-run') =>
      this.safeFetch<BackendRecipeResponse>('/api/v1/recipes/generate', {
        method: 'POST',
        body: JSON.stringify({
          inventory: inventoryPayload,
          servings: profile.defaultServings,
          diet,
          allergies,
          spice_level: spiceLevelLabel,
          max_time_minutes: maxTime,
          match_type: matchType,
          count: 3,
        }),
      }).catch((err) => {
        console.warn(`[Smart Palette] fetchRecipes failed for tab "${matchType}":`, err);
        return null;
      });

    // Fetch both tabs in parallel
    const [zeroWasteResult, quickRunResult] = await Promise.all([
      makeRequest('zero-waste'),
      makeRequest('quick-run'),
    ]);

    // Use the requested tab's result as the primary for messages / metadata
    const primary = tab === 'zero-waste' ? zeroWasteResult : quickRunResult;

    const allRecipes: Recipe[] = [
      ...(zeroWasteResult?.recipes?.map((r) => mapRecipe(r, 'zero-waste')) ?? []),
      ...(quickRunResult?.recipes?.map((r) => mapRecipe(r, 'quick-run')) ?? []),
    ];

    return {
      recipes: allRecipes,
      available: (zeroWasteResult?.available || quickRunResult?.available) ?? false,
      message: primary?.message ?? 'No recipes could be generated.',
      suggestedIngredients: primary?.suggested_ingredients ?? [],
      lastResort: primary?.last_resort ?? false,
    };
  }

  /**
   * Section 3.4: POST /api/v1/pantry/deduct-consumed
   */
  async completeMealDeduct(
    _recipeId: string,
    consumed: Array<{ name: string; quantity: number | string; unit?: string }>
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

type ApiResponseBody = Record<string, unknown> | unknown[] | string | number | boolean | null | undefined;

async function readResponseBody(response: Response): Promise<ApiResponseBody> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as ApiResponseBody;
  } catch {
    return text;
  }
}

function isErrorBody(body: ApiResponseBody): body is {
  code?: string;
  message?: string;
  detail?: string | { code?: string; message?: string };
} {
  return typeof body === 'object' && body !== null && !Array.isArray(body);
}

function describeRequestBody(body: BodyInit | null | undefined): ApiResponseBody {
  if (!body) return undefined;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as ApiResponseBody;
    } catch {
      return body;
    }
  }
  if (body instanceof FormData) {
    return Object.fromEntries(
      Array.from(body.entries()).map(([key, value]) => [
        key,
        value instanceof File
          ? { name: value.name, type: value.type, size: value.size, lastModified: value.lastModified }
          : value,
      ])
    );
  }
  if (body instanceof URLSearchParams) return Object.fromEntries(body.entries());
  return `[${body.constructor?.name || 'request body'}]`;
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

interface BackendRecipeResponse {
  recipes: BackendRecipe[];
  available: boolean;
  message: string;
  suggested_ingredients: string[];
  last_resort: boolean;
}

export interface RecipeGenerationResult {
  recipes: Recipe[];
  available: boolean;
  message: string;
  suggestedIngredients: string[];
  lastResort: boolean;
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
