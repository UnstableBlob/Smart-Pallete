export const INGREDIENT_EMOJIS: Record<string, string> = {
  broccoli: '🥦',
  spinach: '🥬',
  lettuce: '🥬',
  cabbage: '🥬',
  greens: '🥬',
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
  orange: '🍊',
  grapes: '🍇',
  strawberry: '🍓',
  bread: '🍞',
  cheese: '🧀',
  paneer: '🧀',
  pasta: '🍝',
  'olive oil': '🫒',
  butter: '🧈',
  chicken: '🍗',
  meat: '🥩',
  rice: '🍚',
  peas: '🫛',
  corn: '🌽',
  cucumber: '🥒',
  radish: '🥕',
  ginger: '🫚',
  yogurt: '🥣',
  'sour cream': '🥣',
  bottle: '🍾',
  sauce: '🥫',
  jar: '🫙',
  can: '🥫',
  container: '🍱',
};

export const getIngredientEmoji = (name: string): string => {
  const lower = name.toLowerCase().trim();
  for (const [key, emoji] of Object.entries(INGREDIENT_EMOJIS)) {
    if (lower.includes(key) || key.includes(lower)) return emoji;
  }
  return '🥗';
};

export const getIngredientCategory = (name: string): string => {
  const lower = name.toLowerCase().trim();
  if (/milk|cheese|butter|yogurt|paneer|cream|egg/.test(lower)) return 'Dairy';
  if (/chicken|meat|beef|pork|fish|seafood|tofu/.test(lower)) return 'Meat/Seafood';
  if (/bread|toast|bagel|croissant|bun|loaf/.test(lower)) return 'Bakery';
  if (/sauce|ketchup|mustard|mayo|dressing|jar|condiment|can|pickle/.test(lower)) return 'Condiments';
  if (/rice|pasta|flour|oil|vinegar|salt|pepper|sugar/.test(lower)) return 'Pantry Staples';
  if (/bottle|water|juice|drink|beverage/.test(lower)) return 'Pantry Staples';
  return 'Produce';
};
