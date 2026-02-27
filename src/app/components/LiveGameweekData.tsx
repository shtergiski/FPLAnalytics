import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  RefreshCw, 
  TrendingUp, 
  Target, 
  Activity, 
  Award,
  Clock,
  AlertCircle,
  Zap,
  User,
  Shield,
  Trophy
} from 'lucide-react';
import { FPLService } from '../utils/corsProxy';
import { useFPLStore } from '../store/fpl-store';

interface LivePlayerData {
  id: number;
  stats: {
    minutes: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    goals_conceded: number;
    own_goals: number;
    penalties_saved: number;
    penalties_missed: number;
    yellow_cards: number;
    red_cards: number;
    saves: number;
    bonus: number;
    bps: number;
    influence: string;
    creativity: string;
    threat: string;
    ict_index: string;
    total_points: number;
  };
  explain: Array<{
    fixture: number;
    stats: Array<{
      identifier: string;
      points: number;
      value: number;
    }>;
  }>;
}

export function LiveGameweekData() {
  const { bootstrap } = useFPLStore();
  const [gameweek, setGameweek] = useState('28');
  const [liveData, setLiveData] = useState<LivePlayerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<'ALL' | 'GKP' | 'DEF' | 'MID' | 'FWD'>('ALL');
  const [sortBy, setSortBy] = useState<'points' | 'bps' | 'goals' | 'assists'>('points');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [hasLiveFixtures, setHasLiveFixtures] = useState(true);

  // Track tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchLiveData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await FPLService.loadLiveGameweek(Number(gameweek));
      setLiveData(data.elements || []);
      
      // Fetch fixtures for this gameweek to check if live
      const allFixtures = await FPLService.loadFixtures();
      const gwFixtures = allFixtures.filter((f: any) => f.event === Number(gameweek));
      
      // Check if any fixtures are live (started but not finished)
      const anyLive = gwFixtures.some((f: any) => f.started && !f.finished);
      setHasLiveFixtures(anyLive);
      
      // Auto-turn off auto-refresh if no live fixtures
      if (!anyLive && autoRefresh) {
        setAutoRefresh(false);
      }
      
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load live data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 90 seconds if enabled
  useEffect(() => {
    if (autoRefresh && isTabVisible) {
      const interval = setInterval(() => {
        fetchLiveData();
      }, 90000); // 90 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, gameweek, isTabVisible]);

  // Auto-load when gameweek changes
  useEffect(() => {
    fetchLiveData();
  }, [gameweek]);

  // Get player info from bootstrap
  const getPlayerInfo = (playerId: number) => {
    return bootstrap?.elements?.find(p => p.id === playerId);
  };

  // Filter and sort players
  const filteredPlayers = liveData
    .map(livePlayer => {
      const player = getPlayerInfo(livePlayer.id);
      return { ...livePlayer, player };
    })
    .filter(({ player, stats }) => {
      if (!player) return false;
      
      // Only show players who played
      if (stats.minutes === 0) return false;
      
      // Position filter
      if (positionFilter !== 'ALL') {
        const posMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
        if (posMap[player.element_type as keyof typeof posMap] !== positionFilter) {
          return false;
        }
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          player.web_name.toLowerCase().includes(query) ||
          player.first_name.toLowerCase().includes(query) ||
          player.second_name.toLowerCase().includes(query)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return b.stats.total_points - a.stats.total_points;
        case 'bps':
          return b.stats.bps - a.stats.bps;
        case 'goals':
          return b.stats.goals_scored - a.stats.goals_scored;
        case 'assists':
          return b.stats.assists - a.stats.assists;
        default:
          return 0;
      }
    });

  const topScorers = filteredPlayers.slice(0, 10);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Live Gameweek Data</h2>
          <p className="text-sm sm:text-base text-gray-600">Real-time player scores and performance stats</p>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4 md:p-6 bg-gradient-to-r from-cyan-50 to-purple-50 border-2 border-cyan-200">
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Gameweek</label>
              <select
                value={gameweek}
                onChange={(e) => setGameweek(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm"
              >
                {Array.from({ length: 38 }, (_, i) => i + 1).map(gw => (
                  <option key={gw} value={gw}>
                    Gameweek {gw}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <Button
                onClick={fetchLiveData}
                disabled={loading || !hasLiveFixtures}
                className="flex-1 sm:flex-none bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!hasLiveFixtures ? "No live fixtures in this gameweek" : ""}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Loading...</span>
                    <span className="sm:hidden">Load</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Refresh Data</span>
                    <span className="sm:hidden">Refresh</span>
                  </>
                )}
              </Button>
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                onClick={() => setAutoRefresh(!autoRefresh)}
                disabled={!hasLiveFixtures}
                className="flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
                title={!hasLiveFixtures ? "Auto-refresh only available for live fixtures" : ""}
              >
                <Zap className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Auto</span>
              </Button>
            </div>
          </div>

          {lastUpdate && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              Last updated: {lastUpdate.toLocaleTimeString()}
              {autoRefresh && isTabVisible && <span className="text-green-600 font-semibold">(Auto-refresh ON)</span>}
              {autoRefresh && !isTabVisible && <span className="text-orange-600 font-semibold">(Auto-refresh PAUSED - tab inactive)</span>}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4 md:p-6">
        <div className="space-y-3 md:space-y-4">
          {/* Search */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Search Players</label>
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Position Filter */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Position</label>
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'GKP', 'DEF', 'MID', 'FWD'] as const).map(pos => (
                <Button
                  key={pos}
                  variant={positionFilter === pos ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPositionFilter(pos)}
                  className="flex-1 sm:flex-none min-w-[60px]"
                >
                  {pos}
                </Button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'points', label: 'Points', icon: Trophy },
                { value: 'bps', label: 'BPS', icon: Award },
                { value: 'goals', label: 'Goals', icon: Target },
                { value: 'assists', label: 'Assists', icon: TrendingUp }
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={sortBy === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy(value as any)}
                  className="flex-1 sm:flex-none"
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-3 md:p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="text-xs sm:text-sm opacity-90">Total Goals</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1">
            {filteredPlayers.reduce((sum, p) => sum + p.stats.goals_scored, 0)}
          </div>
        </Card>
        <Card className="p-3 md:p-4 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
          <div className="text-xs sm:text-sm opacity-90">Avg Points</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1">
            {filteredPlayers.length > 0 
              ? Math.round(filteredPlayers.reduce((sum, p) => sum + p.stats.total_points, 0) / filteredPlayers.length)
              : 0
            }
          </div>
        </Card>
        <Card className="p-3 md:p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-xs sm:text-sm opacity-90">Total Assists</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1">
            {filteredPlayers.reduce((sum, p) => sum + p.stats.assists, 0)}
          </div>
        </Card>
        <Card className="p-3 md:p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="text-xs sm:text-sm opacity-90">Total Bonus</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1">
            {filteredPlayers.reduce((sum, p) => sum + p.stats.bonus, 0)}
          </div>
        </Card>
      </div>

      {/* Player List */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
          Top Performers (GW{gameweek})
        </h3>
        
        {/* Desktop/Tablet View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-2 border-gray-200">
              <tr className="text-left text-sm text-gray-600">
                <th className="pb-3 font-semibold">Player</th>
                <th className="pb-3 font-semibold text-center">Mins</th>
                <th className="pb-3 font-semibold text-center">Goals</th>
                <th className="pb-3 font-semibold text-center">Assists</th>
                <th className="pb-3 font-semibold text-center">CS</th>
                <th className="pb-3 font-semibold text-center">Bonus</th>
                <th className="pb-3 font-semibold text-center">BPS</th>
                <th className="pb-3 font-semibold text-center">Points</th>
              </tr>
            </thead>
            <tbody>
              {topScorers.map(({ id, stats, player }) => {
                if (!player) return null;
                const team = bootstrap?.teams?.find(t => t.id === player.team);
                const posMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
                const position = posMap[player.element_type as keyof typeof posMap];
                
                return (
                  <tr key={id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`}
                          alt={player.web_name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            e.currentTarget.src = `https://resources.premierleague.com/premierleague/badges/70/t${player.team_code}.png`;
                          }}
                        />
                        <div>
                          <div className="font-semibold text-gray-900">{player.web_name}</div>
                          <div className="text-xs text-gray-600">{team?.short_name} • {position}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center text-sm">{stats.minutes}'</td>
                    <td className="text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        stats.goals_scored > 0 ? 'bg-green-100 text-green-700' : 'text-gray-400'
                      }`}>
                        {stats.goals_scored}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        stats.assists > 0 ? 'bg-blue-100 text-blue-700' : 'text-gray-400'
                      }`}>
                        {stats.assists}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        stats.clean_sheets > 0 ? 'bg-purple-100 text-purple-700' : 'text-gray-400'
                      }`}>
                        {stats.clean_sheets}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        stats.bonus > 0 ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400'
                      }`}>
                        {stats.bonus}
                      </span>
                    </td>
                    <td className="text-center text-sm font-semibold text-gray-700">{stats.bps}</td>
                    <td className="text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 text-white font-bold text-lg">
                        {stats.total_points}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {topScorers.map(({ id, stats, player }) => {
            if (!player) return null;
            const team = bootstrap?.teams?.find(t => t.id === player.team);
            const posMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
            const position = posMap[player.element_type as keyof typeof posMap];
            
            return (
              <Card key={id} className="p-3 bg-gray-50">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`}
                    alt={player.web_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.currentTarget.src = `https://resources.premierleague.com/premierleague/badges/70/t${player.team_code}.png`;
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{player.web_name}</div>
                    <div className="text-xs text-gray-600">{team?.short_name} • {position} • {stats.minutes}'</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold bg-gradient-to-br from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                      {stats.total_points}
                    </div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${stats.goals_scored > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {stats.goals_scored}
                    </div>
                    <div className="text-xs text-gray-500">Goals</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${stats.assists > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                      {stats.assists}
                    </div>
                    <div className="text-xs text-gray-500">Assists</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${stats.bonus > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                      {stats.bonus}
                    </div>
                    <div className="text-xs text-gray-500">Bonus</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-700">{stats.bps}</div>
                    <div className="text-xs text-gray-500">BPS</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredPlayers.length === 0 && !loading && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No players found. Try adjusting your filters.</p>
          </div>
        )}
      </Card>
    </div>
  );
}