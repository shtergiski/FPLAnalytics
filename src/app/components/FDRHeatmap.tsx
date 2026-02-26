import React from 'react';
import type { PlayerFixture } from '../types/fpl';

interface FDRHeatmapProps {
  fixtures: PlayerFixture[];
  className?: string;
}

const getDifficultyColor = (difficulty: number): string => {
  // Official FPL FDR Colors
  switch (difficulty) {
    case 1:
      return 'bg-[#01FC7C]'; // Dark Green - Very Easy
    case 2:
      return 'bg-[#00FF87]'; // Light Green - Easy
    case 3:
      return 'bg-gray-400'; // Gray - Medium
    case 4:
      return 'bg-[#FF1751]'; // Pink/Red - Hard
    case 5:
      return 'bg-[#861134]'; // Dark Red - Very Hard
    default:
      return 'bg-gray-300'; // Neutral gray - no fixture
  }
};

export function FDRHeatmap({ fixtures, className = '' }: FDRHeatmapProps) {
  // Ensure we always show 5 fixtures (pad with empty if needed)
  const displayFixtures = [...fixtures];
  while (displayFixtures.length < 5) {
    displayFixtures.push({
      gameweek: 0,
      opponent: '-',
      difficulty: 0,
      isHome: true
    });
  }

  return (
    <div className={`flex gap-1 sm:gap-2 ${className}`}>
      {displayFixtures.slice(0, 5).map((fixture, index) => (
        <div
          key={index}
          className={`flex-1 ${getDifficultyColor(fixture.difficulty)} rounded-lg sm:rounded-xl py-2 sm:py-4 px-1 sm:px-3 text-center transition-transform hover:scale-105 cursor-pointer`}
        >
          <div className="text-[10px] sm:text-xs font-medium text-gray-700 mb-0.5 sm:mb-1">
            GW {fixture.gameweek || '-'}
          </div>
          <div className="font-bold text-xs sm:text-sm text-gray-900 truncate px-0.5">
            {fixture.opponent}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-700 mt-0.5">
            ({fixture.isHome ? 'H' : 'A'})
          </div>
        </div>
      ))}
    </div>
  );
}

// Compact version - horizontal strip
export function FDRHeatmapStrip({ fixtures, className = '' }: FDRHeatmapProps) {
  const displayFixtures = [...fixtures];
  while (displayFixtures.length < 5) {
    displayFixtures.push({
      gameweek: 0,
      opponent: '-',
      difficulty: 0,
      isHome: true
    });
  }

  return (
    <div className={`flex gap-1 ${className}`}>
      {displayFixtures.slice(0, 5).map((fixture, index) => (
        <div
          key={index}
          className={`w-12 h-12 ${getDifficultyColor(fixture.difficulty)} rounded-lg flex items-center justify-center transition-all hover:scale-110 cursor-pointer shadow-sm`}
          title={`GW${fixture.gameweek}: ${fixture.opponent} (${fixture.isHome ? 'Home' : 'Away'})`}
        >
          <span className="text-xs font-bold text-gray-900">
            {fixture.opponent}
          </span>
        </div>
      ))}
    </div>
  );
}