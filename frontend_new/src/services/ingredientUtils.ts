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
    if (lower.includes(key) || key.includes(lower)) return emoji;
  }
  return '🥗';
};
