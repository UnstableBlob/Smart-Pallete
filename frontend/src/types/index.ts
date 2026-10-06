export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryHours?: number; // expiry in hours (e.g. 12, 24, 48, etc.)
  addedDate: string;
  confidence?: number;  // vision confidence score (e.g., 0.92)
}

export interface Substitution {
  missing: string;
  suggestedSubstitute: string;
}

export interface Recipe {
  id: string;
  title: string;
  matchType: 'Zero-Waste' | 'Quick Run';
  matchPercentage: number;
  prepTimeMinutes: number;
  spiceLevel: 'Low' | 'Medium' | 'High';
  usedIngredients: string[];
  missingIngredients: string[];
  substitutions: Substitution[];
  instructions: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  image: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  date: string;
  xpEarned: number;
  cuisine: string;
}

export interface RestockItem {
  id: string;
  name: string;
  emoji: string;
  consumptionRate: string; // e.g. "Every 5 days"
}

export interface TasteProfile {
  spiceTolerance: number; // 1 to 5
  cuisines: {
    Italian: number; // percentage/weight (e.g. 80)
    Mexican: number;
    Asian: number;
    Western: number;
    Indian: number;
  };
  preferredCookingTimeLimit: number; // minutes
}
