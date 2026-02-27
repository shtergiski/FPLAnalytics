import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useFPLStore } from '../store/fpl-store';
import { FPLService } from '../utils/corsProxy';
import { TrendingUp, TrendingDown, Trophy, Users, Target, AlertCircle, Loader2, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, Lock } from 'lucide-react';
import xLogo from '../../assets/logo.jpg';

interface TeamInfo {
  id: number;
  player_first_name: string;
  player_last_name: string;
  name: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  current_event: number;
  leagues: {
    classic: Array<{
      id: number;
      name: string;
      short_name: string;
      entry_rank: number;
      entry_last_rank: number;
      league_type: string; // 'x' for private, 's' for public
    }>;
  };
}

interface LiveTeamData {
  active_chip: string | null;
  entry_history: {
    event: number;
    points: number;
    total_points: number;
    rank: number;
    overall_rank: number;
    bank: number;
    value: number;
    event_transfers: number;
    event_transfers_cost: number;
  };
  picks: Array<{
    element: number;
    position: number;
    multiplier: number;
    is_captain: boolean;
    is_vice_captain: boolean;
  }>;
}

interface LeagueStanding {
  id: number;
  event_total: number;
  player_name: string;
  rank: number;
  last_rank: number;
  rank_sort: number;
  total: number;
  entry: number;
  entry_name: string;
}

interface LeagueData {
  league: {
    id: number;
    name: string;
  };
  standings: {
    has_next: boolean;
    page: number;
    results: LeagueStanding[];
  };
}

type SortColumn = 'rank' | 'total' | 'event_total';
type SortDirection = 'asc' | 'desc';

export function LiveRankTracker() {
  const { bootstrap, fetchBootstrapData } = useFPLStore();
  const [teamId, setTeamId] = useState('');
  const [savedTeamId, setSavedTeamId] = useState('');
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [liveData, setLiveData] = useState<LiveTeamData | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<number | 'overall' | null>(null);
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!bootstrap) {
      fetchBootstrapData();
    }
  }, [bootstrap, fetchBootstrapData]);

  useEffect(() => {
    // Load saved team ID from localStorage
    const saved = localStorage.getItem('fpl_team_id');
    if (saved) {
      setTeamId(saved);
      setSavedTeamId(saved);
      fetchTeamData(saved);
    }
  }, []);

  const currentGW = bootstrap?.events.find(e => e.is_current)?.id || 1;

  const fetchTeamData = async (id: string) => {
    if (!id || id.trim() === '') {
      setError('Please enter a valid Team ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch team info using CORS proxy
      const teamData: TeamInfo = await FPLService.loadManager(parseInt(id));
      setTeamInfo(teamData);

      // Fetch live gameweek data using CORS proxy
      try {
        const liveTeamData: LiveTeamData = await FPLService.loadManagerTeam(parseInt(id), currentGW);
        setLiveData(liveTeamData);
      } catch (liveErr) {
        console.warn('Could not load live gameweek data:', liveErr);
        // Continue without live data
      }

      // Save to localStorage
      localStorage.setItem('fpl_team_id', id);
      setSavedTeamId(id);

      // Auto-select overall view
      setSelectedLeague('overall');
    } catch (err) {
      setError('Team not found. Please check your Team ID and try again.');
      setTeamInfo(null);
      setLiveData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeagueStandings = async (leagueId: number) => {
    setLoading(true);
    setError('');

    try {
      const data: LeagueData = await FPLService.loadLeagueStandings(leagueId);
      setLeagueData(data);
    } catch (err) {
      setError('Failed to fetch league standings. Please try again.');
      setLeagueData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTeamData(teamId);
  };

  const handleLeagueSelect = (leagueId: number | 'overall') => {
    setSelectedLeague(leagueId);
    if (leagueId !== 'overall' && typeof leagueId === 'number') {
      fetchLeagueStandings(leagueId);
    } else {
      setLeagueData(null);
    }
  };

  const handleRefresh = () => {
    if (savedTeamId) {
      setRefreshing(true);
      fetchTeamData(savedTeamId).finally(() => {
        setRefreshing(false);
        if (selectedLeague && selectedLeague !== 'overall') {
          fetchLeagueStandings(selectedLeague);
        }
      });
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedStandings = leagueData?.standings?.results ? [...leagueData.standings.results].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    switch (sortColumn) {
      case 'rank':
        return (a.rank - b.rank) * multiplier;
      case 'total':
        return (b.total - a.total) * multiplier;
      case 'event_total':
        return (b.event_total - a.event_total) * multiplier;
      default:
        return 0;
    }
  }) : [];

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1 opacity-30" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 ml-1 text-purple-600" />
      : <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1 text-purple-600" />;
  };

  const getRankChange = (rank: number, lastRank: number) => {
    if (lastRank === 0) return null;
    const change = lastRank - rank;
    if (change === 0) return { icon: '—', color: 'text-gray-500', text: 'No change' };
    if (change > 0) return { icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-600', text: `+${change}` };
    return { icon: <TrendingDown className="w-4 h-4" />, color: 'text-red-600', text: `${change}` };
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const publicLeagues = teamInfo?.leagues.classic.filter(l => l.league_type !== 'x') || [];
  const privateLeagues = teamInfo?.leagues.classic.filter(l => l.league_type === 'x') || [];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Live Rank Tracker</h2>
            <p className="text-sm sm:text-base text-gray-600">Track your FPL rank and mini league standings in real-time</p>
          </div>
          {teamInfo && (
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Team ID Input */}
      <Card className="p-4 md:p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Enter Your FPL Team ID
            </label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Input
                type="text"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder="e.g., 123456"
                className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-10 sm:h-12 px-4 sm:px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Track Team
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-blue-800">
                <strong>How to find your Team ID:</strong> Go to the FPL website → Points → View Gameweek History → Your Team ID is in the URL
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </form>
      </Card>

      {/* Team Info & Overall Rank */}
      {teamInfo && (
        <>
          <Card className="p-4 md:p-6 bg-gradient-to-br from-purple-600 to-pink-600 text-white relative">
            {/* Brand Badge - Top Left */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
                <img src={xLogo} alt="FPL Dave" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" />
                <div className="text-[10px] sm:text-xs">
                  <div className="font-bold leading-tight">@FPL_Dave_</div>
                  <div className="opacity-80 leading-tight hidden sm:block">FPL Analytics</div>
                </div>
              </div>
            </div>

            <div className="text-center mb-4 md:mb-6 mt-8 sm:mt-0">
              <div className="inline-block bg-white/20 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-2 sm:py-3 mb-3 sm:mb-4">
                <div className="text-xs sm:text-sm opacity-90 mb-1">Team Name</div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black">{teamInfo.name}</div>
              </div>
              <p className="text-sm sm:text-base opacity-90">
                Managed by {teamInfo.player_first_name} {teamInfo.player_last_name}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center">
                <div className="text-xs sm:text-sm opacity-80 mb-1">Overall Rank</div>
                <div className="text-lg sm:text-2xl font-black">{formatNumber(teamInfo.summary_overall_rank)}</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center">
                <div className="text-xs sm:text-sm opacity-80 mb-1">Total Points</div>
                <div className="text-lg sm:text-2xl font-black">{formatNumber(teamInfo.summary_overall_points)}</div>
              </div>
              {liveData && (
                <>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-xs sm:text-sm opacity-80 mb-1">GW{currentGW} Points</div>
                    <div className="text-lg sm:text-2xl font-black">{liveData.entry_history.points}</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-xs sm:text-sm opacity-80 mb-1">Team Value</div>
                    <div className="text-lg sm:text-2xl font-black">£{(liveData.entry_history.value / 10).toFixed(1)}m</div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* League Selection */}
          <Card className="p-4 md:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Select League
            </h3>

            {/* Overall Rank Card */}
            <button
              onClick={() => handleLeagueSelect('overall')}
              className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all text-left mb-4 ${selectedLeague === 'overall'
                  ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-400 shadow-md'
                  : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm sm:text-base text-gray-900 truncate">Overall Rank</div>
                  <div className="text-xs sm:text-sm text-gray-600">Global standings</div>
                </div>
              </div>
            </button>

            {/* Public Leagues Section */}
            {publicLeagues.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Public Leagues</h4>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {publicLeagues.map((league) => (
                    <button
                      key={`classic-${league.id}`}
                      onClick={() => handleLeagueSelect(league.id)}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${selectedLeague === league.id
                          ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-400 shadow-md'
                          : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm sm:text-base text-gray-900 truncate">{league.name}</div>
                          <div className="text-xs sm:text-sm text-gray-600">Rank: {formatNumber(league.entry_rank)}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Private Leagues Section */}
            {privateLeagues.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-orange-600" />
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Private Leagues</h4>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {privateLeagues.map((league) => (
                    <button
                      key={`private-${league.id}`}
                      onClick={() => handleLeagueSelect(league.id)}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${selectedLeague === league.id
                          ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-400 shadow-md'
                          : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm sm:text-base text-gray-900 truncate">{league.name}</div>
                          <div className="text-xs sm:text-sm text-gray-600">Private • Rank: {formatNumber(league.entry_rank)}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Overall Rank Display */}
          {selectedLeague === 'overall' && (
            <Card className="p-4 md:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Overall Standings
              </h3>

              <div className="grid gap-4 sm:gap-6">
                {/* Your Position Card */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm text-gray-600 mb-1">Your Overall Rank</div>
                        <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
                          {formatNumber(teamInfo.summary_overall_rank)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="text-sm sm:text-base text-gray-600">Total Points</div>
                      <div className="text-xl sm:text-2xl font-bold text-purple-600">
                        {formatNumber(teamInfo.summary_overall_points)} pts
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gameweek Performance */}
                {liveData && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                      <div className="text-xs sm:text-sm text-gray-600 mb-2">GW{currentGW} Points</div>
                      <div className="text-xl sm:text-2xl font-black text-gray-900">
                        {liveData.entry_history.points}
                      </div>
                    </div>
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                      <div className="text-xs sm:text-sm text-gray-600 mb-2">GW Rank</div>
                      <div className="text-xl sm:text-2xl font-black text-gray-900">
                        {formatNumber(liveData.entry_history.rank)}
                      </div>
                    </div>
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                      <div className="text-xs sm:text-sm text-gray-600 mb-2">Transfers</div>
                      <div className="text-xl sm:text-2xl font-black text-gray-900">
                        {liveData.entry_history.event_transfers}
                        {liveData.entry_history.event_transfers_cost > 0 && (
                          <span className="text-sm text-red-600 ml-2">(-{liveData.entry_history.event_transfers_cost})</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* League Standings Table */}
          {selectedLeague !== 'overall' && leagueData && leagueData.standings && leagueData.standings.results && (
            <Card className="p-3 sm:p-4 md:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {leagueData.league?.name || 'League Standings'}
              </h3>

              {/* Desktop/Tablet View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b-2 border-gray-200">
                    <tr className="text-left text-sm text-gray-600">
                      <th
                        className="pb-3 font-semibold cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('rank')}
                      >
                        <div className="flex items-center">
                          Rank
                          <SortIcon column="rank" />
                        </div>
                      </th>
                      <th className="pb-3 font-semibold">Manager</th>
                      <th className="pb-3 font-semibold">Team Name</th>
                      <th
                        className="pb-3 font-semibold text-center cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('event_total')}
                      >
                        <div className="flex items-center justify-center">
                          GW{currentGW} Points
                          <SortIcon column="event_total" />
                        </div>
                      </th>
                      <th
                        className="pb-3 font-semibold text-center cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('total')}
                      >
                        <div className="flex items-center justify-center">
                          Total Points
                          <SortIcon column="total" />
                        </div>
                      </th>
                      <th className="pb-3 font-semibold text-center">Movement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStandings.map((standing) => {
                      const isCurrentUser = standing.entry === teamInfo.id;
                      const rankChange = getRankChange(standing.rank, standing.last_rank);

                      return (
                        <tr
                          key={standing.entry}
                          className={`border-b border-gray-100 transition-colors ${isCurrentUser ? 'bg-gradient-to-r from-purple-50 to-pink-50 font-bold' : 'hover:bg-gray-50'
                            }`}
                        >
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className={isCurrentUser ? 'text-purple-600 font-black' : 'text-gray-900'}>
                                #{standing.rank}
                              </span>
                              {standing.rank <= 3 && (
                                <Trophy className={`w-4 h-4 ${standing.rank === 1 ? 'text-yellow-500' : standing.rank === 2 ? 'text-gray-400' : 'text-orange-400'}`} />
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className={isCurrentUser ? 'text-purple-600' : 'text-gray-900'}>
                              {standing.player_name}
                              {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className={isCurrentUser ? 'text-purple-600' : 'text-gray-700'}>
                              {standing.entry_name}
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                              {standing.event_total}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${isCurrentUser ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                              {formatNumber(standing.total)}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            {rankChange && (
                              <div className={`flex items-center justify-center gap-1 ${rankChange.color}`}>
                                {rankChange.icon}
                                <span className="text-sm font-semibold">{rankChange.text}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-3">
                {sortedStandings.map((standing) => {
                  const isCurrentUser = standing.entry === teamInfo.id;
                  const rankChange = getRankChange(standing.rank, standing.last_rank);

                  return (
                    <div
                      key={standing.entry}
                      className={`p-4 rounded-lg border-2 ${isCurrentUser
                          ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300'
                          : 'bg-white border-gray-200'
                        }`}
                    >
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-black ${isCurrentUser ? 'text-purple-600' : 'text-gray-900'}`}>
                            #{standing.rank}
                          </span>
                          {standing.rank <= 3 && (
                            <Trophy className={`w-4 h-4 ${standing.rank === 1 ? 'text-yellow-500' : standing.rank === 2 ? 'text-gray-400' : 'text-orange-400'}`} />
                          )}
                          {isCurrentUser && (
                            <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">YOU</span>
                          )}
                        </div>
                        {rankChange && (
                          <div className={`flex items-center gap-1 ${rankChange.color}`}>
                            {rankChange.icon}
                            <span className="text-xs font-semibold">{rankChange.text}</span>
                          </div>
                        )}
                      </div>

                      {/* Manager Info */}
                      <div className="mb-3">
                        <div className={`font-bold text-sm ${isCurrentUser ? 'text-purple-600' : 'text-gray-900'}`}>
                          {standing.player_name}
                        </div>
                        <div className={`text-xs ${isCurrentUser ? 'text-purple-600' : 'text-gray-600'}`}>
                          {standing.entry_name}
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <div className="text-xs text-gray-600 mb-1">GW{currentGW}</div>
                          <div className="text-sm font-bold text-blue-700">{standing.event_total} pts</div>
                        </div>
                        <div className={`rounded-lg p-2 text-center ${isCurrentUser ? 'bg-purple-100' : 'bg-gray-100'}`}>
                          <div className="text-xs text-gray-600 mb-1">Total</div>
                          <div className={`text-sm font-bold ${isCurrentUser ? 'text-purple-700' : 'text-gray-700'}`}>
                            {formatNumber(standing.total)} pts
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {leagueData.standings.has_next && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">Showing page {leagueData.standings.page} of standings</p>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
