import type { PantryItem, Recipe } from '../types';

export const INGREDIENT_EMOJIS: Record<string, string> = {
  broccoli: '🥦',
  spinach: '🥬',
  tomato: '🍅',
  tomatoes: '🍅',
  egg: '🥚',
  eggs: '🥚',
  milk: '🥛',
  garlic: '🧄',
  onion: '🧅',
  onions: '🧅',
  potato: '🥔',
  potatoes: '🥔',
  carrot: '🥕',
  carrots: '🥕',
  capsicum: '🫑',
  'bell pepper': '🫑',
  mushroom: '🍄',
  mushrooms: '🍄',
  apple: '🍎',
  banana: '🍌',
  lemon: '🍋',
  bread: '🍞',
  cheese: '🧀',
  paneer: '🧀',
  pasta: '🍝',
  'olive oil': '🫒',
  butter: '🧈',
  chicken: '🍗',
  rice: '🍚',
  peas: '🫛',
  corn: '🌽',
  cucumber: '🥒',
  ginger: '🫚',
  yogurt: '🥣',
  'sour cream': '🥣',
};

export const getIngredientEmoji = (name: string): string => {
  const lower = name.toLowerCase().trim();
  for (const [key, emoji] of Object.entries(INGREDIENT_EMOJIS)) {
    if (lower.includes(key) || key.includes(lower)) {
      return emoji;
    }
  }
  return '🥗';
};

// Initial pantry stock adhering to Section 3.5 blueprint
export const INITIAL_PANTRY_STOCK: PantryItem[] = [
  {
    id: 'p-1',
    name: 'Spinach',
    quantity: 200,
    unit: 'grams',
    category: 'Produce',
    addedAt: '2 days ago',
    expiryDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0], // within 24h
    emoji: '🥬',
  },
  {
    id: 'p-2',
    name: 'Tomatoes',
    quantity: 3,
    unit: 'pcs',
    category: 'Produce',
    addedAt: '3 days ago',
    expiryDate: new Date(Date.now() + 36 * 3600 * 1000).toISOString().split('T')[0], // within 36h
    emoji: '🍅',
  },
  {
    id: 'p-3',
    name: 'Milk',
    quantity: 500,
    unit: 'ml',
    category: 'Dairy',
    addedAt: '4 days ago',
    expiryDate: new Date(Date.now() + 40 * 3600 * 1000).toISOString().split('T')[0], // within 40h
    emoji: '🥛',
  },
  {
    id: 'p-4',
    name: 'Broccoli',
    quantity: 1,
    unit: 'head',
    category: 'Produce',
    addedAt: '2 days ago',
    expiryDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    emoji: '🥦',
  },
  {
    id: 'p-5',
    name: 'Garlic',
    quantity: 6,
    unit: 'pcs',
    category: 'Produce',
    addedAt: '5 days ago',
    expiryDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    emoji: '🧄',
  },
  {
    id: 'p-6',
    name: 'Pasta',
    quantity: 400,
    unit: 'grams',
    category: 'Pantry Staples',
    addedAt: '1 week ago',
    expiryDate: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0],
    emoji: '🍝',
  },
  {
    id: 'p-7',
    name: 'Eggs',
    quantity: 6,
    unit: 'pcs',
    category: 'Dairy',
    addedAt: '3 days ago',
    expiryDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    emoji: '🥚',
  },
  {
    id: 'p-8',
    name: 'Butter',
    quantity: 150,
    unit: 'grams',
    category: 'Dairy',
    addedAt: '4 days ago',
    expiryDate: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString().split('T')[0],
    emoji: '🧈',
  },
  {
    id: 'p-9',
    name: 'Bread',
    quantity: 4,
    unit: 'slices',
    category: 'Bakery',
    addedAt: '1 day ago',
    expiryDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    emoji: '🍞',
  },
  {
    id: 'p-10',
    name: 'Cheese',
    quantity: 120,
    unit: 'grams',
    category: 'Dairy',
    addedAt: '3 days ago',
    expiryDate: new Date(Date.now() + 8 * 24 * 3600 * 1000).toISOString().split('T')[0],
    emoji: '🧀',
  },
  {
    id: 'p-11',
    name: 'Onions',
    quantity: 3,
    unit: 'pcs',
    category: 'Produce',
    addedAt: '6 days ago',
    expiryDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
    emoji: '🧅',
  },
  {
    id: 'p-12',
    name: 'Olive Oil',
    quantity: 250,
    unit: 'ml',
    category: 'Pantry Staples',
    addedAt: '2 weeks ago',
    expiryDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0],
    emoji: '🫒',
  },
  {
    id: 'p-13',
    name: 'Plain Yogurt',
    quantity: 200,
    unit: 'grams',
    category: 'Dairy',
    addedAt: '2 days ago',
    expiryDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
    emoji: '🥣',
  },
  {
    id: 'p-14',
    name: 'Mushrooms',
    quantity: 150,
    unit: 'grams',
    category: 'Produce',
    addedAt: '1 day ago',
    expiryDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
    emoji: '🍄',
  },
];

// Curated recipes adhering to Section 3.3 and 3.4
export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec_101',
    title: 'Garlic Butter Spinach Pasta',
    description: 'A comforting, silky pasta tossed with wilted baby spinach, aromatic garlic cloves, and golden butter.',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281290?auto=format&fit=crop&w=800&q=80',
    matchScore: 100,
    matchType: 'zero-waste',
    cookTimeMinutes: 15,
    spiceLevel: 'Medium',
    difficulty: 'Easy',
    servings: 2,
    dietaryTags: ['Vegetarian', 'Under 20 Mins'],
    utilizedIngredients: ['Spinach', 'Garlic', 'Pasta', 'Butter'],
    ingredients: [
      { name: 'Pasta', quantity: 200, unit: 'grams', inStock: true },
      { name: 'Fresh Spinach', quantity: 150, unit: 'grams', inStock: true },
      { name: 'Garlic Cloves', quantity: 4, unit: 'pcs', inStock: true },
      { name: 'Butter', quantity: 40, unit: 'grams', inStock: true },
      { name: 'Olive Oil', quantity: 1, unit: 'tbsp', inStock: true },
      { name: 'Black Pepper', quantity: 'to taste', inStock: true },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Bring a pot of salted water to boil. Add pasta and cook until al dente (approx. 8 minutes).',
        timerSeconds: 480,
        neededIngredients: [
          { name: 'Pasta', amount: '200g' },
        ],
      },
      {
        stepNumber: 2,
        instruction: 'Sauté chopped garlic and spinach in olive oil until wilted.',
        timerSeconds: 180,
        neededIngredients: [
          { name: '2 cloves Garlic (Minced)', amount: '2 cloves' },
          { name: '200g Fresh Spinach', amount: '200g' },
        ],
      },
      {
        stepNumber: 3,
        instruction: 'Melt remaining butter into the pan with garlic. Swirl to create an emulsion with a splash of pasta cooking water.',
        timerSeconds: 120,
        neededIngredients: [
          { name: 'Butter', amount: '40g' },
        ],
      },
      {
        stepNumber: 4,
        instruction: 'Transfer drained pasta into the skillet. Toss vigorously for 1 minute until glossily coated.',
        timerSeconds: 60,
      },
      {
        stepNumber: 5,
        instruction: 'Plate hot into warm bowls. Top with cracked black pepper and shaved cheese if desired. Enjoy immediately!',
      },
    ],
  },
  {
    id: 'rec_102',
    title: 'Spinach Tomato Egg Toast',
    description: 'Golden toasted bread topped with quick-seared cherry tomatoes, garlicky spinach, and tender eggs.',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    matchScore: 100,
    matchType: 'zero-waste',
    cookTimeMinutes: 12,
    spiceLevel: 'Mild',
    difficulty: 'Easy',
    servings: 2,
    dietaryTags: ['Vegetarian', 'Under 20 Mins', 'Keto'],
    utilizedIngredients: ['Eggs', 'Tomatoes', 'Spinach', 'Bread'],
    ingredients: [
      { name: 'Eggs', quantity: 3, unit: 'pcs', inStock: true },
      { name: 'Tomatoes', quantity: 2, unit: 'pcs', inStock: true },
      { name: 'Spinach', quantity: 80, unit: 'grams', inStock: true },
      { name: 'Bread', quantity: 2, unit: 'slices', inStock: true },
      { name: 'Butter', quantity: 15, unit: 'grams', inStock: true },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Dice tomatoes and roughly chop fresh spinach leaves.',
      },
      {
        stepNumber: 2,
        instruction: 'Melt a dab of butter in a skillet. Crack eggs and scramble gently over medium-low heat.',
        timerSeconds: 150,
        neededIngredients: [
          { name: 'Eggs', amount: '3 pcs' },
          { name: 'Butter', amount: '15g' },
        ],
      },
      {
        stepNumber: 3,
        instruction: 'Add diced tomatoes and spinach to the pan. Sauté for 2 minutes until tomatoes soften slightly.',
        timerSeconds: 120,
        neededIngredients: [
          { name: 'Tomatoes', amount: '2 pcs' },
          { name: 'Spinach', amount: '80g' },
        ],
      },
      {
        stepNumber: 4,
        instruction: 'Toast artisan bread slices to a golden crisp.',
        timerSeconds: 90,
        neededIngredients: [
          { name: 'Bread', amount: '2 slices' },
        ],
      },
      {
        stepNumber: 5,
        instruction: 'Spoon the warm egg and vegetable scramble evenly onto the toast and season with salt and pepper.',
      },
    ],
  },
  {
    id: 'rec_103',
    title: 'Creamy Garlic Mushroom Omelette',
    description: 'Fluffy golden omelette folded over tender sautéed button mushrooms with melted cheese.',
    imageUrl: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80',
    matchScore: 92,
    matchType: 'quick-run',
    cookTimeMinutes: 14,
    spiceLevel: 'Mild',
    difficulty: 'Easy',
    servings: 1,
    dietaryTags: ['Keto', 'Gluten-Free', 'Under 20 Mins', 'Vegetarian'],
    utilizedIngredients: ['Eggs', 'Mushrooms', 'Butter', 'Cheese'],
    missingItems: ['Sour Cream'],
    substitutes: [
      {
        missing: 'Sour Cream',
        use: 'Plain Yogurt in pantry',
      },
    ],
    ingredients: [
      { name: 'Eggs', quantity: 3, unit: 'pcs', inStock: true },
      { name: 'Mushrooms', quantity: 120, unit: 'grams', inStock: true },
      { name: 'Cheese', quantity: 40, unit: 'grams', inStock: true },
      { name: 'Butter', quantity: 20, unit: 'grams', inStock: true },
      { name: 'Sour Cream', quantity: 1, unit: 'tbsp', inStock: false },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Slice mushrooms evenly. Heat butter in non-stick pan over medium heat.',
      },
      {
        stepNumber: 2,
        instruction: 'Sauté mushrooms until deep golden brown and fragrant.',
        timerSeconds: 240,
        neededIngredients: [
          { name: 'Mushrooms', amount: '120g' },
          { name: 'Butter', amount: '20g' },
        ],
      },
      {
        stepNumber: 3,
        instruction: 'Whisk eggs with a spoonful of yogurt (substitute for sour cream). Pour into pan around mushrooms.',
        timerSeconds: 120,
        neededIngredients: [
          { name: 'Eggs', amount: '3 pcs' },
          { name: 'Plain Yogurt', amount: '1 tbsp' },
        ],
      },
      {
        stepNumber: 4,
        instruction: 'Sprinkle cheese across the center. Fold gently and slide onto plate.',
        timerSeconds: 45,
        neededIngredients: [
          { name: 'Cheese', amount: '40g' },
        ],
      },
    ],
  },
  {
    id: 'rec_104',
    title: 'Broccoli & Tomato Frittata Bake',
    description: 'Nutrient-packed crustless vegetable frittata featuring charred broccoli florets and juicy tomatoes.',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
    matchScore: 94,
    matchType: 'quick-run',
    cookTimeMinutes: 22,
    spiceLevel: 'Medium',
    difficulty: 'Medium',
    servings: 3,
    dietaryTags: ['Keto', 'Gluten-Free', 'Vegetarian'],
    utilizedIngredients: ['Broccoli', 'Tomatoes', 'Eggs', 'Garlic'],
    missingItems: ['Heavy Cream'],
    substitutes: [
      {
        missing: 'Heavy Cream',
        use: 'Milk + melted butter in pantry',
      },
    ],
    ingredients: [
      { name: 'Eggs', quantity: 5, unit: 'pcs', inStock: true },
      { name: 'Broccoli', quantity: 1, unit: 'head', inStock: true },
      { name: 'Tomatoes', quantity: 2, unit: 'pcs', inStock: true },
      { name: 'Garlic', quantity: 2, unit: 'cloves', inStock: true },
      { name: 'Milk', quantity: 60, unit: 'ml', inStock: true },
      { name: 'Heavy Cream', quantity: 40, unit: 'ml', inStock: false },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Preheat oven to 190°C (375°F). Cut broccoli into bite-sized bite florets.',
      },
      {
        stepNumber: 2,
        instruction: 'Flash-sear broccoli and sliced tomatoes in oven-safe skillet for 4 minutes.',
        timerSeconds: 240,
        neededIngredients: [
          { name: 'Broccoli', amount: '1 head' },
          { name: 'Tomatoes', amount: '2 pcs' },
        ],
      },
      {
        stepNumber: 3,
        instruction: 'Whisk eggs with milk and a knob of butter. Season with salt and pepper.',
        neededIngredients: [
          { name: 'Eggs', amount: '5 pcs' },
          { name: 'Milk', amount: '60ml' },
        ],
      },
      {
        stepNumber: 4,
        instruction: 'Pour egg mixture over veggies and bake until puffed and golden.',
        timerSeconds: 720,
      },
    ],
  },
  {
    id: 'rec_105',
    title: 'Rustic Garlic Tomato Bruschetta',
    description: 'Crunchy toasted bread rubbed with raw garlic, smothered in marinaded diced tomatoes and olive oil.',
    imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=800&q=80',
    matchScore: 100,
    matchType: 'zero-waste',
    cookTimeMinutes: 10,
    spiceLevel: 'Mild',
    difficulty: 'Easy',
    servings: 2,
    dietaryTags: ['Vegan', 'Under 20 Mins'],
    utilizedIngredients: ['Tomatoes', 'Garlic', 'Bread', 'Olive Oil'],
    ingredients: [
      { name: 'Tomatoes', quantity: 3, unit: 'pcs', inStock: true },
      { name: 'Garlic', quantity: 2, unit: 'cloves', inStock: true },
      { name: 'Bread', quantity: 4, unit: 'slices', inStock: true },
      { name: 'Olive Oil', quantity: 2, unit: 'tbsp', inStock: true },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Finely dice fresh ripe tomatoes and combine with olive oil, salt, and pepper in a bowl.',
        timerSeconds: 120,
        neededIngredients: [
          { name: 'Tomatoes', amount: '3 pcs' },
          { name: 'Olive Oil', amount: '2 tbsp' },
        ],
      },
      {
        stepNumber: 2,
        instruction: 'Grill or toast bread slices until deeply golden and crunchy.',
        timerSeconds: 180,
        neededIngredients: [
          { name: 'Bread', amount: '4 slices' },
        ],
      },
      {
        stepNumber: 3,
        instruction: 'Rub peeled garlic clove over hot toasted surface to infuse subtle garlic aroma.',
        neededIngredients: [
          { name: 'Garlic', amount: '2 cloves' },
        ],
      },
      {
        stepNumber: 4,
        instruction: 'Pile tomato mixture generously on top and drizzle remaining oil. Serve immediately.',
      },
    ],
  },
];

// Sample test photos for camera simulator (if no camera or user prefers simulated shelf)
export const SAMPLE_FRIDGE_PHOTOS = [
  {
    id: 'sample-1',
    title: 'Veggie & Produce Shelf',
    url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=1000&q=80',
    detectedItems: [
      { name: 'Spinach', quantity: 1, unit: 'heads', category: 'Produce', confidence: 0.94 },
      { name: 'Tomatoes', quantity: 4, unit: 'pcs', category: 'Produce', confidence: 0.92 },
      { name: 'Broccoli', quantity: 2, unit: 'heads', category: 'Produce', confidence: 0.89 },
      { name: 'Carrots', quantity: 3, unit: 'pcs', category: 'Produce', confidence: 0.85 },
      { name: 'Eggs', quantity: 6, unit: 'pcs', category: 'Dairy', confidence: 0.96 },
    ],
  },
  {
    id: 'sample-2',
    title: 'Dairy & Kitchen Staples',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80',
    detectedItems: [
      { name: 'Milk', quantity: 1, unit: 'pcs', category: 'Dairy', confidence: 0.95 },
      { name: 'Cheese', quantity: 1, unit: 'pcs', category: 'Dairy', confidence: 0.91 },
      { name: 'Eggs', quantity: 8, unit: 'pcs', category: 'Dairy', confidence: 0.97 },
      { name: 'Butter', quantity: 1, unit: 'pcs', category: 'Dairy', confidence: 0.88 },
      { name: 'Mushrooms', quantity: 200, unit: 'grams', category: 'Produce', confidence: 0.86 },
    ],
  },
];
