import { create } from 'zustand';
import { api } from '../services/api';
import { getIngredientEmoji } from '../services/ingredientUtils';
import type { PantryItem, ProfilePreferences, Recipe, ToastMessage } from '../types';

interface AppState {
  // Active Scan Buffer
  isScanning: boolean;
  setIsScanning: (isScanning: boolean) => void;
  detectedBuffer: PantryItem[];
  setDetectedBuffer: (items: PantryItem[]) => void;
  updateDetectedItem: (id: string, updates: Partial<PantryItem>) => void;
  removeDetectedItem: (id: string) => void;
  addDetectedItem: (item: Omit<PantryItem, 'id' | 'addedAt'>) => void;

  // Active Pantry Inventory
  pantryStock: PantryItem[];
  setPantryStock: (stock: PantryItem[]) => void;
  addPantryItem: (item: Omit<PantryItem, 'id' | 'addedAt'>) => Promise<void>;
  updatePantryItem: (id: string, updates: Partial<PantryItem>) => Promise<void>;
  deletePantryItem: (id: string) => Promise<void>;

  // Recipes & Bookmarks
  recipes: Recipe[];
  setRecipes: (recipes: Recipe[]) => void;
  bookmarkedRecipeIds: string[];
  toggleBookmark: (recipeId: string) => void;

  // Active Cooking Session
  activeRecipe: Recipe | null;
  currentStepIndex: number;
  setActiveRecipe: (recipe: Recipe | null) => void;
  setCurrentStepIndex: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeMeal: (recipeId: string, usedIngredients?: Array<{ name: string; quantity: number | string }>) => void;

  // User Preferences
  userProfile: ProfilePreferences;
  setUserProfile: (profile: Partial<ProfilePreferences>) => void;

  // Flash & Camera options
  torchEnabled: boolean;
  toggleTorch: () => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

const STORAGE_KEY = 'smart_palette_store_v1';

const getInitialSavedState = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load saved state', e);
  }
  return null;
};

const savedState = getInitialSavedState();

export const useAppStore = create<AppState>((set, get) => ({
  isScanning: false,
  setIsScanning: (isScanning) => set({ isScanning }),
  detectedBuffer: [],
  setDetectedBuffer: (items) => set({ detectedBuffer: items }),
  updateDetectedItem: (id, updates) =>
    set((state) => ({
      detectedBuffer: state.detectedBuffer.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
  removeDetectedItem: (id) =>
    set((state) => ({
      detectedBuffer: state.detectedBuffer.filter((item) => item.id !== id),
    })),
  addDetectedItem: (item) =>
    set((state) => ({
      detectedBuffer: [
        ...state.detectedBuffer,
        {
          ...item,
          id: `det-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          addedAt: 'Just now',
          emoji: item.emoji || getIngredientEmoji(item.name),
        },
      ],
    })),

  pantryStock: [],
  setPantryStock: (pantryStock) => {
    set({ pantryStock });
    persistStore();
  },
  addPantryItem: async (item) => {
    const savedItem = await api.addStockItem(item);
    set((state) => ({ pantryStock: [savedItem, ...state.pantryStock] }));
    get().addToast(`Added ${item.name} to pantry`, 'success');
    persistStore();
  },
  updatePantryItem: async (id, updates) => {
    const savedItem = await api.updateStockItem(id, updates);
    set((state) => ({
      pantryStock: state.pantryStock.map((item) =>
        item.id === id ? { ...item, ...updates, id: String(savedItem.id) } : item
      ),
    }));
    get().addToast('Pantry item updated', 'info');
    persistStore();
  },
  deletePantryItem: async (id) => {
    const itemToDelete = get().pantryStock.find((i) => i.id === id);
    await api.deleteStockItem(id);
    set((state) => ({
      pantryStock: state.pantryStock.filter((item) => item.id !== id),
    }));
    if (itemToDelete) {
      get().addToast(`Removed ${itemToDelete.name}`, 'warning');
    }
    persistStore();
  },

  recipes: [],
  setRecipes: (recipes) => set({ recipes }),
  bookmarkedRecipeIds: savedState?.bookmarkedRecipeIds || ['rec_101'],
  toggleBookmark: (recipeId) => {
    const current = get().bookmarkedRecipeIds;
    const exists = current.includes(recipeId);
    const updated = exists ? current.filter((id) => id !== recipeId) : [...current, recipeId];
    set({ bookmarkedRecipeIds: updated });
    get().addToast(exists ? 'Removed from bookmarks' : 'Added to bookmarks', 'info');
    persistStore();
  },

  activeRecipe: null,
  currentStepIndex: 0,
  setActiveRecipe: (recipe) => set({ activeRecipe: recipe, currentStepIndex: 0 }),
  setCurrentStepIndex: (index) => set({ currentStepIndex: index }),
  nextStep: () => {
    const { activeRecipe, currentStepIndex } = get();
    if (activeRecipe && currentStepIndex < activeRecipe.steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    }
  },
  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },
  completeMeal: (_recipeId, usedIngredients) => {
    // Deduct stock if ingredients were matched
    const currentStock = [...get().pantryStock];
    if (usedIngredients && usedIngredients.length > 0) {
      usedIngredients.forEach((used) => {
        const matchIdx = currentStock.findIndex(
          (p) => p.name.toLowerCase().includes(used.name.toLowerCase()) ||
                 used.name.toLowerCase().includes(p.name.toLowerCase())
        );
        if (matchIdx !== -1) {
          const item = currentStock[matchIdx];
          const qtyUsed = typeof used.quantity === 'number' ? used.quantity : 1;
          const nextQty = Math.max(0, item.quantity - qtyUsed);
          if (nextQty === 0) {
            currentStock.splice(matchIdx, 1);
          } else {
            currentStock[matchIdx] = { ...item, quantity: nextQty };
          }
        }
      });
      set({ pantryStock: currentStock });
    }
    get().addToast('Meal completed! Inventory updated.', 'success');
    persistStore();
  },

  userProfile: savedState?.userProfile || {
    dietaryRestrictions: ['vegan', 'gluten-free'],
    spiceLevel: 1, // Medium
    cookingSpeed: 'quick',
    defaultServings: 2,
    theme: 'light',
  },
  setUserProfile: (updates) => {
    set((state) => {
      const nextProfile = { ...state.userProfile, ...updates };
      // Apply theme class to document element
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', nextProfile.theme);
      }
      return { userProfile: nextProfile };
    });
    get().addToast('Preferences saved successfully', 'success');
    persistStore();
  },

  torchEnabled: false,
  toggleTorch: () => set((s) => ({ torchEnabled: !s.torchEnabled })),

  toasts: [],
  addToast: (message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 3500);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

function persistStore() {
  if (typeof window === 'undefined') return;
  try {
    const state = useAppStore.getState();
    const toSave = {
      pantryStock: state.pantryStock,
      bookmarkedRecipeIds: state.bookmarkedRecipeIds,
      userProfile: state.userProfile,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to persist store', e);
  }
}

// Initial theme setup on load
if (typeof document !== 'undefined') {
  const currentTheme = savedState?.userProfile?.theme || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
}
