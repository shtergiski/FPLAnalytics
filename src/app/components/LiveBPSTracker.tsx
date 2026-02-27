import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  RefreshCw, 
  Award,
  Clock,
  AlertCircle,
  Zap,
  TrendingUp,
  Shield,
  Flame,
  Star,
  ChevronDown,
  ChevronUp
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

interface FixtureData {
  id: number;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  started: boolean;
  finished: boolean;
  minutes: number;
}

export function LiveBPSTracker() {
  const { bootstrap } = useFPLStore();
  const [gameweek, setGameweek] = useState('28');
  const [liveData, setLiveData] = useState<LivePlayerData[]>([]);
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedFixture, setSelectedFixture] = useState<number | 'all'>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [minBPS, setMinBPS] = useState('20');
  const [expandedFixtures, setExpandedFixtures] = useState<Set<number>>(new Set());
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
      // Fetch live gameweek data
      const data = await FPLService.loadLiveGameweek(Number(gameweek));
      setLiveData(data.elements || []);
      
      // Fetch fixtures for this gameweek
      const allFixtures = await FPLService.loadFixtures();
      const gwFixtures = allFixtures.filter((f: any) => f.event === Number(gameweek));
      setFixtures(gwFixtures);
      
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

  // Get team info
  const getTeam = (teamId: number) => {
    return bootstrap?.teams?.find(t => t.id === teamId);
  };

  // Group players by fixture and calculate BPS standings
  const getFixtureBPS = (fixtureId: number) => {
    const players = liveData
      .map(livePlayer => {
        const player = getPlayerInfo(livePlayer.id);
        return { ...livePlayer, player };
      })
      .filter(({ player, stats, explain }) => {
        if (!player || stats.minutes === 0) return false;
        
        // Check if player was in this fixture
        const fixtureStats = explain?.find(e => e.fixture === fixtureId);
        return !!fixtureStats;
      })
      .sort((a, b) => b.stats.bps - a.stats.bps);
    
    return players;
  };

  // Get all active fixtures with BPS data
  const activeFixtures = fixtures
    .filter(f => f.started)
    .map(fixture => {
      const homeTeam = getTeam(fixture.team_h);
      const awayTeam = getTeam(fixture.team_a);
      const bpsPlayers = getFixtureBPS(fixture.id);
      
      return {
        fixture,
        homeTeam,
        awayTeam,
        bpsPlayers
      };
    })
    .filter(f => f.bpsPlayers.length > 0);

  // Get top BPS players across all fixtures
  const topBPSPlayers = liveData
    .map(livePlayer => {
      const player = getPlayerInfo(livePlayer.id);
      return { ...livePlayer, player };
    })
    .filter(({ stats, player }) => player && stats.minutes > 0 && stats.bps >= Number(minBPS))
    .sort((a, b) => b.stats.bps - a.stats.bps)
    .slice(0, 20);
  
  // Calculate summary stats
  // 1. All unique players who played (minutes > 0)
  const allActivePlayers = liveData.filter(p => p.stats.minutes > 0);
  const uniquePlayers = allActivePlayers.length;
  
  // 2. Average BPS across all active players
  const totalBPS = allActivePlayers.reduce((sum, p) => sum + p.stats.bps, 0);
  const averageBPS = uniquePlayers > 0 ? Math.round(totalBPS / uniquePlayers) : 0;
  
  // 3. Highest BPS (check all active players, not just top 20)
  const highestBPS = allActivePlayers.length > 0 
    ? Math.max(...allActivePlayers.map(p => p.stats.bps)) 
    : 0;
  
  // Determine bonus points based on BPS rank
  const getBonusFromRank = (rank: number, totalPlayers: number) => {
    if (rank === 0 && totalPlayers > 0) return 3;
    if (rank === 1 && totalPlayers > 1) return 2;
    if (rank === 2 && totalPlayers > 2) return 1;
    return 0;
  };
  
  // 4. Total bonus points actually given (top 3 per fixture)
  const totalBonusGiven = activeFixtures.reduce((sum, { bpsPlayers }) => {
    // Only top 3 players get bonus
    const top3 = bpsPlayers.slice(0, 3);
    return sum + top3.reduce((fixtureSum, player, index) => {
      const bonus = getBonusFromRank(index, bpsPlayers.length);
      return fixtureSum + bonus;
    }, 0);
  }, 0);

  // Toggle fixture expansion
  const toggleFixture = (fixtureId: number) => {
    setExpandedFixtures(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fixtureId)) {
        newSet.delete(fixtureId);
      } else {
        newSet.add(fixtureId);
      }
      return newSet;
    });
  };

  // Filter fixtures based on selected fixture
  const filteredFixtures = selectedFixture === 'all' 
    ? activeFixtures 
    : activeFixtures.filter(f => f.fixture.id === selectedFixture);

  // Check if gameweek is completed (all fixtures finished)
  const isGameweekLive = fixtures.some(f => f.started && !f.finished);
  
  // Show Top BPS Players only when:
  // 1. Filter is set to "All Matches"
  // 2. Gameweek is completed (no live fixtures)
  const showTopBPSPlayers = selectedFixture === 'all' && !isGameweekLive;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Award className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Live Bonus Points System</h2>
          <p className="text-sm sm:text-base text-gray-600">Real-time BPS tracker with bonus point predictions</p>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4 md:p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
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
            <div className="flex-1">
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Filter by Match</label>
              <select
                value={selectedFixture}
                onChange={(e) => setSelectedFixture(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm"
                disabled={activeFixtures.length === 0}
              >
                <option value="all">All Matches</option>
                {activeFixtures.map(({ fixture, homeTeam, awayTeam }) => (
                  <option key={fixture.id} value={fixture.id}>
                    {homeTeam?.short_name} vs {awayTeam?.short_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <Button
                onClick={fetchLiveData}
                disabled={loading || !hasLiveFixtures}
                className="flex-1 sm:flex-none bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <span className="hidden sm:inline">Refresh BPS</span>
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-blue-800">
                <strong>How BPS Works:</strong> Top 3 BPS in each match get bonus points: 1st = 3pts, 2nd = 2pts, 3rd = 1pt
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-3 md:p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="text-xs sm:text-sm opacity-90">Average BPS</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1">{averageBPS}</div>
        </Card>
        <Card className="p-3 md:p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="text-xs sm:text-sm opacity-90">Unique Players</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1">{uniquePlayers}</div>
        </Card>
        <Card className="p-3 md:p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="text-xs sm:text-sm opacity-90">Highest BPS</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1">
            {highestBPS}
          </div>
        </Card>
        <Card className="p-3 md:p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-xs sm:text-sm opacity-90">Bonus Given</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1">
            {totalBonusGiven}
          </div>
        </Card>
      </div>

      {/* Top BPS Players Overall */}
      {showTopBPSPlayers && topBPSPlayers.length > 0 && (
        <Card className="p-4 md:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Top BPS Players (GW{gameweek})
          </h3>
          
          {/* Desktop/Tablet View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-gray-200">
                <tr className="text-left text-sm text-gray-600">
                  <th className="pb-3 font-semibold">Rank</th>
                  <th className="pb-3 font-semibold">Player</th>
                  <th className="pb-3 font-semibold text-center">BPS</th>
                  <th className="pb-3 font-semibold text-center">Bonus</th>
                  <th className="pb-3 font-semibold text-center">Goals</th>
                  <th className="pb-3 font-semibold text-center">Assists</th>
                  <th className="pb-3 font-semibold text-center">Influence</th>
                  <th className="pb-3 font-semibold text-center">Creativity</th>
                  <th className="pb-3 font-semibold text-center">Threat</th>
                </tr>
              </thead>
              <tbody>
                {topBPSPlayers.map(({ id, stats, player }, index) => {
                  if (!player) return null;
                  const team = bootstrap?.teams?.find(t => t.id === player.team);
                  const posMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
                  const position = posMap[player.element_type as keyof typeof posMap];
                  
                  const rankColors = ['bg-yellow-500', 'bg-gray-400', 'bg-orange-600'];
                  const rankColor = index < 3 ? rankColors[index] : 'bg-gray-300';
                  
                  return (
                    <tr key={id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4">
                        <div className={`w-8 h-8 rounded-full ${rankColor} flex items-center justify-center text-white font-bold`}>
                          {index + 1}
                        </div>
                      </td>
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
                      <td className="text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-bold text-sm">
                          {stats.bps}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          stats.bonus > 0 ? 'bg-green-100 text-green-700' : 'text-gray-400'
                        }`}>
                          {stats.bonus}
                        </span>
                      </td>
                      <td className="text-center text-sm">{stats.goals_scored}</td>
                      <td className="text-center text-sm">{stats.assists}</td>
                      <td className="text-center text-sm font-semibold text-purple-600">
                        {parseFloat(stats.influence).toFixed(1)}
                      </td>
                      <td className="text-center text-sm font-semibold text-blue-600">
                        {parseFloat(stats.creativity).toFixed(1)}
                      </td>
                      <td className="text-center text-sm font-semibold text-red-600">
                        {parseFloat(stats.threat).toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-3">
            {topBPSPlayers.map(({ id, stats, player }, index) => {
              if (!player) return null;
              const team = bootstrap?.teams?.find(t => t.id === player.team);
              const posMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
              const position = posMap[player.element_type as keyof typeof posMap];
              
              const rankColors = ['bg-yellow-500', 'bg-gray-400', 'bg-orange-600'];
              const rankColor = index < 3 ? rankColors[index] : 'bg-gray-300';
              
              return (
                <Card key={id} className="p-3 bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-full ${rankColor} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                      {index + 1}
                    </div>
                    <img
                      src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`}
                      alt={player.web_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = `https://resources.premierleague.com/premierleague/badges/70/t${player.team_code}.png`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 truncate">{player.web_name}</div>
                      <div className="text-xs text-gray-600">{team?.short_name} • {position}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold text-yellow-600">{stats.bps}</div>
                      <div className="text-xs text-gray-500">BPS</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    <div className="text-center">
                      <div className="text-sm font-bold text-green-600">{stats.bonus}</div>
                      <div className="text-xs text-gray-500">Bonus</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-700">{stats.goals_scored}</div>
                      <div className="text-xs text-gray-500">Goals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-700">{stats.assists}</div>
                      <div className="text-xs text-gray-500">Assists</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-purple-600">{parseFloat(stats.influence).toFixed(0)}</div>
                      <div className="text-xs text-gray-500">Inf</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-blue-600">{parseFloat(stats.creativity).toFixed(0)}</div>
                      <div className="text-xs text-gray-500">Cre</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {topBPSPlayers.length === 0 && !loading && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No BPS data available yet. Matches may not have started.</p>
            </div>
          )}
        </Card>
      )}

      {/* By Fixture */}
      {filteredFixtures.length > 0 && (
        <Card className="p-4 md:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            BPS by Match {selectedFixture !== 'all' && '(Filtered)'}
          </h3>
          
          <div className="space-y-4">
            {filteredFixtures.map(({ fixture, homeTeam, awayTeam, bpsPlayers }) => {
              const isExpanded = expandedFixtures.has(fixture.id);
              const displayPlayers = isExpanded ? bpsPlayers : bpsPlayers.slice(0, 3);
              
              return (
                <Card key={fixture.id} className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200">
                  {/* Match Header */}
                  <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-200">
                    {/* Home Team */}
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <img
                        src={`https://resources.premierleague.com/premierleague/badges/70/t${homeTeam?.code}.png`}
                        alt={homeTeam?.name}
                        className="w-8 h-8 sm:w-10 sm:h-10"
                      />
                      <span className="font-bold text-xs sm:text-sm text-gray-900 text-center">{homeTeam?.short_name}</span>
                    </div>
                    
                    {/* Score */}
                    <div className="text-center flex-shrink-0">
                      <div className="text-lg sm:text-xl font-bold text-gray-700">
                        {fixture.team_h_score ?? 0} - {fixture.team_a_score ?? 0}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 justify-center mt-1">
                        <Clock className="w-3 h-3" />
                        {fixture.finished ? 'FT' : `${fixture.minutes}'`}
                      </div>
                    </div>
                    
                    {/* Away Team */}
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <img
                        src={`https://resources.premierleague.com/premierleague/badges/70/t${awayTeam?.code}.png`}
                        alt={awayTeam?.name}
                        className="w-8 h-8 sm:w-10 sm:h-10"
                      />
                      <span className="font-bold text-xs sm:text-sm text-gray-900 text-center">{awayTeam?.short_name}</span>
                    </div>
                  </div>

                  {/* Top BPS (3 or all depending on expand state) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {displayPlayers.map(({ id, stats, player }, index) => {
                      if (!player) return null;
                      const posMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
                      const position = posMap[player.element_type as keyof typeof posMap];
                      const bonusPoints = getBonusFromRank(index, bpsPlayers.length);
                      const rankLabels = ['🥇 1st', '🥈 2nd', '🥉 3rd'];
                      
                      return (
                        <div key={id} className={`bg-white rounded-lg p-3 border-2 ${index < 3 ? 'border-yellow-200' : 'border-gray-200'}`}>
                          {index < 3 && <div className="text-xs font-bold text-yellow-700 mb-2">{rankLabels[index]}</div>}
                          {index >= 3 && <div className="text-xs font-bold text-gray-600 mb-2">#{index + 1}</div>}
                          <div className="flex items-center gap-2 mb-2">
                            <img
                              src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`}
                              alt={player.web_name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => {
                                e.currentTarget.src = `https://resources.premierleague.com/premierleague/badges/70/t${player.team_code}.png`;
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-gray-900 truncate">{player.web_name}</div>
                              <div className="text-xs text-gray-600">{position}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-lg font-bold text-yellow-600">{stats.bps}</div>
                              <div className="text-xs text-gray-500">BPS</div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${bonusPoints > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                {bonusPoints > 0 ? `+${bonusPoints}` : '0'}
                              </div>
                              <div className="text-xs text-gray-500">Bonus</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Expand/Collapse Button */}
                  {bpsPlayers.length > 3 && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFixture(fixture.id)}
                        className="w-full sm:w-auto"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            Show All {bpsPlayers.length} Players
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}