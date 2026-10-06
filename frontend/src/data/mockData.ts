import { Ingredient, Recipe, HistoryItem, RestockItem, TasteProfile } from '../types';

export const initialIngredients: Ingredient[] = [
  {
    id: 'ing_butter',
    name: 'Butter',
    quantity: 1,
    unit: 'block',
    category: 'Dairy',
    addedDate: '2026-08-01',
    expiryHours: 120, // 5 days
  },
  {
    id: 'ing_garlic',
    name: 'Garlic',
    quantity: 3,
    unit: 'cloves',
    category: 'Produce',
    addedDate: '2026-08-02',
    expiryHours: 72, // 3 days
  },
  {
    id: 'ing_chicken',
    name: 'Chicken Breast',
    quantity: 2,
    unit: 'pcs',
    category: 'Meat',
    addedDate: '2026-07-31',
    expiryHours: 12, // expiring soon! (< 48 hrs)
  },
  {
    id: 'ing_yogurt',
    name: 'Plain Yogurt',
    quantity: 1,
    unit: 'cup',
    category: 'Dairy',
    addedDate: '2026-08-02',
    expiryHours: 36, // expiring soon! (< 48 hrs)
  }
];

export const mockDetectedIngredients: Ingredient[] = [
  { id: 'ing_spinach', name: 'Fresh Spinach', quantity: 1, unit: 'bag', category: 'Produce', confidence: 0.92, addedDate: '2026-08-03' },
  { id: 'ing_milk', name: 'Whole Milk', quantity: 500, unit: 'ml', category: 'Dairy', confidence: 0.88, addedDate: '2026-08-03', expiryHours: 24 }, // expiring soon!
  { id: 'ing_eggs', name: 'Eggs', quantity: 6, unit: 'pcs', category: 'Dairy', confidence: 0.95, addedDate: '2026-08-03' },
  { id: 'ing_cheddar', name: 'Cheddar Cheese', quantity: 200, unit: 'g', category: 'Dairy', confidence: 0.84, addedDate: '2026-08-03', expiryHours: 48 } // expiring soon!
];

export const initialRecipes: Recipe[] = [
  {
    id: 'rec_omelette',
    title: 'Spinach & Cheese Omelette',
    matchType: 'Zero-Waste',
    matchPercentage: 100,
    prepTimeMinutes: 12,
    spiceLevel: 'Low',
    difficulty: 'Easy',
    image: '/images/spinach_omelette.png',
    usedIngredients: ['Eggs', 'Fresh Spinach', 'Cheddar Cheese', 'Butter'],
    missingIngredients: [],
    substitutions: [],
    instructions: [
      'Crack 3 eggs into a bowl. Add a pinch of salt and whisk vigorously until fluffy and uniform.',
      'Sauté the fresh spinach in a skillet with a small dab of butter over medium heat until fully wilted (about 2 minutes).',
      'Pour the whisked eggs directly over the wilted spinach. Gently tilt the pan to cover the bottom evenly.',
      'As the eggs start to set, sprinkle the shredded cheddar cheese over one half of the omelette.',
      'Use a spatula to fold the omelette in half. Cook for another 1 minute, then slide it onto a plate and serve warm!'
    ]
  },
  {
    id: 'rec_pasta',
    title: 'Creamy Garlic Spinach Pasta',
    matchType: 'Quick Run',
    matchPercentage: 90,
    prepTimeMinutes: 20,
    spiceLevel: 'Medium',
    difficulty: 'Medium',
    image: '/images/spinach_pasta.png',
    usedIngredients: ['Fresh Spinach', 'Whole Milk', 'Butter'],
    missingIngredients: ['Penne Pasta', 'Garlic'],
    substitutions: [
      { missing: 'Heavy Cream', suggestedSubstitute: 'Whole Milk + Butter (in pantry)' }
    ],
    instructions: [
      'Fill a large pot with salted water and bring to a boil. Add penne pasta and cook for 10-12 minutes until al dente.',
      'Meanwhile, peel and finely mince the garlic cloves.',
      'Melt 1 tablespoon of butter in a saucepan over medium heat. Add the minced garlic and sauté for 1 minute until fragrant.',
      'Add the fresh spinach to the pan and toss until wilted.',
      'Pour in the milk and bring to a simmer. Allow it to reduce slightly to form a light, creamy sauce.',
      'Drain the pasta and toss it directly into the creamy spinach sauce. Mix well, season with salt and pepper, and top with parmesan cheese if available.'
    ]
  },
  {
    id: 'rec_yogurt_dip',
    title: 'Spinach Yogurt Garlic Dip',
    matchType: 'Zero-Waste',
    matchPercentage: 100,
    prepTimeMinutes: 5,
    spiceLevel: 'Low',
    difficulty: 'Easy',
    image: '/images/fridge_interior.png', // Fallback or general image
    usedIngredients: ['Fresh Spinach', 'Plain Yogurt', 'Garlic'],
    missingIngredients: [],
    substitutions: [],
    instructions: [
      'Finely chop the fresh spinach and mince 1 clove of garlic.',
      'In a bowl, combine the plain yogurt, chopped spinach, and minced garlic.',
      'Stir in a pinch of salt and a drizzle of olive oil if available.',
      'Mix thoroughly until smooth and serve cold with crackers or veggies!'
    ]
  },
  {
    id: 'rec_chicken_garlic',
    title: 'Pan-Seared Garlic Butter Chicken',
    matchType: 'Quick Run',
    matchPercentage: 95,
    prepTimeMinutes: 15,
    spiceLevel: 'Low',
    difficulty: 'Easy',
    image: '/images/fridge_interior.png',
    usedIngredients: ['Chicken Breast', 'Garlic', 'Butter'],
    missingIngredients: ['Lemon Juice'],
    substitutions: [
      { missing: 'Lemon Juice', suggestedSubstitute: 'A splash of white vinegar (household basic)' }
    ],
    instructions: [
      'Season the chicken breasts generously with salt, pepper, and garlic powder on both sides.',
      'Heat a skillet over medium-high heat and melt 1 tablespoon of butter.',
      'Sear the chicken breasts for 5-6 minutes on each side until golden-brown and cooked through.',
      'During the last 2 minutes, throw in minced garlic and another tablespoon of butter, spooning the melted garlic butter over the chicken.',
      'Squeeze a splash of vinegar or lemon juice over the chicken to deglaze the pan and serve immediately.'
    ]
  }
];

export const initialHistory: HistoryItem[] = [
  { id: 'h_1', title: 'Cheesy Garlic Pasta', date: '2026-08-01', xpEarned: 15, cuisine: 'Italian' },
  { id: 'h_2', title: 'Yogurt Drizzled Tacos', date: '2026-07-28', xpEarned: 20, cuisine: 'Mexican' },
  { id: 'h_3', title: 'Garlic Butter Asparagus', date: '2026-07-25', xpEarned: 10, cuisine: 'Western' }
];

export const initialRestockList: RestockItem[] = [
  { id: 'r_1', name: 'Eggs', emoji: '🥚', consumptionRate: 'Every 4 days' },
  { id: 'r_2', name: 'Whole Milk', emoji: '🥛', consumptionRate: 'Every 6 days' },
  { id: 'r_3', name: 'Fresh Spinach', emoji: '🥬', consumptionRate: 'Every 5 days' }
];

export const initialTasteProfile: TasteProfile = {
  spiceTolerance: 2,
  cuisines: {
    Italian: 45,
    Mexican: 20,
    Asian: 10,
    Western: 15,
    Indian: 10
  },
  preferredCookingTimeLimit: 25
};

export const ingredientCategories = ['All', 'Produce', 'Dairy', 'Meat', 'Pantry', 'Condiments'];

export const categoryEmojis: Record<string, string> = {
  'Produce': '🥬',
  'Dairy': '🥛',
  'Meat': '🍗',
  'Pantry': '🍝',
  'Condiments': '🌶️',
  'Eggs': '🥚',
  'Other': '🍽️'
};
