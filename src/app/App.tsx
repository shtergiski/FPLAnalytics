import React, { useEffect, useState } from 'react';
import { DashboardLayout } from './components/DashboardLayout';
import { PlayerRadarChart } from './components/PlayerRadarChart';
import { FDRHeatmap } from './components/FDRHeatmap';
import { TeamPitch } from './components/TeamPitch';
import { FixturesComparisonNew } from './components/FixturesComparisonNew';
import { FormVsFixtureScatter } from './components/FormVsFixtureScatter';
import { useFPLStore } from './store/fpl-store';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card } from './components/ui/card';
import { TrendingUp, Activity, Target, Users, Zap, Shield } from 'lucide-react';
import { Button } from './components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import type { Player } from './types/fpl';

// Lazy load new components to avoid initial load issues
const PriceChangesTracker = React.lazy(() => import('./components/PriceChangesTracker').then(m => ({ default: m.PriceChangesTracker })));
const PlayerCardsGallery = React.lazy(() => import('./components/PlayerCardsGallery').then(m => ({ default: m.PlayerCardsGallery })));
const AdvancedAnalytics = React.lazy(() => import('./components/AdvancedAnalytics').then(m => ({ default: m.AdvancedAnalytics })));
const CreatorHub = React.lazy(() => import('./components/CreatorHub').then(m => ({ default: m.CreatorHub })));
const PlayerStats = React.lazy(() => import('./components/PlayerStats').then(m => ({ default: m.PlayerStats })));
const TeamPlannerStudio = React.lazy(() => import('./components/studio/TeamPlannerStudio').then(m => ({ default: m.TeamPlannerStudio })));
const FDRFixturesPage = React.lazy(() => import('./components/FDRFixturesPage').then(m => ({ default: m.FDRFixturesPage })));

export default function App() {
  const { 
    players, 
    teams,
    fixtures,
    isLoading, 
    fetchBootstrapData,
    fetchFixtures,
    getPlayerFixtures,
    getAverageFDR,
    selectedPlayers,
    addPlayerToTeam,
    removePlayerFromTeam,
    budget,
    currentGameweek,
    bootstrap
  } = useFPLStore();

  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Player comparison states
  const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null);
  
  // Dashboard filter states
  const [topPointsFilter, setTopPointsFilter] = useState('all');
  const [inFormFilter, setInFormFilter] = useState('all');

  useEffect(() => {
    fetchBootstrapData();
    fetchFixtures();
  }, [fetchBootstrapData, fetchFixtures]);
  
  // Set default players for comparison when players load
  useEffect(() => {
    if (players.length > 0 && !selectedPlayer1 && !selectedPlayer2) {
      const topPlayers = [...players].sort((a, b) => b.total_points - a.total_points);
      setSelectedPlayer1(topPlayers[0]);
      setSelectedPlayer2(topPlayers[1]);
    }
  }, [players, selectedPlayer1, selectedPlayer2]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-semibold text-lg">Loading FPL Data...</p>
        </div>
      </div>
    );
  }
  
  // Helper to filter players by position
  const getPlayersByPosition = (position: number, limit: number = 10) => {
    return [...players]
      .filter(p => p.element_type === position)
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, limit);
  };
  
  const getTopFormByPosition = (position: number, limit: number = 10) => {
    return [...players]
      .filter(p => p.element_type === position && parseFloat(p.form) > 0)
      .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
      .slice(0, limit);
  };

  // Get filtered top performers
  const getFilteredTopPoints = () => {
    let filtered = [...players];
    if (topPointsFilter === 'gk') filtered = filtered.filter(p => p.element_type === 1);
    if (topPointsFilter === 'def') filtered = filtered.filter(p => p.element_type === 2);
    if (topPointsFilter === 'mid') filtered = filtered.filter(p => p.element_type === 3);
    if (topPointsFilter === 'fwd') filtered = filtered.filter(p => p.element_type === 4);
    return filtered.sort((a, b) => b.total_points - a.total_points).slice(0, 10);
  };

  const getFilteredTopForm = () => {
    let filtered = [...players].filter(p => parseFloat(p.form) > 0);
    if (inFormFilter === 'gk') filtered = filtered.filter(p => p.element_type === 1);
    if (inFormFilter === 'def') filtered = filtered.filter(p => p.element_type === 2);
    if (inFormFilter === 'mid') filtered = filtered.filter(p => p.element_type === 3);
    if (inFormFilter === 'fwd') filtered = filtered.filter(p => p.element_type === 4);
    return filtered.sort((a, b) => parseFloat(b.form) - parseFloat(a.form)).slice(0, 10);
  };

  const topPoints = getFilteredTopPoints();
  const topForm = getFilteredTopForm();
  
  // Calculate interesting dashboard stats - with null checks
  const avgPrice = players.length > 0 ? (players.reduce((sum, p) => sum + p.now_cost, 0) / players.length / 10).toFixed(1) : '0.0';
  const mostSelectedPlayer = players.length > 0 ? [...players].sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))[0] : null;
  
  // Get top 5 transfers in/out
  const topTransfersIn = [...players]
    .filter(p => p.transfers_in_event > 0)
    .sort((a, b) => b.transfers_in_event - a.transfers_in_event)
    .slice(0, 5);
    
  const topTransfersOut = [...players]
    .filter(p => p.transfers_out_event > 0)
    .sort((a, b) => b.transfers_out_event - a.transfers_out_event)
    .slice(0, 5);
    
  // Interesting stat cards - Filter out injured/doubtful players
  // chance_of_playing_next_round: null (100%), 75, 50, 25, 0
  // We exclude players with chance < 75% (injured/doubtful)
  const availablePlayers = players.filter(p => 
    p.chance_of_playing_next_round === null || 
    p.chance_of_playing_next_round >= 75
  );
  
  const bestValuePlayer = availablePlayers.length > 0 ? [...availablePlayers]
    .filter(p => p.total_points > 0 && p.now_cost > 0)
    .map(p => ({ ...p, ppm: p.total_points / (p.now_cost / 10) }))
    .sort((a, b) => b.ppm - a.ppm)[0] : null;
    
  const risingStarPlayer = availablePlayers.length > 0 ? [...availablePlayers]
    .filter(p => p.now_cost < 60 && parseFloat(p.form) > 0) // Under £6m
    .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))[0] : null;
    
  const bestDifferential = availablePlayers.length > 0 ? [...availablePlayers]
    .filter(p => parseFloat(p.selected_by_percent) < 10 && p.total_points > 50)
    .sort((a, b) => b.total_points - a.total_points)[0] : null;
    
  const captainPick = availablePlayers.length > 0 ? [...availablePlayers]
    .filter(p => parseFloat(p.form) > 0)
    .sort((a, b) => (parseFloat(b.form) * b.total_points) - (parseFloat(a.form) * a.total_points))[0] : null;
  
  // Render content based on current page
  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Stats - INTERESTING DATA */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Best Value Player */}
              {bestValuePlayer && (
                <Card className="p-4 sm:p-6 bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
                  <div className="text-xs sm:text-sm font-medium opacity-90">💰 Best Value</div>
                  <div className="text-lg sm:text-xl font-bold mt-1 truncate">{bestValuePlayer.web_name}</div>
                  <div className="text-xs opacity-80 mt-1">{bestValuePlayer.ppm.toFixed(1)} pts/£m • £{(bestValuePlayer.now_cost / 10).toFixed(1)}m</div>
                </Card>
              )}
              
              {/* Rising Star */}
              {risingStarPlayer && (
                <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <div className="text-xs sm:text-sm font-medium opacity-90">⭐ Rising Star</div>
                  <div className="text-lg sm:text-xl font-bold mt-1 truncate">{risingStarPlayer.web_name}</div>
                  <div className="text-xs opacity-80 mt-1">{risingStarPlayer.form} form • Under £6m</div>
                </Card>
              )}
              
              {/* Best Differential */}
              {bestDifferential && (
                <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <div className="text-xs sm:text-sm font-medium opacity-90">🎯 Differential</div>
                  <div className="text-lg sm:text-xl font-bold mt-1 truncate">{bestDifferential.web_name}</div>
                  <div className="text-xs opacity-80 mt-1">{bestDifferential.total_points} pts • {bestDifferential.selected_by_percent}% owned</div>
                </Card>
              )}
              
              {/* Captain Pick */}
              {captainPick && (
                <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                  <div className="text-xs sm:text-sm font-medium opacity-90">🔥 Captain Pick</div>
                  <div className="text-lg sm:text-xl font-bold mt-1 truncate">{captainPick.web_name}</div>
                  <div className="text-xs opacity-80 mt-1">{captainPick.form} form • {captainPick.total_points} pts</div>
                </Card>
              )}
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    Top Points
                  </h3>
                  <Select onValueChange={setTopPointsFilter} value={topPointsFilter}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="gk">GK</SelectItem>
                      <SelectItem value="def">DEF</SelectItem>
                      <SelectItem value="mid">MID</SelectItem>
                      <SelectItem value="fwd">FWD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {topPoints.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs sm:text-sm font-bold text-purple-600">{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">{player.web_name}</div>
                          <div className="text-xs text-gray-600 truncate">{player.team_name}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="font-bold text-base sm:text-lg text-purple-600">{player.total_points}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    In Form
                  </h3>
                  <Select onValueChange={setInFormFilter} value={inFormFilter}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="gk">GK</SelectItem>
                      <SelectItem value="def">DEF</SelectItem>
                      <SelectItem value="mid">MID</SelectItem>
                      <SelectItem value="fwd">FWD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {topForm.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs sm:text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">{player.web_name}</div>
                          <div className="text-xs text-gray-600 truncate">{player.team_name} • £{(player.now_cost / 10).toFixed(1)}m</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="font-bold text-base sm:text-lg text-blue-600">{player.form}</div>
                        <div className="text-xs text-gray-500">form</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            
            {/* Transfer Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    🔥 Transfers In
                  </h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {topTransfersIn.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs sm:text-sm font-bold text-red-600">{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">{player.web_name}</div>
                          <div className="text-xs text-gray-600 truncate">{player.team_name} • £{(player.now_cost / 10).toFixed(1)}m</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="font-bold text-base sm:text-lg text-red-600">{(player.transfers_in_event / 1000).toFixed(0)}k</div>
                        <div className="text-xs text-gray-500">transfers</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    ❄️ Transfers Out
                  </h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {topTransfersOut.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs sm:text-sm font-bold text-gray-600">{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">{player.web_name}</div>
                          <div className="text-xs text-gray-600 truncate">{player.team_name} • £{(player.now_cost / 10).toFixed(1)}m</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="font-bold text-base sm:text-lg text-gray-600">{(player.transfers_out_event / 1000).toFixed(0)}k</div>
                        <div className="text-xs text-gray-500">transfers</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        );

      case 'comparison':
        return (
          players.length >= 2 && selectedPlayer1 && selectedPlayer2 && (
            <div className="space-y-4 sm:space-y-6">
              {/* Player Selection */}
              <Card className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                  Select Players to Compare
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Player 1</label>
                    <Select 
                      value={selectedPlayer1.id.toString()} 
                      onValueChange={(val) => {
                        const player = players.find(p => p.id === parseInt(val));
                        if (player) setSelectedPlayer1(player);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select player..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {players
                          .sort((a, b) => b.total_points - a.total_points)
                          .map(player => (
                            <SelectItem key={player.id} value={player.id.toString()}>
                              {player.web_name} ({player.team_name}) - £{(player.now_cost / 10).toFixed(1)}m
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Player 2</label>
                    <Select 
                      value={selectedPlayer2.id.toString()} 
                      onValueChange={(val) => {
                        const player = players.find(p => p.id === parseInt(val));
                        if (player) setSelectedPlayer2(player);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select player..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {players
                          .sort((a, b) => b.total_points - a.total_points)
                          .map(player => (
                            <SelectItem key={player.id} value={player.id.toString()}>
                              {player.web_name} ({player.team_name}) - £{(player.now_cost / 10).toFixed(1)}m
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
              
              <PlayerRadarChart players={[selectedPlayer1, selectedPlayer2]} />
              
              <Card className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                  Fixture Difficulty Comparison
                </h3>
                <div className="space-y-4 sm:space-y-6">
                  {[selectedPlayer1, selectedPlayer2].map(player => (
                    <div key={player.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">{player.web_name}</div>
                          <div className="text-xs sm:text-sm text-gray-600 truncate">{player.team_name}</div>
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-purple-600 ml-2">
                          £{(player.now_cost / 10).toFixed(1)}m
                        </div>
                      </div>
                      <FDRHeatmap fixtures={getPlayerFixtures(player.id, 5)} />
                    </div>
                  ))}
                </div>
              </Card>

              <FormVsFixtureScatter 
                players={players} 
                getAverageFDR={getAverageFDR}
              />
            </div>
          )
        );

      case 'fixtures':
        return (
          <FixturesComparisonNew 
            players={players}
            teams={teams}
            fixtures={fixtures}
            getPlayerFixtures={getPlayerFixtures}
          />
        );

      case 'price-changes':
        return (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          }>
            <PriceChangesTracker players={players} />
          </React.Suspense>
        );

      case 'export-cards':
        return (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          }>
            <PlayerCardsGallery players={players} />
          </React.Suspense>
        );

      case 'analytics':
        return (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          }>
            <AdvancedAnalytics players={players} />
          </React.Suspense>
        );

      case 'creator-hub':
        return (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          }>
            <CreatorHub players={players} />
          </React.Suspense>
        );

      case 'player-stats':
        return (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          }>
            <PlayerStats players={players} />
          </React.Suspense>
        );

      case 'team-planner':
        return (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          }>
            <TeamPlannerStudio />
          </React.Suspense>
        );

      case 'fdr-fixtures':
        return (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          }>
            <FDRFixturesPage players={players} />
          </React.Suspense>
        );

      default:
        return null;
    }
  };

  // Map page names to display names
  const pageDisplayNames: { [key: string]: string } = {
    'dashboard': 'Dashboard',
    'comparison': 'Player Comparison',
    'fixtures': 'Fixtures',
    'price-changes': 'Price Changes Tracker',
    'export-cards': 'Export Player Cards',
    'analytics': 'Advanced Analytics',
    'creator-hub': 'Creator Hub',
    'player-stats': 'Player Stats',
    'team-planner': 'Team Planner Studio',
    'fdr-fixtures': 'FDR Fixtures Page',
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <DashboardLayout 
        currentPage={pageDisplayNames[currentPage] || 'Dashboard'}
        onNavigate={setCurrentPage}
        activePageId={currentPage}
      >
        {renderContent()}
      </DashboardLayout>
    </DndProvider>
  );
}