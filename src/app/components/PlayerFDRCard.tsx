import React, { useState } from 'react';
import { Upload, X, RefreshCw } from 'lucide-react';
import type { Player, PlayerFixture } from '../types/fpl';

interface PlayerFDRCardProps {
  player: Player;
  fixtures: PlayerFixture[];
  onClose?: () => void;
}

// Official FPL FDR Colors (from fantasy.premierleague.com)
const getDifficultyColor = (difficulty: number): string => {
  switch (difficulty) {
    case 1: return 'bg-[#375523]'; // Dark green - Very Easy
    case 2: return 'bg-[#01FC7A]'; // Bright green - Easy
    case 3: return 'bg-[#E7E7E7]'; // Light gray - Moderate
    case 4: return 'bg-[#FF1751]'; // Red - Difficult
    case 5: return 'bg-[#861134]'; // Dark red - Very Difficult
    default: return 'bg-[#E7E7E7]';
  }
};

const getDifficultyTextColor = (difficulty: number): string => {
  switch (difficulty) {
    case 1: return 'text-white';
    case 2: return 'text-[#375523]';
    case 3: return 'text-[#375523]';
    default: return 'text-white';
  }
};

export function PlayerFDRCard({ player, fixtures, onClose }: PlayerFDRCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Ensure we have 6 fixtures
  const displayFixtures = [...fixtures];
  while (displayFixtures.length < 6) {
    displayFixtures.push({
      gameweek: 0,
      opponent: '-',
      difficulty: 0,
      isHome: true
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 p-6 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Player Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 border-white/30 relative">
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-all hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            <button
              className="absolute top-4 left-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-all hover:scale-110"
              title="Cycle difficulty"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Image Upload Area */}
            <div className="aspect-[3/4] bg-white/20 rounded-2xl mb-6 flex items-center justify-center overflow-hidden relative group cursor-pointer">
              {imageUrl ? (
                <img src={imageUrl} alt={player.web_name} className="w-full h-full object-cover" />
              ) : (
                <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                  <Upload className="w-16 h-16 text-purple-400 mb-3" />
                  <span className="text-white/80 font-semibold mb-1">Add Player</span>
                  <span className="text-white/60 text-sm">Click or drag image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
              {imageUrl && (
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-semibold">Change Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Player Info */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black text-white mb-2">
                {player.first_name} {player.second_name}
              </h2>
            </div>

            {/* Price & Ownership */}
            <div className="bg-purple-700 rounded-2xl py-4 px-6 mb-3">
              <div className="flex items-center justify-between">
                <div className="text-4xl font-black text-white">
                  £{(player.now_cost / 10).toFixed(1)}m
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {player.selected_by_percent}%
                  </div>
                  <div className="text-xs text-white/80">Ownership</div>
                </div>
              </div>
            </div>
          </div>

          {/* FDR Panel */}
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white text-center mb-8">
              FIXTURE DIFFICULTY RATING
            </h1>

            {displayFixtures.slice(0, 6).map((fixture, index) => (
              <div
                key={index}
                className={`${getDifficultyColor(fixture.difficulty)} rounded-2xl py-6 px-6 transition-all hover:scale-105 cursor-pointer shadow-xl`}
              >
                <div className={`text-sm font-semibold ${getDifficultyTextColor(fixture.difficulty)} opacity-80 mb-1`}>
                  GW {fixture.gameweek || '-'}
                </div>
                <div className={`text-2xl font-black ${getDifficultyTextColor(fixture.difficulty)}`}>
                  {fixture.opponent === '-' ? '-' : `${fixture.opponent} (${fixture.isHome ? 'H' : 'A'})`}
                </div>
              </div>
            ))}

            <p className="text-center text-white/80 text-sm italic mt-6">
              Click fixtures to cycle difficulty
            </p>
          </div>
        </div>

        {/* Branding */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">⚽</span>
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
            <div className="font-bold text-gray-900 text-sm">Fantasy</div>
            <div className="text-xs text-gray-600 leading-tight">Football Elite</div>
          </div>
        </div>
      </div>
    </div>
  );
}
