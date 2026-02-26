import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ExportablePlayerCard } from './ExportablePlayerCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Search, Download, TrendingUp, Target, Award, Zap, Calendar } from 'lucide-react';
import { Player } from '../types/fpl';
import { useFPLStore } from '../store/fpl-store';

interface PlayerCardsGalleryProps {
  players: Player[];
}

export function PlayerCardsGallery({ players }: PlayerCardsGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'top' | 'form' | 'value'>('all');
  const { getPlayerFixtures } = useFPLStore();

  // Filter players based on category
  const filteredPlayers = useMemo(() => {
    let filtered = players;

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.web_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.team_name!.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (filterCategory) {
      case 'top':
        // Top scorers
        filtered = [...filtered].sort((a, b) => b.total_points - a.total_points).slice(0, 20);
        break;
      case 'form':
        // In form players
        filtered = [...filtered]
          .filter(p => parseFloat(p.form) > 0)
          .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
          .slice(0, 20);
        break;
      case 'value':
        // Best value (points per million)
        filtered = [...filtered]
          .filter(p => p.total_points > 20)
          .sort((a, b) => {
            const aValue = a.total_points / (a.now_cost / 10);
            const bValue = b.total_points / (b.now_cost / 10);
            return bValue - aValue;
          })
          .slice(0, 20);
        break;
      default:
        // Show top 50 by default
        filtered = [...filtered].sort((a, b) => b.total_points - a.total_points).slice(0, 50);
    }

    return filtered;
  }, [players, searchQuery, filterCategory]);

  const positionColors = {
    1: { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-700' },
    2: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-700' },
    3: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-700' },
    4: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-700' },
  };

  const PlayerMiniCard = ({ player }: { player: Player }) => {
    const colors = positionColors[player.element_type as keyof typeof positionColors];
    const priceChange = player.cost_change_start / 10;

    return (
      <Card
        className={`p-4 cursor-pointer hover:shadow-lg transition-all border-2 ${colors.border} hover:scale-105`}
        onClick={() => setSelectedPlayer(player)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`w-12 h-12 ${colors.bg} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
            {player.web_name.substring(0, 2).toUpperCase()}
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">£{(player.now_cost / 10).toFixed(1)}m</div>
            {priceChange !== 0 && (
              <div className={`text-xs font-semibold ${priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}m
              </div>
            )}
          </div>
        </div>

        <div className="mb-2">
          <div className="font-bold text-gray-900 truncate">{player.web_name}</div>
          <div className="text-sm text-gray-600">{player.team_name}</div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center">
            <div className="text-xs text-gray-500">Points</div>
            <div className="font-bold text-purple-600">{player.total_points}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Form</div>
            <div className="font-bold text-blue-600">{player.form}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Own%</div>
            <div className="font-bold text-gray-700">{player.selected_by_percent}%</div>
          </div>
        </div>

        <Button size="sm" className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
          <Download className="w-3 h-3 mr-2" />
          Export Card
        </Button>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Player Cards Gallery</h2>
          <p className="text-gray-600">Export shareable player cards for social media</p>
        </div>
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-semibold text-gray-700">
            {filteredPlayers.length} cards available
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={filterCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('all')}
            >
              <Target className="w-4 h-4 mr-2" />
              All
            </Button>
            <Button
              variant={filterCategory === 'top' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('top')}
            >
              <Award className="w-4 h-4 mr-2" />
              Top Scorers
            </Button>
            <Button
              variant={filterCategory === 'form' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('form')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              In Form
            </Button>
            <Button
              variant={filterCategory === 'value' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('value')}
            >
              <Zap className="w-4 h-4 mr-2" />
              Best Value
            </Button>
          </div>
        </div>
      </Card>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPlayers.map(player => (
          <PlayerMiniCard key={player.id} player={player} />
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <Card className="p-12 text-center">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No players found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </Card>
      )}

      {/* Export Dialog */}
      <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export Player Card</DialogTitle>
            <DialogDescription>
              Share this player card on social media to showcase their stats and upcoming fixtures.
            </DialogDescription>
          </DialogHeader>
          {selectedPlayer && (
            <div className="mt-4">
              <ExportablePlayerCard
                player={selectedPlayer}
                fixtures={getPlayerFixtures(selectedPlayer.id, 5).map(f => ({
                  opponent: f.opponent || '',
                  difficulty: f.difficulty || 3,
                  isHome: f.isHome || false,
                }))}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}