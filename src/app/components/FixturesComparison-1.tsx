import React, { useState, useRef, useEffect } from 'react';
import { Upload, RefreshCw, X, Download } from 'lucide-react';
import { Button } from './ui/button';
import { toPng } from 'html-to-image';
import type { Player, PlayerFixture } from '../types/fpl';
import { PlayerCombobox } from './ui/player-combobox';
import { Loading } from './ui/loading';
import { useFPLStore } from '../store/fpl-store';

interface FixturesComparisonProps {
  players: Player[];
  getPlayerFixtures: (playerId: number) => PlayerFixture[];
  startGW?: number;
  endGW?: number;
}

const getDifficultyColor = (difficulty: number): string => {
  // Official FPL FDR Colors
  switch (difficulty) {
    case 1:
      return 'bg-[#01FC7C]'; // Dark Green
    case 2:
      return 'bg-[#00FF87]'; // Light Green
    case 3:
      return 'bg-gray-400'; // Gray
    case 4:
      return 'bg-[#FF1751]'; // Pink/Red
    case 5:
      return 'bg-[#861134]'; // Dark Red
    default:
      return 'bg-gray-300'; // Neutral
  }
};

export function FixturesComparison({ 
  players, 
  getPlayerFixtures,
  startGW = 28,
  endGW = 33
}: FixturesComparisonProps) {
  const { bootstrap, fetchBootstrapData } = useFPLStore();
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);

  const maxPlayers = 4;

  // Load bootstrap data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!bootstrap) {
        setLoading(true);
        await fetchBootstrapData();
        setLoading(false);
      }
    };
    loadData();
  }, [bootstrap, fetchBootstrapData]);

  const handleAddPlayer = (player: Player | null) => {
    if (player && selectedPlayers.length < maxPlayers && !selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleRemovePlayer = (playerId: number) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId));
  };

  const calculateAverageFDR = (fixtures: PlayerFixture[], start: number, end: number): number => {
    const relevantFixtures = fixtures.filter(f => f.gameweek >= start && f.gameweek <= end);
    if (relevantFixtures.length === 0) return 0;
    const sum = relevantFixtures.reduce((acc, f) => acc + (f.difficulty || 0), 0);
    return sum / relevantFixtures.length;
  };

  const exportAsPNG = async () => {
    if (!comparisonRef.current) return;
    try {
      const dataUrl = await toPng(comparisonRef.current, { 
        quality: 1.0, 
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
      const link = document.createElement('a');
      link.download = `FPL_Fixtures_Comparison_GW${startGW}-${endGW}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 p-6">
      {/* Export Button */}
      {selectedPlayers.length > 0 && (
        <div className="fixed top-20 right-6 z-50">
          <Button
            onClick={exportAsPNG}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Export PNG
          </Button>
        </div>
      )}

      <div ref={comparisonRef} className="pb-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            FIXTURES COMPARISON
          </h1>
          <p className="text-xl font-semibold text-white/90">
            Gameweek {startGW} - {endGW}
          </p>
        </div>

        {/* Player Selection Grid */}
        {selectedPlayers.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {Array.from({ length: maxPlayers }).map((_, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border-2 border-white/30"
              >
                <div className="aspect-square bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <Upload className="w-16 h-16 text-white/60" />
                </div>
                <p className="text-center text-white/80 text-sm mb-2">
                  No Player Selected
                </p>
                <div className="mt-4">
                  <PlayerCombobox
                    players={players}
                    value={null}
                    onSelect={handleAddPlayer}
                    placeholder="Search player..."
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {selectedPlayers.map((player) => {
              const fixtures = getPlayerFixtures(player.id);
              // Get next 5 fixtures from the current gameweek
              const next5Fixtures = fixtures.slice(0, 5);
              const avgFDR = next5Fixtures.length > 0 
                ? next5Fixtures.reduce((acc, f) => acc + (f.difficulty || 0), 0) / next5Fixtures.length 
                : 0;
              
              return (
                <div key={player.id} className="space-y-3">
                  {/* Player Card */}
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border-2 border-white/30 relative">
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    <div className="aspect-square bg-white/20 rounded-2xl flex items-center justify-center mb-3 overflow-hidden">
                      <img
                        src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`}
                        alt={player.web_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div class="text-center"><div class="w-12 h-12 text-purple-400 mx-auto mb-2">👤</div></div>';
                        }}
                      />
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-white uppercase tracking-wide">
                        {player.web_name}
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="bg-purple-700 rounded-2xl py-3 text-center">
                    <div className="text-2xl font-bold text-white">
                      £{(player.now_cost / 10).toFixed(1)}m
                    </div>
                  </div>

                  {/* Fixtures - Next 5 */}
                  <div className="space-y-2">
                    {next5Fixtures.map((fixture, idx) => (
                      <div
                        key={idx}
                        className={`${getDifficultyColor(fixture.difficulty || 0)} rounded-xl py-3 px-4 text-center transition-transform hover:scale-105 cursor-pointer shadow-md`}
                      >
                        <div className="text-xs font-medium text-gray-700">
                          Gameweek {fixture.gameweek}
                        </div>
                        <div className="text-lg font-black text-gray-900">
                          {fixture.opponent} ({fixture.isHome ? 'H' : 'A'})
                        </div>
                      </div>
                    ))}
                    {next5Fixtures.length === 0 && (
                      <div className="bg-gray-300 rounded-xl py-3 px-4 text-center">
                        <div className="text-sm text-gray-600">No fixtures available</div>
                      </div>
                    )}
                  </div>

                  {/* Average FDR */}
                  <div className="bg-white rounded-2xl py-3 px-4 text-center shadow-lg">
                    <div className="text-xs font-medium text-gray-600 mb-1">Avg FDR (Next 5)</div>
                    <div className="text-2xl font-black text-purple-600">
                      {avgFDR > 0 ? avgFDR.toFixed(2) : '-'}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Add more players if under max */}
            {selectedPlayers.length < maxPlayers && (
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border-2 border-dashed border-white/40 flex items-center justify-center min-h-[300px]">
                  <div className="text-center w-full">
                    <Upload className="w-16 h-16 text-white/40 mx-auto mb-3" />
                    <p className="text-white/70 font-semibold mb-4">Add Another Player</p>
                    <PlayerCombobox
                      players={players}
                      value={null}
                      onSelect={handleAddPlayer}
                      placeholder="Search player..."
                      className="mx-auto max-w-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Watermark */}
        <div className="text-center mt-8">
          <div className="inline-block bg-white/95 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <div className="font-bold text-gray-900 text-lg">@FPL_Dave_</div>
            <div className="text-xs text-gray-600">FPL Analytics</div>
          </div>
        </div>
      </div>
    </div>
  );
}