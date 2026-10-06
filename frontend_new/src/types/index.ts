export type UnitType = 'pcs' | 'grams' | 'heads' | 'ml' | 'slices' | 'tbsp' | 'cups' | 'kg';

export type CategoryType = 'Produce' | 'Dairy' | 'Pantry Staples' | 'Meat/Seafood' | 'Bakery' | 'Condiments';

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: CategoryType | string;
  addedAt: string;
  expiryDate?: string;
  confidence?: number;
  emoji?: string;
}

export interface BoundingBox {
  name: string;
  confidence: number;
  bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] or [x, y, w, h]
  color?: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: number | string;
  unit?: string;
  inStock?: boolean;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  timerSeconds?: number;
  neededIngredients?: Array<{
    name: string;
    amount: string;
  }>;
}

export interface SubstituteInfo {
  missing: string;
  use: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  matchScore: number; // 100 for zero-waste, 90+ for quick-run
  matchType: 'zero-waste' | 'quick-run';
  cookTimeMinutes: number;
  spiceLevel: 'Mild' | 'Medium' | 'Hot' | 'Extra Hot';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  servings: number;
  dietaryTags: string[];
  utilizedIngredients: string[];
  missingItems?: string[];
  substitutes?: SubstituteInfo[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface ProfilePreferences {
  dietaryRestrictions: string[]; // 'vegan' | 'gluten-free' | 'nut-allergy' | etc.
  spiceLevel: number; // 0: Mild, 1: Medium, 2: Hot, 3: Extra Hot
  cookingSpeed: 'quick' | 'medium' | 'leisurely';
  defaultServings: number;
  theme: 'light' | 'dark';
}

export interface FilterState {
  searchQuery: string;
  selectedTag: string; // 'All' | 'Keto' | 'Vegan' | 'Gluten-Free' | 'Under 20 Mins'
  tab: 'zero-waste' | 'quick-run';
  maxCookTime?: number;
  difficulty?: string;
  spiceLevel?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  duration?: number;
}
