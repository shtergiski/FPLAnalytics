import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Search, 
  TrendingUp, 
  TrendingDown,
  Target,
  Activity,
  DollarSign,
  Users,
  Award,
  AlertCircle,
  ChevronRight,
  BarChart3,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { Player } from '../types/fpl';
import { useFPLStore } from '../store/fpl-store';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

interface PlayerStatsProps {
  players: Player[];
}

export function PlayerStats({ players }: PlayerStatsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [filterPosition, setFilterPosition] = useState<number | null>(null);
  const { getPlayerFixtures } = useFPLStore();

  // Filter players
  const filteredPlayers = useMemo(() => {
    let filtered = players;

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.web_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.team_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterPosition) {
      filtered = filtered.filter(p => p.element_type === filterPosition);
    }

    return filtered.sort((a, b) => b.total_points - a.total_points);
  }, [players, searchQuery, filterPosition]);

  const positionNames = {
    1: { name: 'GK', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
    2: { name: 'DEF', color: 'bg-green-500', textColor: 'text-green-700' },
    3: { name: 'MID', color: 'bg-blue-500', textColor: 'text-blue-700' },
    4: { name: 'FWD', color: 'bg-red-500', textColor: 'text-red-700' },
  };

  // Player detail view
  if (selectedPlayer) {
    const { events, currentGameweek } = useFPLStore.getState();
    const totalGameweeks = events.length > 0 ? Math.max(...events.map(e => e.id)) : 38;
    const remainingGameweeks = Math.max(0, totalGameweeks - currentGameweek);
    const fixturesToShow = Math.min(5, remainingGameweeks);
    const fixtures = getPlayerFixtures(selectedPlayer.id, fixturesToShow);
    const priceChange = selectedPlayer.cost_change_start / 10;
    const position = positionNames[selectedPlayer.element_type as keyof typeof positionNames];

    // Prepare chart data
    const performanceData = [
      { name: 'Goals', value: selectedPlayer.goals_scored, fullMark: 20 },
      { name: 'Assists', value: selectedPlayer.assists, fullMark: 20 },
      { name: 'Clean Sheets', value: selectedPlayer.clean_sheets, fullMark: 20 },
      { name: 'Bonus', value: selectedPlayer.bonus, fullMark: 30 },
      { name: 'Form', value: parseFloat(selectedPlayer.form) * 2, fullMark: 20 },
    ];

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Back Button */}
        <Button variant="outline" onClick={() => setSelectedPlayer(null)} className="text-xs sm:text-sm">
          ← Back to Player List
        </Button>

        {/* Player Header - MOBILE OPTIMIZED */}
        <Card className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500">
          <div className="flex flex-col lg:flex-row items-start justify-between text-white gap-4 lg:gap-0">
            <div className="flex-1 w-full">
              <Badge className={`${position.color} mb-2 sm:mb-3 text-xs sm:text-sm`}>
                {position.name}
              </Badge>
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black mb-1 sm:mb-2">{selectedPlayer.web_name}</h1>
              <p className="text-base sm:text-xl lg:text-2xl text-purple-100 mb-3 sm:mb-4">{selectedPlayer.team_name}</p>
              <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:flex lg:items-center lg:gap-6">
                <div>
                  <div className="text-xs sm:text-sm text-purple-200">Price</div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold">£{(selectedPlayer.now_cost / 10).toFixed(1)}m</div>
                  {priceChange !== 0 && (
                    <div className={`text-[10px] sm:text-xs lg:text-sm font-semibold ${priceChange > 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}m
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-purple-200">Ownership</div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{selectedPlayer.selected_by_percent}%</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-purple-200">Form</div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{selectedPlayer.form}</div>
                </div>
              </div>
            </div>
            <div className="text-center lg:text-right w-full lg:w-auto">
              <div className="text-5xl sm:text-6xl lg:text-7xl font-black">{selectedPlayer.total_points}</div>
              <div className="text-sm sm:text-base lg:text-lg text-purple-200">Total Points</div>
            </div>
          </div>
        </Card>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
          <Card className="p-2 sm:p-3 lg:p-4 text-center">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{selectedPlayer.goals_scored}</div>
            <div className="text-[10px] sm:text-xs lg:text-sm text-gray-600">Goals</div>
          </Card>
          <Card className="p-2 sm:p-3 lg:p-4 text-center">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{selectedPlayer.assists}</div>
            <div className="text-[10px] sm:text-xs lg:text-sm text-gray-600">Assists</div>
          </Card>
          <Card className="p-2 sm:p-3 lg:p-4 text-center">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{selectedPlayer.clean_sheets}</div>
            <div className="text-[10px] sm:text-xs lg:text-sm text-gray-600">CS</div>
          </Card>
          <Card className="p-2 sm:p-3 lg:p-4 text-center">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-yellow-600 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{selectedPlayer.bonus}</div>
            <div className="text-[10px] sm:text-xs lg:text-sm text-gray-600">Bonus</div>
          </Card>
          <Card className="p-2 sm:p-3 lg:p-4 text-center">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-600 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{selectedPlayer.minutes}</div>
            <div className="text-[10px] sm:text-xs lg:text-sm text-gray-600">Mins</div>
          </Card>
          <Card className="p-2 sm:p-3 lg:p-4 text-center">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-indigo-600 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{selectedPlayer.points_per_game}</div>
            <div className="text-[10px] sm:text-xs lg:text-sm text-gray-600">PPG</div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Radar Chart */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Performance Radar</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={performanceData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} tick={{ fill: '#6b7280' }} />
                <Radar 
                  name={selectedPlayer.web_name} 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.6} 
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          {/* Additional Stats */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Additional Statistics</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">ICT Index</span>
                <span className="font-bold text-sm sm:text-base text-gray-900">{selectedPlayer.ict_index}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Expected Goals (xG)</span>
                <span className="font-bold text-sm sm:text-base text-gray-900">{selectedPlayer.expected_goals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Expected Assists (xA)</span>
                <span className="font-bold text-sm sm:text-base text-gray-900">{selectedPlayer.expected_assists}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Expected Goal Involvement (xGI)</span>
                <span className="font-bold text-sm sm:text-base text-gray-900">{selectedPlayer.expected_goal_involvements}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Threat</span>
                <span className="font-bold text-sm sm:text-base text-gray-900">{selectedPlayer.threat}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Creativity</span>
                <span className="font-bold text-sm sm:text-base text-gray-900">{selectedPlayer.creativity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Influence</span>
                <span className="font-bold text-sm sm:text-base text-gray-900">{selectedPlayer.influence}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Fixtures */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
            Next {fixturesToShow} Fixture{fixturesToShow !== 1 ? 's' : ''}
            {remainingGameweeks <= 5 && remainingGameweeks > 0 && (
              <span className="text-xs sm:text-sm font-normal text-gray-500 ml-2">
                ({remainingGameweeks} GW{remainingGameweeks !== 1 ? 's' : ''} remaining)
              </span>
            )}
          </h3>
          {fixtures.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-xs sm:text-sm">No upcoming fixtures available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {fixtures.map((fixture, index) => {
                const difficultyColors = [
                  'bg-[#01FC7C] text-gray-900',  // FDR 1 - Dark Green
                  'bg-[#00FF87] text-gray-900',  // FDR 2 - Light Green
                  'bg-gray-400 text-white',      // FDR 3 - Gray
                  'bg-[#FF1751] text-white',     // FDR 4 - Pink/Red
                  'bg-[#861134] text-white',     // FDR 5 - Dark Red
                ];
                const colorClass = difficultyColors[(fixture.difficulty || 3) - 1];
                return (
                  <div key={index} className={`${colorClass} rounded-lg p-3 text-center font-bold`}>
                    <div className="text-xs opacity-80 mb-1">GW {fixture.gameweek}</div>
                    <div className="text-lg">{fixture.opponent || 'TBD'}</div>
                    <div className="text-xs opacity-80 mt-1">{fixture.isHome ? 'H' : 'A'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Player list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Player Statistics</h2>
        <p className="text-gray-600">Detailed statistics and analysis for all FPL players</p>
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
              variant={filterPosition === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPosition(null)}
            >
              All
            </Button>
            <Button
              variant={filterPosition === 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPosition(1)}
            >
              GK
            </Button>
            <Button
              variant={filterPosition === 2 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPosition(2)}
            >
              DEF
            </Button>
            <Button
              variant={filterPosition === 3 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPosition(3)}
            >
              MID
            </Button>
            <Button
              variant={filterPosition === 4 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPosition(4)}
            >
              FWD
            </Button>
          </div>
        </div>
      </Card>

      {/* Players Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pos
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Form
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Own%
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  G
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  A
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CS
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlayers.slice(0, 50).map((player) => {
                const position = positionNames[player.element_type as keyof typeof positionNames];
                const priceChange = player.cost_change_start / 10;
                return (
                  <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-gray-900">{player.web_name}</div>
                        <div className="text-sm text-gray-600">{player.team_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge className={`${position.color} text-xs`}>
                        {position.name}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="font-bold text-gray-900">£{(player.now_cost / 10).toFixed(1)}m</div>
                      {priceChange !== 0 && (
                        <div className={`text-xs ${priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {priceChange > 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(1)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="font-bold text-purple-600">{player.total_points}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="font-bold text-blue-600">{player.form}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-gray-900">{player.selected_by_percent}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-gray-900">{player.goals_scored}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-gray-900">{player.assists}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-gray-900">{player.clean_sheets}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPlayer(player)}
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredPlayers.length === 0 && (
        <Card className="p-12 text-center">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No players found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </Card>
      )}
    </div>
  );
}