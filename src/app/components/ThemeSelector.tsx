import React from 'react';
import { Card } from './ui/card';
import { cardThemes, CardTheme } from '../utils/cardThemes';

interface ThemeSelectorProps {
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
}

export function ThemeSelector({ selectedTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
      <h4 className="text-sm font-bold text-gray-900 mb-3">🎨 Card Theme</h4>
      <div className="grid grid-cols-4 gap-2">
        {cardThemes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={`relative p-3 rounded-lg transition-all ${
              selectedTheme === theme.id 
                ? 'ring-4 ring-indigo-500 scale-105' 
                : 'hover:scale-105'
            }`}
          >
            <div className={`h-12 rounded-md bg-gradient-to-r ${theme.gradient} mb-2`}></div>
            <div className="text-xs font-medium text-gray-700 text-center">{theme.name}</div>
            {selectedTheme === theme.id && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs">
                ✓
              </div>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}
