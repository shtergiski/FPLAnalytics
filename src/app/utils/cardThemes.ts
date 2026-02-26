// Card Theme Presets
export interface CardTheme {
  id: string;
  name: string;
  gradient: string;
  headerColor: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
}

export const cardThemes: CardTheme[] = [
  {
    id: 'cyan-purple',
    name: 'Cyan to Purple (Default)',
    gradient: 'from-cyan-600 via-blue-500 to-purple-600',
    headerColor: 'text-white',
    textColor: 'text-white',
    accentColor: 'bg-cyan-500',
    borderColor: 'border-white',
  },
  {
    id: 'red-theme',
    name: 'Fire Red',
    gradient: 'from-red-600 via-orange-500 to-yellow-500',
    headerColor: 'text-white',
    textColor: 'text-white',
    accentColor: 'bg-red-500',
    borderColor: 'border-white',
  },
  {
    id: 'green-theme',
    name: 'Emerald Green',
    gradient: 'from-emerald-600 via-green-500 to-teal-500',
    headerColor: 'text-white',
    textColor: 'text-white',
    accentColor: 'bg-emerald-500',
    borderColor: 'border-white',
  },
  {
    id: 'purple-theme',
    name: 'Royal Purple',
    gradient: 'from-purple-600 via-violet-500 to-fuchsia-600',
    headerColor: 'text-white',
    textColor: 'text-white',
    accentColor: 'bg-purple-500',
    borderColor: 'border-white',
  },
  {
    id: 'blue-theme',
    name: 'Ocean Blue',
    gradient: 'from-blue-600 via-sky-500 to-cyan-500',
    headerColor: 'text-white',
    textColor: 'text-white',
    accentColor: 'bg-blue-500',
    borderColor: 'border-white',
  },
  {
    id: 'dark-theme',
    name: 'Dark Mode',
    gradient: 'from-gray-900 via-gray-800 to-gray-900',
    headerColor: 'text-cyan-400',
    textColor: 'text-gray-100',
    accentColor: 'bg-cyan-500',
    borderColor: 'border-cyan-400',
  },
  {
    id: 'gold-theme',
    name: 'Golden Hour',
    gradient: 'from-yellow-600 via-amber-500 to-orange-500',
    headerColor: 'text-white',
    textColor: 'text-white',
    accentColor: 'bg-yellow-500',
    borderColor: 'border-white',
  },
  {
    id: 'pink-theme',
    name: 'Hot Pink',
    gradient: 'from-pink-600 via-rose-500 to-red-500',
    headerColor: 'text-white',
    textColor: 'text-white',
    accentColor: 'bg-pink-500',
    borderColor: 'border-white',
  },
];

export const getThemeById = (id: string): CardTheme => {
  return cardThemes.find(t => t.id === id) || cardThemes[0];
};

// Local Storage utilities for saving/loading card designs
export interface SavedCardDesign {
  id: string;
  name: string;
  builderType: string;
  data: any;
  theme: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'fpl_saved_card_designs';

export const saveCardDesign = (design: Omit<SavedCardDesign, 'id' | 'createdAt' | 'updatedAt'>): SavedCardDesign => {
  const designs = getSavedDesigns();
  const newDesign: SavedCardDesign = {
    ...design,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  designs.push(newDesign);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
  return newDesign;
};

export const getSavedDesigns = (): SavedCardDesign[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const getDesignById = (id: string): SavedCardDesign | null => {
  const designs = getSavedDesigns();
  return designs.find(d => d.id === id) || null;
};

export const updateCardDesign = (id: string, updates: Partial<SavedCardDesign>): boolean => {
  const designs = getSavedDesigns();
  const index = designs.findIndex(d => d.id === id);
  
  if (index === -1) return false;
  
  designs[index] = {
    ...designs[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
  return true;
};

export const deleteCardDesign = (id: string): boolean => {
  const designs = getSavedDesigns();
  const filtered = designs.filter(d => d.id !== id);
  
  if (filtered.length === designs.length) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
};

// Twitter share utility
export const shareToTwitter = (text: string, hashtags: string[] = ['FPL', 'FantasyPL']): void => {
  const twitterUrl = new URL('https://twitter.com/intent/tweet');
  twitterUrl.searchParams.append('text', text);
  twitterUrl.searchParams.append('hashtags', hashtags.join(','));
  twitterUrl.searchParams.append('via', 'FPL_Dave_');
  
  window.open(twitterUrl.toString(), '_blank', 'width=600,height=400');
};
