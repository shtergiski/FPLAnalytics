import React, { useState, useRef } from 'react';
import { X, Search, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { ExportService } from '../utils/exportService';
import type { Player, PlayerFixture, Team, Fixture } from '../types/fpl';

interface FixturesComparisonNewProps {
  players: Player[];
  teams: Team[];
  fixtures: Fixture[];
  getPlayerFixtures: (playerId: number, count?: number) => PlayerFixture[];
}

const getDifficultyColor = (difficulty: number): string => {
  switch (difficulty) {
    case 1:
      return 'bg-[#01FC7C] text-gray-900'; // Dark Green
    case 2:
      return 'bg-[#00FF87] text-gray-900'; // Light Green
    case 3:
      return 'bg-gray-400 text-white'; // Gray
    case 4:
      return 'bg-[#FF1751] text-white'; // Pink/Red
    case 5:
      return 'bg-[#861134] text-white'; // Dark Red
    default:
      return 'bg-gray-300 text-gray-700';
  }
};

type PositionFilter = 'all' | 'gk' | 'def' | 'mid' | 'fwd';
type TabType = 'players' | 'teams';

interface TeamFixture {
  gameweek: number;
  opponent: string;
  opponentShort: string;
  isHome: boolean;
  difficulty: number;
}

export function FixturesComparisonNew({ players, teams, fixtures, getPlayerFixtures }: FixturesComparisonNewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('players');
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);

  const maxSelection = 2;

  // Get team fixtures with FDR
  const getTeamFixtures = (teamId: number, count: number = 8): TeamFixture[] => {
    const upcomingFixtures = fixtures
      .filter(f => !f.finished && (f.team_h === teamId || f.team_a === teamId))
      .sort((a, b) => {
        // Sort by event number, handling null events
        const aEvent = a.event ?? 999;
        const bEvent = b.event ?? 999;
        return aEvent - bEvent;
      })
      .slice(0, count);

    return upcomingFixtures.map(f => {
      const isHome = f.team_h === teamId;
      const opponentId = isHome ? f.team_a : f.team_h;
      const opponent = teams.find(t => t.id === opponentId);
      const difficulty = isHome ? (f.team_h_difficulty || 3) : (f.team_a_difficulty || 3);

      return {
        gameweek: f.event || 0,
        opponent: opponent?.name || 'Unknown',
        opponentShort: opponent?.short_name || 'UNK',
        isHome,
        difficulty,
      };
    });
  };

  // Filter players by position and search
  const getFilteredPlayers = () => {
    let filtered = [...players].sort((a, b) => b.total_points - a.total_points);
    
    if (positionFilter === 'gk') filtered = filtered.filter(p => p.element_type === 1);
    if (positionFilter === 'def') filtered = filtered.filter(p => p.element_type === 2);
    if (positionFilter === 'mid') filtered = filtered.filter(p => p.element_type === 3);
    if (positionFilter === 'fwd') filtered = filtered.filter(p => p.element_type === 4);
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.web_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.team_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered.slice(0, 100);
  };

  // Filter teams by search
  const getFilteredTeams = () => {
    let filtered = [...teams].sort((a, b) => a.name.localeCompare(b.name));
    
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.short_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredPlayers = getFilteredPlayers();
  const filteredTeams = getFilteredTeams();

  const handleSelectPlayer = (player: Player) => {
    if (selectedPlayers.find(p => p.id === player.id)) return;
    if (selectedPlayers.length >= maxSelection) {
      setSelectedPlayers([selectedPlayers[1], player]);
    } else {
      setSelectedPlayers([...selectedPlayers, player]);
    }
    setShowSelectionModal(false);
  };

  const handleSelectTeam = (team: Team) => {
    if (selectedTeams.find(t => t.id === team.id)) return;
    if (selectedTeams.length >= maxSelection) {
      setSelectedTeams([selectedTeams[1], team]);
    } else {
      setSelectedTeams([...selectedTeams, team]);
    }
    setShowSelectionModal(false);
  };

  const handleRemovePlayer = (playerId: number) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId));
  };

  const handleRemoveTeam = (teamId: number) => {
    setSelectedTeams(selectedTeams.filter(t => t.id !== teamId));
  };

  const getPositionName = (elementType: number) => {
    const positions: { [key: number]: string } = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
    return positions[elementType] || '';
  };

  const handleDownloadPlayers = async () => {
    if (!comparisonRef.current) return;
    setIsDownloading(true);
    try {
      const fileName = `fixtures-comparison-${selectedPlayers[0]?.web_name}-vs-${selectedPlayers[1]?.web_name}`;
      await ExportService.exportCard(comparisonRef.current, fileName);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadTeams = async () => {
    if (!comparisonRef.current) return;
    setIsDownloading(true);
    try {
      const fileName = `fixtures-comparison-${selectedTeams[0]?.short_name}-vs-${selectedTeams[1]?.short_name}`;
      await ExportService.exportCard(comparisonRef.current, fileName);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery('');
    setPositionFilter('all');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Card with Tabs */}
      <Card className="p-4 sm:p-6 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600">
        <div className="text-center mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Fixtures Comparison
          </h2>
          <p className="text-white/90 text-sm sm:text-base">
            Compare fixtures side-by-side to make informed decisions
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={() => handleTabChange('players')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'players'
                ? 'bg-white text-purple-600 shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            👤 Player Comparison
          </button>
          <button
            onClick={() => handleTabChange('teams')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'teams'
                ? 'bg-white text-purple-600 shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            🏟️ Team Comparison
          </button>
        </div>
      </Card>

      {/* Player Comparison Tab */}
      {activeTab === 'players' && (
        <>
          {/* Selected Players Bar */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Selected Players ({selectedPlayers.length}/2)</h3>
              <Button
                onClick={() => setShowSelectionModal(true)}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                + Add Player
              </Button>
            </div>

            {selectedPlayers.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <div className="text-4xl mb-2">⚽</div>
                <p className="text-sm text-gray-600 mb-3">No players selected yet</p>
                <Button
                  onClick={() => setShowSelectionModal(true)}
                  variant="outline"
                  size="sm"
                >
                  Select Players to Compare
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200"
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img
                        src={`https://resources.premierleague.com/premierleague/photos/players/40x40/p${player.code}.png`}
                        alt={player.web_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) parent.innerHTML = '<div class="text-2xl">👤</div>';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-gray-900 truncate">
                        {player.web_name}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {player.team_name} • £{(player.now_cost / 10).toFixed(1)}m
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="p-1.5 hover:bg-red-100 rounded-full transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Player Fixtures Comparison */}
          {selectedPlayers.length === 2 && (
            <>
              {/* VISIBLE Comparison - Mobile Friendly (stacks on mobile) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {selectedPlayers.map((player) => {
                  const fixtures = getPlayerFixtures(player.id, 8);
                  const relevantFixtures = fixtures.slice(0, 8);
                  const avgFDR = relevantFixtures.length > 0
                    ? (relevantFixtures.reduce((sum, f) => sum + (f.difficulty || 0), 0) / relevantFixtures.length).toFixed(2)
                    : 'N/A';

                  return (
                    <Card key={player.id} className="p-4 sm:p-6 bg-white">
                      {/* Player Header */}
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-gray-100">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img
                            src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`}
                            alt={player.web_name}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="text-center text-purple-600"><div class="text-3xl font-black leading-none mb-1">${player.web_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div><div class="text-xs font-bold opacity-80">${getPositionName(player.element_type)}</div></div>`;
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                            {player.web_name}
                          </div>
                          <div className="text-sm text-gray-600 truncate mb-2">
                            {player.team_name} • {getPositionName(player.element_type)}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                              £{(player.now_cost / 10).toFixed(1)}m
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                              {player.total_points} pts
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              {player.form} form
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Ownership</div>
                          <div className="text-sm font-bold text-gray-900">{player.selected_by_percent}%</div>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Avg FDR</div>
                          <div className="text-sm font-bold text-purple-600">{avgFDR}</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Fixtures</div>
                          <div className="text-sm font-bold text-blue-600">{relevantFixtures.length}</div>
                        </div>
                      </div>

                      {/* Fixtures List */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-3">Next 8 Fixtures</h4>
                        <div className="space-y-2">
                          {relevantFixtures.map((fixture, idx) => (
                            <div
                              key={idx}
                              className={`${getDifficultyColor(fixture.difficulty || 0)} rounded-lg py-3 px-4 shadow-sm`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-medium opacity-75 mb-0.5">
                                    GW {fixture.gameweek}
                                  </div>
                                  <div className="text-base sm:text-lg font-bold">
                                    {fixture.opponent}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-black opacity-90">
                                    {fixture.isHome ? 'H' : 'A'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {relevantFixtures.length === 0 && (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600">No fixtures available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* HIDDEN Export Version - Always Side by Side */}
              <div ref={comparisonRef} className="absolute -left-[9999px] bg-white p-6 rounded-xl" style={{ width: '1200px' }}>
                {/* Header */}
                <div className="text-center mb-6 pb-4 border-b-2 border-purple-200">
                  <h2 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    PLAYER FIXTURES COMPARISON
                  </h2>
                  <p className="text-sm text-gray-600">Gameweek Analysis • Season 2024/25</p>
                </div>

                {/* Players Side by Side - ALWAYS 2 columns for export */}
                <div className="grid grid-cols-2 gap-6">
                  {selectedPlayers.map((player) => {
                    const fixtures = getPlayerFixtures(player.id, 8);
                    const relevantFixtures = fixtures.slice(0, 8);
                    const avgFDR = relevantFixtures.length > 0
                      ? (relevantFixtures.reduce((sum, f) => sum + (f.difficulty || 0), 0) / relevantFixtures.length).toFixed(2)
                      : 'N/A';

                    return (
                      <Card key={player.id} className="p-6 bg-white">
                        {/* Player Header */}
                        <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-gray-100">
                          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img
                              src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`}
                              alt={player.web_name}
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="text-center text-purple-600"><div class="text-3xl font-black leading-none mb-1">${player.web_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div><div class="text-xs font-bold opacity-80">${getPositionName(player.element_type)}</div></div>`;
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-2xl font-bold text-gray-900 truncate">
                              {player.web_name}
                            </div>
                            <div className="text-sm text-gray-600 truncate mb-2">
                              {player.team_name} • {getPositionName(player.element_type)}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                                £{(player.now_cost / 10).toFixed(1)}m
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                {player.total_points} pts
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                {player.form} form
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">Ownership</div>
                            <div className="text-sm font-bold text-gray-900">{player.selected_by_percent}%</div>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">Avg FDR</div>
                            <div className="text-sm font-bold text-purple-600">{avgFDR}</div>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">Fixtures</div>
                            <div className="text-sm font-bold text-blue-600">{relevantFixtures.length}</div>
                          </div>
                        </div>

                        {/* Fixtures List */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-3">Next 8 Fixtures</h4>
                          <div className="space-y-2">
                            {relevantFixtures.map((fixture, idx) => (
                              <div
                                key={idx}
                                className={`${getDifficultyColor(fixture.difficulty || 0)} rounded-lg py-3 px-4 shadow-sm`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-xs font-medium opacity-75 mb-0.5">
                                      GW {fixture.gameweek}
                                    </div>
                                    <div className="text-lg font-bold">
                                      {fixture.opponent}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-black opacity-90">
                                      {fixture.isHome ? 'H' : 'A'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Brand Watermark Footer */}
                <div className="flex items-center justify-center pt-6 mt-6 border-t-2 border-purple-200">
                  <div className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-6 py-3 shadow-lg">
                    <div className="text-3xl">⚽</div>
                    <div>
                      <div className="font-black text-white text-lg leading-tight">@FPL_Dave_</div>
                      <div className="text-xs text-white/90 leading-tight">FPL Analytics Pro</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <div className="text-center">
                <Button
                  onClick={handleDownloadPlayers}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                  disabled={isDownloading}
                >
                  <Download className="w-5 h-5 mr-2" />
                  {isDownloading ? 'Downloading...' : 'Download Comparison'}
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* Team Comparison Tab */}
      {activeTab === 'teams' && (
        <>
          {/* Selected Teams Bar */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Selected Teams ({selectedTeams.length}/2)</h3>
              <Button
                onClick={() => setShowSelectionModal(true)}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                + Add Team
              </Button>
            </div>

            {selectedTeams.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <div className="text-4xl mb-2">🏟️</div>
                <p className="text-sm text-gray-600 mb-3">No teams selected yet</p>
                <Button
                  onClick={() => setShowSelectionModal(true)}
                  variant="outline"
                  size="sm"
                >
                  Select Teams to Compare
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedTeams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <img
                        src={`https://resources.premierleague.com/premierleague/badges/t${team.code}.png`}
                        alt={team.name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) parent.innerHTML = '<div class="text-2xl">🏟️</div>';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-gray-900 truncate">
                        {team.name}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {team.short_name} • Strength: {team.strength}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveTeam(team.id)}
                      className="p-1.5 hover:bg-red-100 rounded-full transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Team Fixtures Comparison */}
          {selectedTeams.length === 2 && (
            <>
              <div ref={comparisonRef} className="bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 rounded-2xl p-6 space-y-6">
                {/* Export Header */}
                <div className="text-center pb-4 border-b-2 border-purple-200">
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
                    TEAM FIXTURES COMPARISON
                  </h2>
                  <p className="text-sm text-gray-600">
                    Gameweek Analysis • Season 2025/26
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {selectedTeams.map((team) => {
                    const teamFixtures = getTeamFixtures(team.id, 8);
                    const avgFDR = teamFixtures.length > 0
                      ? (teamFixtures.reduce((sum, f) => sum + f.difficulty, 0) / teamFixtures.length).toFixed(2)
                      : 'N/A';

                    return (
                      <Card key={team.id} className="p-4 sm:p-6 bg-white">
                        {/* Team Header */}
                        <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-gray-100">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center p-4 flex-shrink-0">
                            <img
                              src={`https://resources.premierleague.com/premierleague/badges/t${team.code}.png`}
                              alt={team.name}
                              crossOrigin="anonymous"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="text-center text-purple-600"><div class="text-3xl font-black leading-none">${team.short_name}</div></div>`;
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                              {team.name}
                            </div>
                            <div className="text-sm text-gray-600 truncate mb-2">
                              {team.short_name}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                                Overall: {team.strength}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                Attack: {team.strength_attack_home}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                Defence: {team.strength_defence_home}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">Position</div>
                            <div className="text-sm font-bold text-gray-900">{team.position || '-'}</div>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">Avg FDR</div>
                            <div className="text-sm font-bold text-purple-600">{avgFDR}</div>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">Fixtures</div>
                            <div className="text-sm font-bold text-blue-600">{teamFixtures.length}</div>
                          </div>
                        </div>

                        {/* Fixtures List */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-3">Next 8 Fixtures</h4>
                          <div className="space-y-2">
                            {teamFixtures.map((fixture, idx) => (
                              <div
                                key={idx}
                                className={`${getDifficultyColor(fixture.difficulty)} rounded-lg py-3 px-4 shadow-sm`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-xs font-medium opacity-75 mb-0.5">
                                      GW {fixture.gameweek}
                                    </div>
                                    <div className="text-base sm:text-lg font-bold">
                                      {fixture.opponentShort}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-black opacity-90">
                                      {fixture.isHome ? 'H' : 'A'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {teamFixtures.length === 0 && (
                              <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">No fixtures available</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Brand Watermark Footer */}
                <div className="flex items-center justify-center pt-4 border-t-2 border-purple-200">
                  <div className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-6 py-3 shadow-lg">
                    <div className="text-3xl">⚽</div>
                    <div>
                      <div className="font-black text-white text-lg leading-tight">@FPL_Dave_</div>
                      <div className="text-xs text-white/90 leading-tight">FPL Analytics Pro</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <div className="text-center">
                <Button
                  onClick={handleDownloadTeams}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                  disabled={isDownloading}
                >
                  <Download className="w-5 h-5 mr-2" />
                  {isDownloading ? 'Downloading...' : 'Download Comparison'}
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* FDR Legend */}
      {((activeTab === 'players' && selectedPlayers.length === 2) || (activeTab === 'teams' && selectedTeams.length === 2)) && (
        <Card className="p-4 sm:p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Fixture Difficulty Rating (FDR)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            {[
              { diff: 1, label: 'Very Easy', color: 'bg-[#01FC7C]' },
              { diff: 2, label: 'Easy', color: 'bg-[#00FF87]' },
              { diff: 3, label: 'Medium', color: 'bg-gray-400' },
              { diff: 4, label: 'Hard', color: 'bg-[#FF1751]' },
              { diff: 5, label: 'Very Hard', color: 'bg-[#861134]' },
            ].map((item) => (
              <div key={item.diff} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 ${item.color} rounded flex items-center justify-center flex-shrink-0`}>
                  <span className="text-xs font-bold text-white">{item.diff}</span>
                </div>
                <div className="text-xs font-medium text-gray-700">{item.label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Selection Modal */}
      {showSelectionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {activeTab === 'players' ? 'Select Player' : 'Select Team'}
                </h3>
                <button
                  onClick={() => setShowSelectionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={activeTab === 'players' ? 'Search players...' : 'Search teams...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Position Filters (only for players) */}
              {activeTab === 'players' && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {[
                    { key: 'all', label: 'All Players', icon: '⚽' },
                    { key: 'gk', label: 'Goalkeepers', icon: '🧤' },
                    { key: 'def', label: 'Defenders', icon: '🛡️' },
                    { key: 'mid', label: 'Midfielders', icon: '⚡' },
                    { key: 'fwd', label: 'Forwards', icon: '🎯' },
                  ].map((pos) => (
                    <button
                      key={pos.key}
                      onClick={() => setPositionFilter(pos.key as PositionFilter)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                        positionFilter === pos.key
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">{pos.icon}</span>
                      {pos.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="text-xs text-gray-500 mb-3 font-medium">
                {activeTab === 'players' 
                  ? `${filteredPlayers.length} PLAYERS SHOWN`
                  : `${filteredTeams.length} TEAMS SHOWN`
                }
              </div>

              {/* Player List */}
              {activeTab === 'players' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredPlayers.map((player, index) => {
                    const isSelected = selectedPlayers.find(p => p.id === player.id);
                    return (
                      <button
                        key={player.id}
                        onClick={() => handleSelectPlayer(player)}
                        disabled={!!isSelected}
                        className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                          isSelected
                            ? 'bg-purple-100 border-2 border-purple-300 opacity-60 cursor-not-allowed'
                            : 'bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-300 hover:shadow-md'
                        }`}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-gray-900 truncate">
                            {player.web_name}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {player.team_name} • {getPositionName(player.element_type)}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-purple-600">
                            £{(player.now_cost / 10).toFixed(1)}m
                          </div>
                          <div className="text-xs text-gray-500">
                            {player.total_points} pts
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Team List */}
              {activeTab === 'teams' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredTeams.map((team, index) => {
                    const isSelected = selectedTeams.find(t => t.id === team.id);
                    return (
                      <button
                        key={team.id}
                        onClick={() => handleSelectTeam(team)}
                        disabled={!!isSelected}
                        className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                          isSelected
                            ? 'bg-purple-100 border-2 border-purple-300 opacity-60 cursor-not-allowed'
                            : 'bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-300 hover:shadow-md'
                        }`}
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <img
                            src={`https://resources.premierleague.com/premierleague/badges/t${team.code}.png`}
                            alt={team.name}
                            className="w-10 h-10 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) parent.innerHTML = '<div class="text-2xl">🏟️</div>';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-gray-900 truncate">
                            {team.name}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {team.short_name} • Strength: {team.strength}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-purple-600">
                            Pos {team.position || '-'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}