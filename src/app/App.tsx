import React, { useEffect, useState } from 'react';
import { DashboardLayout } from './components/DashboardLayout';
import { PlayerRadarChart } from './components/PlayerRadarChart';
import { FDRHeatmap } from './components/FDRHeatmap';
import { TeamPitch } from './components/TeamPitch';
import { FixturesComparison } from './components/FixturesComparison';
import { FormVsFixtureScatter } from './components/FormVsFixtureScatter';
import { useFPLStore } from './store/fpl-store';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card } from './components/ui/card';
import { TrendingUp, Activity } from 'lucide-react';

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

  useEffect(() => {
    fetchBootstrapData();
    fetchFixtures();
  }, [fetchBootstrapData, fetchFixtures]);

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

  // Get top performers
  const topPoints = [...players]
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 8);

  const topForm = [...players]
    .filter(p => parseFloat(p.form) > 0)
    .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
    .slice(0, 8);

  // Render content based on current page
  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div className="text-sm font-medium opacity-90">Team Value</div>
                <div className="text-3xl font-bold mt-2">£{(budget / 10).toFixed(1)}m</div>
                <div className="text-xs opacity-80 mt-1">Available budget</div>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div className="text-sm font-medium opacity-90">Current Gameweek</div>
                <div className="text-3xl font-bold mt-2">GW {currentGameweek}</div>
                <div className="text-xs opacity-80 mt-1">2024/25 Season</div>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div className="text-sm font-medium opacity-90">Total Players</div>
                <div className="text-3xl font-bold mt-2">{players.length}</div>
                <div className="text-xs opacity-80 mt-1">In database</div>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-pink-500 to-pink-600 text-white">
                <div className="text-sm font-medium opacity-90">Selected</div>
                <div className="text-3xl font-bold mt-2">{selectedPlayers.length}/15</div>
                <div className="text-xs opacity-80 mt-1">Players in squad</div>
              </Card>
            </div>

            {/* Top Performers */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Top Points
                  </h3>
                </div>
                <div className="space-y-3">
                  {topPoints.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-purple-600">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{player.web_name}</div>
                          <div className="text-xs text-gray-600">{player.team_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-purple-600">{player.total_points}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    In Form
                  </h3>
                </div>
                <div className="space-y-3">
                  {topForm.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{player.web_name}</div>
                          <div className="text-xs text-gray-600">{player.team_name} • £{(player.now_cost / 10).toFixed(1)}m</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-blue-600">{player.form}</div>
                        <div className="text-xs text-gray-500">form</div>
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
          players.length >= 2 && (
            <div className="space-y-6">
              <PlayerRadarChart players={[players[0], players[1]]} />
              
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Fixture Difficulty Comparison
                </h3>
                <div className="space-y-6">
                  {[players[0], players[1]].map(player => (
                    <div key={player.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{player.web_name}</div>
                          <div className="text-sm text-gray-600">{player.team_name}</div>
                        </div>
                        <div className="text-sm font-semibold text-purple-600">
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
          <div className="-m-6">
            <FixturesComparison 
              players={players}
              getPlayerFixtures={getPlayerFixtures}
              startGW={28}
              endGW={33}
            />
          </div>
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