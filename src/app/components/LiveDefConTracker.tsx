import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  RefreshCw, 
  Shield,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingDown,
  TrendingUp,
  Target,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { FPLService } from '../utils/corsProxy';
import { useFPLStore } from '../store/fpl-store';
import { PlayerImage } from './ui/player-image';
import { TeamBadge } from './ui/team-badge';

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
    clearances_blocks_interceptions: number;
    tackles: number;
    recoveries: number;
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
  event: number;
}

interface PlayerDefensiveData {
  id: number;
  player: any;
  stats: any;
  defensiveContributions: number;
  saves: number;
  milestoneMet: boolean;
  bonusPoints: number;
  progressPercent: number;
  milestone: number;
}

interface FixtureDefensiveData {
  fixture: FixtureData;
  homeTeam: any;
  awayTeam: any;
  homePlayers: PlayerDefensiveData[];
  awayPlayers: PlayerDefensiveData[];
}

export function LiveDefConTracker() {
  const { bootstrap, updateLivePlayerStats } = useFPLStore();
  const [gameweek, setGameweek] = useState('28');
  const [liveData, setLiveData] = useState<LivePlayerData[]>([]);
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<number | 'all'>('all');
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  const [hasLiveFixtures, setHasLiveFixtures] = useState(true);
  const autoRefreshRef = useRef(autoRefresh);
  autoRefreshRef.current = autoRefresh;
  const fetchLiveDataRef = useRef<() => void>(() => {});
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (retryTimerRef.current) clearTimeout(retryTimerRef.current); };
  }, []);

  const fetchLiveData = useCallback(async () => {
    setLoading(true);

    try {
      // Fetch live data and fixtures in parallel, always bypassing cache
      const [data, allFixtures] = await Promise.all([
        FPLService.loadLiveGameweek(Number(gameweek)),
        FPLService.loadFixtures(true),
      ]);

      const elements: LivePlayerData[] = data.elements || [];
      setLiveData(elements);

      // Partial store update — only push changed stats
      updateLivePlayerStats(
        elements
          .filter((el: LivePlayerData) => el.stats.minutes > 0)
          .map((el: LivePlayerData) => ({ id: el.id, stats: el.stats as unknown as Record<string, unknown> }))
      );

      const gwFixtures = allFixtures.filter((f: FixtureData) => f.event === Number(gameweek));
      setFixtures(gwFixtures);

      const anyLive = gwFixtures.some((f: FixtureData) => f.started && !f.finished);
      setHasLiveFixtures(anyLive);

      if (!anyLive && autoRefreshRef.current) {
        setAutoRefresh(false);
      }

      setLastUpdate(new Date());
      setError('');
      retryCountRef.current = 0;
      if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load live data';
      setError(message);
      const delay = Math.min(10000 * Math.pow(2, retryCountRef.current), 120000);
      retryCountRef.current++;
      retryTimerRef.current = setTimeout(() => { fetchLiveDataRef.current(); }, delay);
    } finally {
      setLoading(false);
    }
  }, [gameweek, updateLivePlayerStats]);

  // Keep ref in sync so the interval always calls the latest version
  fetchLiveDataRef.current = fetchLiveData;

  // Auto-refresh every 90 seconds if enabled
  // Only depends on autoRefresh — checks document.hidden at fire-time to skip
  // hidden-tab fetches without resetting the 90-second countdown.
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchLiveDataRef.current();
      }
    }, 90000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Auto-load when gameweek changes
  useEffect(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  // Get player info
  const getPlayerInfo = (playerId: number) => {
    return bootstrap?.elements?.find(p => p.id === playerId);
  };

  // Get team info
  const getTeam = (teamId: number) => {
    return bootstrap?.teams?.find(t => t.id === teamId);
  };

  // Calculate DefCon level (1 = critical, 5 = excellent)
  const calculateDefCon = (goalsAgainst: number, cleanSheet: boolean, finished: boolean): number => {
    if (!finished) {
      if (cleanSheet) return 5; // Excellent - maintaining clean sheet
      if (goalsAgainst === 1) return 3; // Moderate - conceded 1
      if (goalsAgainst === 2) return 2; // Poor - conceded 2
      return 1; // Critical - conceded 3+
    }
    // Finished matches
    if (cleanSheet) return 5;
    if (goalsAgainst === 1) return 4;
    if (goalsAgainst === 2) return 3;
    if (goalsAgainst === 3) return 2;
    return 1;
  };

  // Get DefCon color and label
  const getDefConInfo = (level: number) => {
    const info = {
      1: { color: 'from-red-600 to-red-700', bgColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300', label: 'CRITICAL', icon: XCircle },
      2: { color: 'from-orange-600 to-orange-700', bgColor: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-300', label: 'POOR', icon: AlertTriangle },
      3: { color: 'from-yellow-600 to-yellow-700', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', borderColor: 'border-yellow-300', label: 'MODERATE', icon: AlertCircle },
      4: { color: 'from-blue-600 to-blue-700', bgColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300', label: 'GOOD', icon: CheckCircle },
      5: { color: 'from-green-600 to-green-700', bgColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300', label: 'EXCELLENT', icon: CheckCircle }
    };
    return info[level as keyof typeof info] || info[3];
  };

  // Calculate defensive contributions from stats directly (2025/26 rules)
  // CBIT = Clearances + Blocks + Interceptions + Tackles
  const calculateDefensiveContributions = (livePlayer: LivePlayerData, position: number): number => {
    const stats = livePlayer.stats;
    const cbit = (stats.clearances_blocks_interceptions || 0) + (stats.tackles || 0);

    // Defenders: CBIT >= 10 for +2pts
    if (position === 2) {
      return cbit;
    }

    // Midfielders and Forwards: CBIT + Recoveries >= 12 for +2pts
    if (position === 3 || position === 4) {
      return cbit + (stats.recoveries || 0);
    }

    return 0;
  };

  // Calculate milestone progress for a player
  const calculateMilestoneData = (player: any, stats: any, defensiveContributions: number): PlayerDefensiveData => {
    const position = player.element_type;
    let milestone = 0;
    let bonusPoints = 0;
    let milestoneMet = false;
    let progressPercent = 0;

    // Goalkeeper - Saves milestones: +1pt per every 3 saves (uncapped)
    if (position === 1) {
      milestone = 3; // First milestone at 3 saves
      bonusPoints = Math.floor(stats.saves / 3);
      milestoneMet = bonusPoints > 0;
      // Progress toward next milestone
      const nextMilestone = (bonusPoints + 1) * 3;
      progressPercent = milestoneMet ? Math.min(100, (stats.saves / nextMilestone) * 100) : (stats.saves / 3) * 100;
    }
    // Defender - 10 defensive contributions
    else if (position === 2) {
      milestone = 10;
      if (defensiveContributions >= 10) {
        bonusPoints = 2;
        milestoneMet = true;
        progressPercent = 100;
      } else {
        progressPercent = (defensiveContributions / 10) * 100;
      }
    }
    // Midfielder/Forward - 12 defensive contributions
    else if (position === 3 || position === 4) {
      milestone = 12;
      if (defensiveContributions >= 12) {
        bonusPoints = 2;
        milestoneMet = true;
        progressPercent = 100;
      } else {
        progressPercent = (defensiveContributions / 12) * 100;
      }
    }

    return {
      id: player.id,
      player,
      stats,
      defensiveContributions,
      saves: stats.saves,
      milestoneMet,
      bonusPoints,
      progressPercent,
      milestone
    };
  };

  // Get fixture-based defensive data
  const getFixtureDefensiveData = (): FixtureDefensiveData[] => {
    return fixtures
      .filter(f => f.started)
      .map(fixture => {
        const homeTeam = getTeam(fixture.team_h);
        const awayTeam = getTeam(fixture.team_a);

        const homePlayers: PlayerDefensiveData[] = [];
        const awayPlayers: PlayerDefensiveData[] = [];

        liveData.forEach(livePlayer => {
          const player = getPlayerInfo(livePlayer.id);
          if (!player || livePlayer.stats.minutes === 0) return;

          // Check if player played in this fixture
          const playedInFixture = livePlayer.explain?.some(e => e.fixture === fixture.id);
          if (!playedInFixture) return;

          const defensiveContributions = calculateDefensiveContributions(livePlayer, player.element_type);
          const milestoneData = calculateMilestoneData(player, livePlayer.stats, defensiveContributions);

          if (player.team === fixture.team_h) {
            homePlayers.push(milestoneData);
          } else if (player.team === fixture.team_a) {
            awayPlayers.push(milestoneData);
          }
        });

        // Sort by progress
        homePlayers.sort((a, b) => b.progressPercent - a.progressPercent);
        awayPlayers.sort((a, b) => b.progressPercent - a.progressPercent);

        return {
          fixture,
          homeTeam,
          awayTeam,
          homePlayers,
          awayPlayers
        };
      });
  };

  const fixtureDefensiveData = getFixtureDefensiveData();

  // Filter by selected team
  const filteredFixtureData = selectedTeam === 'all'
    ? fixtureDefensiveData
    : fixtureDefensiveData.filter(fd => 
        fd.fixture.team_h === selectedTeam || fd.fixture.team_a === selectedTeam
      );

  // Toggle team expansion
  const toggleTeam = (teamId: number) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  // Calculate summary stats
  const totalCleanSheets = fixtureDefensiveData.reduce((sum, fd) => {
    let count = 0;
    // Home team clean sheet
    if (fd.fixture.team_a_score === 0 && fd.fixture.started) count++;
    // Away team clean sheet
    if (fd.fixture.team_h_score === 0 && fd.fixture.started) count++;
    return sum + count;
  }, 0);
  
  const totalSaves = fixtureDefensiveData.reduce((sum, fd) => {
    // Only count goalkeepers who actually played
    const homeGKSaves = fd.homePlayers.filter(p => p.player.element_type === 1 && p.stats.minutes > 0).reduce((s, p) => s + p.stats.saves, 0);
    const awayGKSaves = fd.awayPlayers.filter(p => p.player.element_type === 1 && p.stats.minutes > 0).reduce((s, p) => s + p.stats.saves, 0);
    return sum + homeGKSaves + awayGKSaves;
  }, 0);
  
  // Calculate average DefCon per team (not per fixture)
  const allTeamDefCons: number[] = [];
  fixtureDefensiveData.forEach(fd => {
    // Home team DefCon
    const homeDefCon = calculateDefCon(
      fd.fixture.team_a_score ?? 0,
      (fd.fixture.team_a_score === 0 && fd.fixture.started),
      fd.fixture.finished
    );
    allTeamDefCons.push(homeDefCon);
    
    // Away team DefCon
    const awayDefCon = calculateDefCon(
      fd.fixture.team_h_score ?? 0,
      (fd.fixture.team_h_score === 0 && fd.fixture.started),
      fd.fixture.finished
    );
    allTeamDefCons.push(awayDefCon);
  });
  
  const avgDefCon = allTeamDefCons.length > 0 
    ? (allTeamDefCons.reduce((sum, dc) => sum + dc, 0) / allTeamDefCons.length).toFixed(1)
    : '0';
  
  // Count unique teams (each fixture has 2 teams)
  const teamsActive = fixtureDefensiveData.length * 2;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Live DefCon Tracker</h2>
          <p className="text-sm sm:text-base text-gray-600">Real-time defensive performance monitoring</p>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4 md:p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
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
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Filter by Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm"
                disabled={fixtureDefensiveData.length === 0}
              >
                <option value="all">All Teams</option>
                {bootstrap?.teams?.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <Button
                onClick={fetchLiveData}
                disabled={loading}
                className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <span className="hidden sm:inline">Refresh</span>
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
                <RefreshCw className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Auto</span>
              </Button>
            </div>
          </div>

          {lastUpdate && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              Last updated: {lastUpdate.toLocaleTimeString()}
              {autoRefresh && <span className="text-green-600 font-semibold">(Auto-refresh ON)</span>}
            </div>
          )}

          {error && (
            <div className={`flex items-center gap-2 text-xs sm:text-sm rounded-lg p-3 ${
              liveData.length > 0
                ? 'text-amber-700 bg-amber-50 border border-amber-200'
                : 'text-red-600 bg-red-50 border border-red-200'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">
                {liveData.length > 0
                  ? `Connection issue — retrying... (showing data from ${lastUpdate?.toLocaleTimeString() || 'earlier'})`
                  : error}
              </span>
              {liveData.length > 0 && <RefreshCw className="w-3 h-3 animate-spin flex-shrink-0" />}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-blue-800">
                <strong>Defensive Milestones:</strong> GK: 3 saves = +1pt, 6 saves = +2pts, 9 saves = +3pts | DEF: 10 contributions = +2pts | MID/FWD: 12 contributions = +2pts
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-3 md:p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-xs sm:text-sm opacity-90">Clean Sheets</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1">{totalCleanSheets}</div>
        </Card>
        <Card className="p-3 md:p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-xs sm:text-sm opacity-90">Total Saves</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1">{totalSaves}</div>
        </Card>
        <Card className="p-3 md:p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="text-xs sm:text-sm opacity-90">Avg DefCon</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1">{avgDefCon}</div>
        </Card>
        <Card className="p-3 md:p-4 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
          <div className="text-xs sm:text-sm opacity-90">Teams Active</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1">{teamsActive}</div>
        </Card>
      </div>

      {/* Fixture Defensive Contributions */}
      {filteredFixtureData.length > 0 && (
        <div className="space-y-4">
          {filteredFixtureData.map((fd) => {
            const isExpanded = expandedTeams.has(fd.fixture.id);
            
            return (
              <Card key={fd.fixture.id} className="p-4 md:p-6 bg-white border-2 border-gray-200">
                {/* Match Header */}
                <div className="flex items-center justify-between gap-2 md:gap-4 mb-6 pb-4 border-b-2 border-gray-200">
                  {/* Home Team */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <TeamBadge
                      teamCode={fd.homeTeam?.code ?? 0}
                      alt={fd.homeTeam?.name ?? ''}
                      className="w-10 h-10 md:w-12 md:h-12"
                    />
                    <div className="font-bold text-sm md:text-lg text-gray-900 text-center">
                      {fd.homeTeam?.short_name}
                    </div>
                  </div>
                  
                  {/* Score */}
                  <div className="text-center bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl flex-shrink-0">
                    <div className="text-xl md:text-2xl font-bold whitespace-nowrap">
                      {fd.fixture.team_h_score ?? 0} - {fd.fixture.team_a_score ?? 0}
                    </div>
                    <div className="text-xs mt-1 opacity-90">
                      {fd.fixture.finished ? 'FT' : fd.fixture.started ? `${fd.fixture.minutes}'` : 'Not Started'}
                    </div>
                  </div>
                  
                  {/* Away Team */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <TeamBadge
                      teamCode={fd.awayTeam?.code ?? 0}
                      alt={fd.awayTeam?.name ?? ''}
                      className="w-10 h-10 md:w-12 md:h-12"
                    />
                    <div className="font-bold text-sm md:text-lg text-gray-900 text-center">
                      {fd.awayTeam?.short_name}
                    </div>
                  </div>
                </div>

                {/* Defensive Contributions & Saves */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Home Team - Defensive Contributions */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      Defensive Contributions
                    </h4>
                    <div className="space-y-2">
                      {fd.homePlayers
                        .filter(p => p.player.element_type !== 1) // Not goalkeepers
                        .slice(0, isExpanded ? undefined : 5)
                        .map((playerData) => {
                          const posMap = { 2: 'DEF', 3: 'MID', 4: 'FWD' };
                          const position = posMap[playerData.player.element_type as keyof typeof posMap];
                          
                          return (
                            <div key={playerData.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              {playerData.milestoneMet ? (
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="font-semibold text-sm text-gray-900 truncate block">
                                  {playerData.player.web_name}
                                </span>
                                <span className="text-xs text-gray-500">{position}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-sm ${playerData.milestoneMet ? 'text-green-600' : 'text-red-600'}`}>
                                  ({playerData.defensiveContributions})
                                </span>
                                {playerData.bonusPoints > 0 && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                    +{playerData.bonusPoints}pt
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      {fd.homePlayers.filter(p => p.player.element_type !== 1).length > 5 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTeam(fd.fixture.id)}
                          className="w-full text-xs"
                        >
                          {isExpanded ? 'Show Less ↑' : `Show More ↓ (${fd.homePlayers.filter(p => p.player.element_type !== 1).length - 5} more)`}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Away Team - Defensive Contributions */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      Defensive Contributions
                    </h4>
                    <div className="space-y-2">
                      {fd.awayPlayers
                        .filter(p => p.player.element_type !== 1)
                        .slice(0, isExpanded ? undefined : 5)
                        .map((playerData) => {
                          const posMap = { 2: 'DEF', 3: 'MID', 4: 'FWD' };
                          const position = posMap[playerData.player.element_type as keyof typeof posMap];
                          
                          return (
                            <div key={playerData.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              {playerData.milestoneMet ? (
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="font-semibold text-sm text-gray-900 truncate block">
                                  {playerData.player.web_name}
                                </span>
                                <span className="text-xs text-gray-500">{position}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-sm ${playerData.milestoneMet ? 'text-green-600' : 'text-red-600'}`}>
                                  ({playerData.defensiveContributions})
                                </span>
                                {playerData.bonusPoints > 0 && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                    +{playerData.bonusPoints}pt
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      {fd.awayPlayers.filter(p => p.player.element_type !== 1).length > 5 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTeam(fd.fixture.id)}
                          className="w-full text-xs"
                        >
                          {isExpanded ? 'Show Less ↑' : `Show More ↓ (${fd.awayPlayers.filter(p => p.player.element_type !== 1).length - 5} more)`}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Goalkeepers - Saves */}
                <div className="mt-6 pt-6 border-t-2 border-gray-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-cyan-600" />
                    Saves
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Home GK */}
                    {fd.homePlayers.filter(p => p.player.element_type === 1).map((playerData) => (
                      <div key={playerData.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border-2 border-cyan-200">
                        {playerData.milestoneMet ? (
                          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                        )}
                        <PlayerImage
                          code={playerData.player.code}
                          teamCode={playerData.player.team_code}
                          alt={playerData.player.web_name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-sm text-gray-900">
                            {playerData.player.web_name}
                          </div>
                          <div className="text-xs text-gray-600">GK</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${playerData.milestoneMet ? 'text-green-600' : 'text-red-600'}`}>
                            ({playerData.saves})
                          </div>
                          {playerData.bonusPoints > 0 && (
                            <div className="text-xs font-bold text-green-600">
                              +{playerData.bonusPoints}pt
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Away GK */}
                    {fd.awayPlayers.filter(p => p.player.element_type === 1).map((playerData) => (
                      <div key={playerData.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border-2 border-cyan-200">
                        {playerData.milestoneMet ? (
                          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                        )}
                        <PlayerImage
                          code={playerData.player.code}
                          teamCode={playerData.player.team_code}
                          alt={playerData.player.web_name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-sm text-gray-900">
                            {playerData.player.web_name}
                          </div>
                          <div className="text-xs text-gray-600">GK</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${playerData.milestoneMet ? 'text-green-600' : 'text-red-600'}`}>
                            ({playerData.saves})
                          </div>
                          {playerData.bonusPoints > 0 && (
                            <div className="text-xs font-bold text-green-600">
                              +{playerData.bonusPoints}pt
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {filteredFixtureData.length === 0 && !loading && (
        <Card className="p-12">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No defensive data available yet</p>
            <p className="text-gray-500 text-sm mt-2">Matches may not have started for this gameweek</p>
          </div>
        </Card>
      )}
    </div>
  );
}