import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Download, Loader2, RefreshCw, User, DollarSign, TrendingUp, AlertCircle, Calendar, Plus, ArrowRightLeft, Save, Users, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Player } from '../../types/fpl';
import { useFPLStore } from '../../store/fpl-store';
import { FPLService } from '../../utils/corsProxy';
import { ExportService } from '../../utils/exportService';

interface SquadPlayer {
  id: number;
  webName: string;
  firstName: string;
  secondName: string;
  position: 'GKP' | 'DEF' | 'MID' | 'FWD';
  teamCode: number;
  teamId: number;
  photoCode: string;
  now_cost: number;
  selected_by_percent: string;
  total_points: number;
  form: string;
  teamName: string;
  teamShortName: string;
}

type Formation = '3-4-3' | '3-5-2' | '4-3-3' | '4-4-2' | '4-5-1' | '5-3-2' | '5-4-1';

const FORMATIONS: Record<Formation, { def: number; mid: number; fwd: number }> = {
  '3-4-3': { def: 3, mid: 4, fwd: 3 },
  '3-5-2': { def: 3, mid: 5, fwd: 2 },
  '4-3-3': { def: 4, mid: 3, fwd: 3 },
  '4-4-2': { def: 4, mid: 4, fwd: 2 },
  '4-5-1': { def: 4, mid: 5, fwd: 1 },
  '5-3-2': { def: 5, mid: 3, fwd: 2 },
  '5-4-1': { def: 5, mid: 4, fwd: 1 },
};

export function TeamPlannerStudio() {
  const { bootstrap, fetchBootstrapData } = useFPLStore();
  
  // State
  const [players, setPlayers] = useState<Player[]>([]);
  const [startingXI, setStartingXI] = useState<(SquadPlayer | null)[]>(Array(11).fill(null));
  const [bench, setBench] = useState<(SquadPlayer | null)[]>(Array(4).fill(null));
  const [formation, setFormation] = useState<Formation>('4-4-2');
  const [selectedSlot, setSelectedSlot] = useState<{ type: 'starting' | 'bench'; index: number } | null>(null);
  const [transferMode, setTransferMode] = useState(false);
  const [transferOut, setTransferOut] = useState<SquadPlayer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<'ALL' | 'GKP' | 'DEF' | 'MID' | 'FWD'>('ALL');
  const [fplId, setFplId] = useState('');
  const [teamName, setTeamName] = useState('My FPL Team');
  const [loading, setLoading] = useState(false);
  const [captain, setCaptain] = useState<number | null>(null);
  const [viceCaptain, setViceCaptain] = useState<number | null>(null);
  const [isFPLTeamLoaded, setIsFPLTeamLoaded] = useState(false); // Track if official FPL team was loaded
  const pitchRef = useRef<HTMLDivElement>(null); // Ref for export

  // Load bootstrap data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!bootstrap) {
        await fetchBootstrapData();
      }
      if (bootstrap?.elements) {
        setPlayers(bootstrap.elements);
      }
    };
    loadData();
  }, [bootstrap, fetchBootstrapData]);

  // Auto-detect formation based on starting XI
  useEffect(() => {
    const startingPlayers = startingXI.filter(p => p !== null) as SquadPlayer[];
    
    // Skip GKP in position 0
    const outfieldPlayers = startingPlayers.slice(1);
    
    if (outfieldPlayers.length >= 10) {
      const defCount = outfieldPlayers.filter(p => p.position === 'DEF').length;
      const midCount = outfieldPlayers.filter(p => p.position === 'MID').length;
      const fwdCount = outfieldPlayers.filter(p => p.position === 'FWD').length;
      
      const detectedFormation = `${defCount}-${midCount}-${fwdCount}` as Formation;
      
      // Check if it's a valid formation
      if (FORMATIONS[detectedFormation]) {
        setFormation(detectedFormation);
      }
    }
  }, [startingXI]);

  // Load FPL Team
  const loadFPLTeam = async () => {
    if (!fplId) return;
    
    setLoading(true);
    try {
      const teamData = await FPLService.getEntry(parseInt(fplId));
      const picksData = await FPLService.getEntryPicks(parseInt(fplId), 27);
      
      setTeamName(teamData.name);
      
      const starting: (SquadPlayer | null)[] = Array(11).fill(null);
      const benchPlayers: (SquadPlayer | null)[] = Array(4).fill(null);
      
      picksData.picks.forEach((pick: any) => {
        const player = players.find(p => p.id === pick.element);
        if (!player) return;
        
        const posMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' } as const;
        const teamData = bootstrap?.teams?.find(t => t.id === player.team);
        
        const squadPlayer: SquadPlayer = {
          id: player.id,
          webName: player.web_name,
          firstName: player.first_name,
          secondName: player.second_name,
          position: posMap[player.element_type as keyof typeof posMap],
          teamCode: player.team_code,
          teamId: player.team,
          photoCode: String(player.code),
          now_cost: player.now_cost,
          selected_by_percent: player.selected_by_percent,
          total_points: player.total_points,
          form: player.form,
          teamName: teamData?.name || '',
          teamShortName: teamData?.short_name || '',
        };
        
        if (pick.position <= 11) {
          starting[pick.position - 1] = squadPlayer;
        } else {
          benchPlayers[pick.position - 12] = squadPlayer;
        }
        
        if (pick.is_captain) setCaptain(squadPlayer.id);
        if (pick.is_vice_captain) setViceCaptain(squadPlayer.id);
      });
      
      setStartingXI(starting);
      setBench(benchPlayers);
      setIsFPLTeamLoaded(true);
      
    } catch (error) {
      console.error('Failed to load FPL team:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate squad composition
  const allPlayers = [...startingXI, ...bench].filter(p => p !== null) as SquadPlayer[];
  const squadComposition = {
    GKP: allPlayers.filter(p => p.position === 'GKP').length,
    DEF: allPlayers.filter(p => p.position === 'DEF').length,
    MID: allPlayers.filter(p => p.position === 'MID').length,
    FWD: allPlayers.filter(p => p.position === 'FWD').length,
  };

  // Team count per club
  const teamCounts = allPlayers.reduce((acc, p) => {
    acc[p.teamId] = (acc[p.teamId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const totalCost = allPlayers.reduce((sum, p) => sum + p.now_cost, 0) / 10;
  const remainingBudget = 100 - totalCost;

  // FPL Transfer Rules validation
  const validateTransfer = (playerIn: Player, playerOut: SquadPlayer) => {
    const errors: string[] = [];
    
    // Check budget
    const priceDiff = playerIn.now_cost - playerOut.now_cost;
    const budgetAfterTransfer = remainingBudget - (priceDiff / 10);
    if (budgetAfterTransfer < 0) {
      errors.push(`Insufficient budget. Need £${Math.abs(budgetAfterTransfer).toFixed(1)}m more.`);
    }
    
    // Check squad composition after transfer
    const posMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
    const playerInPosition = posMap[playerIn.element_type as keyof typeof posMap] as 'GKP' | 'DEF' | 'MID' | 'FWD';
    
    const newComposition = { ...squadComposition };
    newComposition[playerOut.position]--;
    newComposition[playerInPosition]++;
    
    // Squad must have: 2 GKP, 5 DEF, 5 MID, 3 FWD
    const requiredComposition = { GKP: 2, DEF: 5, MID: 5, FWD: 3 };
    if (newComposition.GKP !== requiredComposition.GKP) {
      errors.push(`Squad must have exactly 2 Goalkeepers.`);
    }
    if (newComposition.DEF !== requiredComposition.DEF) {
      errors.push(`Squad must have exactly 5 Defenders.`);
    }
    if (newComposition.MID !== requiredComposition.MID) {
      errors.push(`Squad must have exactly 5 Midfielders.`);
    }
    if (newComposition.FWD !== requiredComposition.FWD) {
      errors.push(`Squad must have exactly 3 Forwards.`);
    }
    
    // Check max 3 players from same team
    const newTeamCounts = { ...teamCounts };
    if (playerOut.teamId) newTeamCounts[playerOut.teamId]--;
    newTeamCounts[playerIn.team] = (newTeamCounts[playerIn.team] || 0) + 1;
    
    if (newTeamCounts[playerIn.team] > 3) {
      const teamData = bootstrap?.teams?.find(t => t.id === playerIn.team);
      errors.push(`Maximum 3 players from ${teamData?.name || 'same team'}.`);
    }
    
    return errors;
  };

  // Filter players for transfer mode
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.web_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.second_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesPosition = true;
    if (positionFilter !== 'ALL') {
      const posMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
      matchesPosition = posMap[player.element_type as keyof typeof posMap] === positionFilter;
    }
    
    // TRANSFER MODE: Show validation but don't filter
    // Users can see all players and get feedback on why transfer isn't allowed
    
    return matchesSearch && matchesPosition;
  }).slice(0, 120).sort((a, b) => b.total_points - a.total_points);

  // Check if player is in squad
  const isInSquad = (playerId: number) => {
    return [...startingXI, ...bench].some(p => p?.id === playerId);
  };

  // Add player to selected slot
  const addPlayerToSlot = (player: Player) => {
    if (!selectedSlot) return;
    
    const posMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' } as const;
    const teamData = bootstrap?.teams?.find(t => t.id === player.team);
    
    const squadPlayer: SquadPlayer = {
      id: player.id,
      webName: player.web_name,
      firstName: player.first_name,
      secondName: player.second_name,
      position: posMap[player.element_type as keyof typeof posMap],
      teamCode: player.team_code,
      teamId: player.team,
      photoCode: String(player.code),
      now_cost: player.now_cost,
      selected_by_percent: player.selected_by_percent,
      total_points: player.total_points,
      form: player.form,
      teamName: teamData?.name || '',
      teamShortName: teamData?.short_name || '',
    };
    
    if (selectedSlot.type === 'starting') {
      const newStarting = [...startingXI];
      newStarting[selectedSlot.index] = squadPlayer;
      setStartingXI(newStarting);
    } else {
      const newBench = [...bench];
      newBench[selectedSlot.index] = squadPlayer;
      setBench(newBench);
    }
    
    setSelectedSlot(null);
  };

  // Transfer player
  const handleTransferIn = (player: Player) => {
    if (!transferOut) return;
    
    // Validate transfer
    const errors = validateTransfer(player, transferOut);
    if (errors.length > 0) {
      alert('Transfer not allowed:\n\n' + errors.join('\n'));
      return;
    }
    
    const posMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' } as const;
    const teamData = bootstrap?.teams?.find(t => t.id === player.team);
    
    const squadPlayer: SquadPlayer = {
      id: player.id,
      webName: player.web_name,
      firstName: player.first_name,
      secondName: player.second_name,
      position: posMap[player.element_type as keyof typeof posMap],
      teamCode: player.team_code,
      teamId: player.team,
      photoCode: String(player.code),
      now_cost: player.now_cost,
      selected_by_percent: player.selected_by_percent,
      total_points: player.total_points,
      form: player.form,
      teamName: teamData?.name || '',
      teamShortName: teamData?.short_name || '',
    };
    
    // Replace in starting XI or bench
    const startingIndex = startingXI.findIndex(p => p?.id === transferOut.id);
    if (startingIndex !== -1) {
      const newStarting = [...startingXI];
      newStarting[startingIndex] = squadPlayer;
      setStartingXI(newStarting);
    } else {
      const benchIndex = bench.findIndex(p => p?.id === transferOut.id);
      if (benchIndex !== -1) {
        const newBench = [...bench];
        newBench[benchIndex] = squadPlayer;
        setBench(newBench);
      }
    }
    
    setTransferOut(null);
    setTransferMode(false);
  };

  const totalPoints = allPlayers.reduce((sum, p) => sum + p.total_points, 0);
  const formationLayout = FORMATIONS[formation];

  return (
    <div className="space-y-6">
      {/* Team Load Section */}
      <Card className="p-6 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{teamName}</h2>
            <p className="text-sm opacity-90 mt-1">Load your FPL team or build from scratch</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Input
              placeholder="Enter FPL ID..."
              value={fplId}
              onChange={(e) => setFplId(e.target.value)}
              className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
            />
            <Button 
              onClick={loadFPLTeam}
              disabled={loading || !fplId}
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load Team'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Team Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-6 bg-[#1e293b] text-white">
          <div className="text-xs sm:text-sm text-gray-400">Team Value</div>
          <div className="text-xl sm:text-3xl font-bold text-[#00ff85] mt-1 sm:mt-2">£{totalCost.toFixed(1)}m</div>
          <div className="text-[10px] sm:text-xs text-gray-400 mt-1">{allPlayers.length}/15 players</div>
        </Card>
        <Card className="p-3 sm:p-6 bg-[#1e293b] text-white">
          <div className="text-xs sm:text-sm text-gray-400">Budget Remaining</div>
          <div className="text-xl sm:text-3xl font-bold text-white mt-1 sm:mt-2">£{remainingBudget.toFixed(1)}m</div>
          <div className="text-[10px] sm:text-xs text-gray-400 mt-1">Available</div>
        </Card>
        <Card className="p-3 sm:p-6 bg-[#1e293b] text-white">
          <div className="text-xs sm:text-sm text-gray-400">Squad Composition</div>
          <div className="text-sm sm:text-base font-bold text-white mt-1 sm:mt-2">
            {squadComposition.GKP}-{squadComposition.DEF}-{squadComposition.MID}-{squadComposition.FWD}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400 mt-1">GKP-DEF-MID-FWD</div>
        </Card>
        <Card className="p-3 sm:p-6 bg-[#1e293b] text-white">
          <div className="text-xs sm:text-sm text-gray-400">Total Points</div>
          <div className="text-xl sm:text-3xl font-bold text-white mt-1 sm:mt-2">{totalPoints}</div>
          <div className="text-[10px] sm:text-xs text-gray-400 mt-1">Season total</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Left Column - Player Database */}
        <Card className="p-4 sm:p-6 lg:col-span-1 order-2 lg:order-1">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              {transferMode ? 'Transfer In' : 'Add Players'}
            </h3>
            <Button
              variant={transferMode ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => {
                setTransferMode(!transferMode);
                setTransferOut(null);
              }}
              className="text-xs sm:text-sm"
            >
              <ArrowRightLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {transferMode ? 'Cancel' : 'Transfer'}
            </Button>
          </div>

          {transferMode && !transferOut && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
              <div className="text-xs sm:text-sm font-semibold text-amber-900">
                Step 1: Click a player in your squad to transfer out
              </div>
            </div>
          )}

          {transferMode && transferOut && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
              <div className="text-xs sm:text-sm font-semibold text-green-900">
                Transferring out: {transferOut.webName} ({transferOut.position})
              </div>
              <div className="text-[10px] sm:text-xs text-green-700 mt-1">
                Budget: £{remainingBudget.toFixed(1)}m + £{(transferOut.now_cost / 10).toFixed(1)}m
              </div>
              <div className="text-[10px] sm:text-xs text-red-600 font-semibold mt-1">
                ⚠️ Must maintain: 2 GKP, 5 DEF, 5 MID, 3 FWD • Max 3 per team
              </div>
            </div>
          )}
          
          {/* Search */}
          <div className="relative mb-3 sm:mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
            <Input
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>

          {/* Position Filter */}
          <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
            {(['ALL', 'GKP', 'DEF', 'MID', 'FWD'] as const).map(pos => (
              <Button
                key={pos}
                variant={positionFilter === pos ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPositionFilter(pos)}
                className={`text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-9 ${positionFilter === pos ? 'bg-purple-600' : ''}`}
              >
                {pos}
              </Button>
            ))}
          </div>

          {/* Player List */}
          <div className="space-y-2 max-h-[400px] lg:max-h-[600px] overflow-y-auto">
            {selectedSlot && !transferMode && (
              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-2 sm:p-3 mb-3">
                <div className="text-xs sm:text-sm font-semibold text-purple-900">
                  Select a player to add
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSlot(null)}
                  className="mt-2 text-purple-600 text-xs h-7"
                >
                  Cancel
                </Button>
              </div>
            )}
            
            {filteredPlayers.map(player => {
              const posMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
              const position = posMap[player.element_type as keyof typeof posMap] as 'GKP' | 'DEF' | 'MID' | 'FWD';
              const inSquad = isInSquad(player.id);
              const teamData = bootstrap?.teams?.find(t => t.id === player.team);
              
              // Check if transfer is valid
              let transferErrors: string[] = [];
              if (transferMode && transferOut) {
                transferErrors = validateTransfer(player, transferOut);
              }
              const transferInvalid = transferErrors.length > 0;
              
              const positionColors = {
                GKP: 'bg-yellow-500',
                DEF: 'bg-blue-500',
                MID: 'bg-green-500',
                FWD: 'bg-red-500',
              };
              
              return (
                <div
                  key={player.id}
                  className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${
                    inSquad 
                      ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                      : transferMode && transferOut && transferInvalid
                      ? 'bg-red-50 border-red-300 opacity-60 cursor-not-allowed'
                      : transferMode && transferOut
                      ? 'border-green-200 hover:border-green-400 hover:bg-green-50 cursor-pointer'
                      : selectedSlot
                      ? 'border-purple-200 hover:border-purple-400 hover:bg-purple-50 cursor-pointer'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (inSquad) return;
                    if (transferMode && transferOut) {
                      if (!transferInvalid) {
                        handleTransferIn(player);
                      }
                    } else if (selectedSlot) {
                      addPlayerToSlot(player);
                    }
                  }}
                  title={transferInvalid ? transferErrors.join(' • ') : ''}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <img
                        src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`}
                        alt={player.web_name}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = `https://resources.premierleague.com/premierleague/badges/70/t${player.team_code}.png`;
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{player.web_name}</div>
                        <div className="text-[10px] sm:text-xs text-gray-600 truncate">{teamData?.short_name || ''} • {position}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-purple-600 text-xs sm:text-sm">£{(player.now_cost / 10).toFixed(1)}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">{player.total_points} pts</div>
                    </div>
                  </div>
                  {transferInvalid && (
                    <div className="mt-2 text-[10px] text-red-600">
                      {transferErrors[0]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right Column - Formation & Pitch */}
        <Card className="p-4 sm:p-6 lg:col-span-3 order-1 lg:order-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Team Sheet</h3>
            
            {/* Formation Selector - Disabled (auto-detected) */}
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-600">Formation:</span>
              <div className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-semibold bg-gray-100 text-gray-700">
                {formation}
              </div>
              <span className="text-[10px] sm:text-xs text-gray-500">(Auto-detected)</span>
            </div>
          </div>
          
          {/* Football Pitch */}
          <div className="relative bg-gradient-to-b from-green-600 to-green-700 rounded-xl overflow-hidden min-h-[500px] sm:min-h-[600px] lg:min-h-[700px]" ref={pitchRef}>
            
            {/* Fantasy Branding at Top */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center z-10">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white/90 mb-0.5">⚽ Fantasy</div>
              <div className="text-sm sm:text-base lg:text-lg font-bold text-white/70">@FPL_Dave_</div>
            </div>

            {/* Goalkeeper */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <PitchPlayerSlot
                player={startingXI[0]}
                onSelect={() => setSelectedSlot({ type: 'starting', index: 0 })}
                onRemove={() => {
                  const newStarting = [...startingXI];
                  newStarting[0] = null;
                  setStartingXI(newStarting);
                }}
                onTransferOut={(p) => {
                  setTransferOut(p);
                  setTransferMode(true);
                }}
                isSelected={selectedSlot?.type === 'starting' && selectedSlot.index === 0}
                isCaptain={captain === startingXI[0]?.id}
                isViceCaptain={viceCaptain === startingXI[0]?.id}
                transferMode={transferMode}
              />
            </div>

            {/* Defenders */}
            <div className="absolute bottom-[22%] left-0 right-0 flex justify-center gap-4 px-4">
              {Array.from({ length: formationLayout.def }).map((_, i) => {
                const slotIndex = 1 + i;
                return (
                  <PitchPlayerSlot
                    key={slotIndex}
                    player={startingXI[slotIndex]}
                    onSelect={() => setSelectedSlot({ type: 'starting', index: slotIndex })}
                    onRemove={() => {
                      const newStarting = [...startingXI];
                      newStarting[slotIndex] = null;
                      setStartingXI(newStarting);
                    }}
                    onTransferOut={(p) => {
                      setTransferOut(p);
                      setTransferMode(true);
                    }}
                    isSelected={selectedSlot?.type === 'starting' && selectedSlot.index === slotIndex}
                    isCaptain={captain === startingXI[slotIndex]?.id}
                    isViceCaptain={viceCaptain === startingXI[slotIndex]?.id}
                    transferMode={transferMode}
                  />
                );
              })}
            </div>

            {/* Midfielders */}
            <div className="absolute bottom-[45%] left-0 right-0 flex justify-center gap-4 px-4">
              {Array.from({ length: formationLayout.mid }).map((_, i) => {
                const slotIndex = 1 + formationLayout.def + i;
                return (
                  <PitchPlayerSlot
                    key={slotIndex}
                    player={startingXI[slotIndex]}
                    onSelect={() => setSelectedSlot({ type: 'starting', index: slotIndex })}
                    onRemove={() => {
                      const newStarting = [...startingXI];
                      newStarting[slotIndex] = null;
                      setStartingXI(newStarting);
                    }}
                    onTransferOut={(p) => {
                      setTransferOut(p);
                      setTransferMode(true);
                    }}
                    isSelected={selectedSlot?.type === 'starting' && selectedSlot.index === slotIndex}
                    isCaptain={captain === startingXI[slotIndex]?.id}
                    isViceCaptain={viceCaptain === startingXI[slotIndex]?.id}
                    transferMode={transferMode}
                  />
                );
              })}
            </div>

            {/* Forwards */}
            <div className="absolute top-[15%] left-0 right-0 flex justify-center gap-8">
              {Array.from({ length: formationLayout.fwd }).map((_, i) => {
                const slotIndex = 1 + formationLayout.def + formationLayout.mid + i;
                return (
                  <PitchPlayerSlot
                    key={slotIndex}
                    player={startingXI[slotIndex]}
                    onSelect={() => setSelectedSlot({ type: 'starting', index: slotIndex })}
                    onRemove={() => {
                      const newStarting = [...startingXI];
                      newStarting[slotIndex] = null;
                      setStartingXI(newStarting);
                    }}
                    onTransferOut={(p) => {
                      setTransferOut(p);
                      setTransferMode(true);
                    }}
                    isSelected={selectedSlot?.type === 'starting' && selectedSlot.index === slotIndex}
                    isCaptain={captain === startingXI[slotIndex]?.id}
                    isViceCaptain={viceCaptain === startingXI[slotIndex]?.id}
                    transferMode={transferMode}
                  />
                );
              })}
            </div>
          </div>

          {/* Substitutes */}
          <div className="mt-4 sm:mt-6">
            <h4 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">SUBSTITUTES</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {bench.map((player, index) => (
                <BenchSlot
                  key={index}
                  player={player}
                  onSelect={() => setSelectedSlot({ type: 'bench', index })}
                  onRemove={() => {
                    const newBench = [...bench];
                    newBench[index] = null;
                    setBench(newBench);
                  }}
                  onTransferOut={(p) => {
                    setTransferOut(p);
                    setTransferMode(true);
                  }}
                  isSelected={selectedSlot?.type === 'bench' && selectedSlot.index === index}
                  transferMode={transferMode}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
              onClick={() => {
                setStartingXI(Array(11).fill(null));
                setBench(Array(4).fill(null));
                setCaptain(null);
                setViceCaptain(null);
              }}
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Clear Squad
            </Button>
            <Button 
              variant="outline"
              className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
            >
              <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Save Team
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs sm:text-sm h-9 sm:h-10"
              onClick={async () => {
                // Use the hidden export pitch instead
                const exportPitch = document.getElementById('export-pitch-hidden');
                if (exportPitch) {
                  try {
                    await ExportService.exportCard(exportPitch as HTMLElement, `${teamName.replace(/\s/g, '_')}_team`);
                  } catch (error) {
                    console.error('Export failed:', error);
                    alert('Export failed. Please try again or use browser screenshot.');
                  }
                }
              }}
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Export Image
            </Button>
          </div>
        </Card>
      </div>

      {/* HIDDEN EXPORT PITCH - Matches your exact HTML structure */}
      <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none">
        <div className="w-[1080px] h-[1350px]">
          <div id="export-pitch-hidden" className="flex flex-col items-center bg-gradient-to-r from-[#9146ff]/80 to-[#00d8ff]/80 rounded-3xl backdrop-blur-sm w-full h-full w-[1080px] h-[1350px]">
            {/* Stats Header */}
            <div className="flex justify-center gap-6 p-4 rounded-xl w-fit mx-auto">
              <div className="flex flex-col items-center justify-center gap-3 min-w-36">
                <span className="text-center text-4xl font-bold text-blue-700 bg-white/60 backdrop-blur-sm rounded-xl border-2 border-white px-2 py-4 w-full">
                  £{totalCost.toFixed(1)}m
                </span>
                <span className="text-center font-semibold text-xl text-blue-700 bg-white/60 backdrop-blur rounded-xl border-white px-2 py-1 w-full">
                  Team Value
                </span>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 min-w-36">
                <span className="text-center text-4xl font-bold text-blue-700 bg-white/60 backdrop-blur-sm rounded-xl border-2 border-white px-2 py-4 w-full">
                  {teamName.split('GW')[1] || '28'}
                </span>
                <span className="text-center font-semibold text-xl text-blue-700 bg-white/60 backdrop-blur rounded-xl border-white px-2 py-1 w-full">
                  Gameweek
                </span>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 min-w-36">
                <span className="text-center text-4xl font-bold text-blue-700 bg-white/60 backdrop-blur-sm rounded-xl border-2 border-white px-2 py-4 w-full">
                  £{remainingBudget.toFixed(1)}m
                </span>
                <span className="text-center font-semibold text-xl text-blue-700 bg-white/60 backdrop-blur rounded-xl border-white px-2 py-1 w-full">
                  Bank
                </span>
              </div>
            </div>

            {/* Pitch with Players - Using actual PNG as image */}
            <div className="relative w-full h-full">
              {/* Pitch Background Image */}
              <img 
                src="figma:asset/73e8daeb6c13cff4f94e71f4e938352195978926.png" 
                alt="Football Pitch" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Players positioned on top of pitch */}
              <div className="absolute inset-0 flex flex-col items-center gap-8 pt-4">
                {/* Fantasy Branding */}
                <div className="text-center z-10">
                  <div className="text-5xl font-black text-white/90 mb-1">⚽ Fantasy</div>
                  <div className="text-2xl font-bold text-white/70">@FPL_Dave_</div>
                </div>

                {/* Forwards */}
                <div className="flex flex-row flex-wrap items-center justify-evenly w-11/12 mt-8">
                  {Array.from({ length: formationLayout.fwd }).map((_, i) => {
                    const slotIndex = 1 + formationLayout.def + formationLayout.mid + i;
                    const player = startingXI[slotIndex];
                    return (
                      <ExportPlayerCard key={slotIndex} player={player} position="Forward" isCaptain={captain === player?.id} isViceCaptain={viceCaptain === player?.id} />
                    );
                  })}
                </div>

                {/* Midfielders */}
                <div className="flex flex-row flex-wrap items-center justify-evenly w-11/12">
                  {Array.from({ length: formationLayout.mid }).map((_, i) => {
                    const slotIndex = 1 + formationLayout.def + i;
                    const player = startingXI[slotIndex];
                    return (
                      <ExportPlayerCard key={slotIndex} player={player} position="Midfielder" isCaptain={captain === player?.id} isViceCaptain={viceCaptain === player?.id} />
                    );
                  })}
                </div>

                {/* Defenders */}
                <div className="flex flex-row flex-wrap items-center justify-evenly w-11/12">
                  {Array.from({ length: formationLayout.def }).map((_, i) => {
                    const slotIndex = 1 + i;
                    const player = startingXI[slotIndex];
                    return (
                      <ExportPlayerCard key={slotIndex} player={player} position="Defender" isCaptain={captain === player?.id} isViceCaptain={viceCaptain === player?.id} />
                    );
                  })}
                </div>

                {/* Goalkeeper */}
                <div className="flex flex-row flex-wrap items-center justify-evenly w-11/12">
                  <ExportPlayerCard player={startingXI[0]} position="Goalkeeper" isCaptain={captain === startingXI[0]?.id} isViceCaptain={viceCaptain === startingXI[0]?.id} />
                </div>

                {/* Bench */}
                <div className="w-full -mt-10">
                  <div className="ml-8 bg-secondary/30 backdrop-blur-sm rounded-t-2xl px-12 py-1.5 text-white text-center text-xl font-semibold w-fit">
                    Bench
                  </div>
                  <div className="flex flex-row items-center justify-evenly w-full min-h-36 py-4 bg-secondary/30 backdrop-blur-sm rounded-md">
                    {bench.map((player, index) => (
                      <ExportPlayerCard key={`bench-${index}`} player={player} position={`Bench ${index === 0 ? 'GKP' : ''}`} isBench={true} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Pitch Player Slot Component - PLAYER PHOTOS
function PitchPlayerSlot({ 
  player, 
  onSelect, 
  onRemove,
  onTransferOut,
  isSelected,
  isCaptain,
  isViceCaptain,
  transferMode
}: { 
  player: SquadPlayer | null; 
  onSelect: () => void;
  onRemove: () => void;
  onTransferOut: (p: SquadPlayer) => void;
  isSelected: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
  transferMode: boolean;
}) {
  if (!player) {
    return (
      <button
        onClick={onSelect}
        className={`w-20 h-20 rounded-full border-2 border-dashed ${
          isSelected ? 'border-purple-500 bg-purple-100' : 'border-white/40 hover:border-white/70'
        } flex items-center justify-center transition-all group`}
      >
        <Plus className={`w-10 h-10 ${isSelected ? 'text-purple-600' : 'text-white/50 group-hover:text-white/90'}`} />
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center group relative">
      {/* Captain badges */}
      {isCaptain && (
        <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-white z-10 shadow-lg">
          C
        </div>
      )}
      {isViceCaptain && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white z-10 shadow-lg">
          V
        </div>
      )}
      
      <button
        onClick={() => transferMode ? onTransferOut(player) : onRemove()}
        className={`w-20 h-20 rounded-full bg-white border-4 ${
          transferMode ? 'border-amber-400 hover:border-amber-500' : 'border-white hover:border-red-400'
        } overflow-hidden transition-all relative shadow-lg`}
      >
        {/* PLAYER PHOTO */}
        <img
          src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photoCode}.png`}
          alt={player.webName}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://resources.premierleague.com/premierleague/badges/70/t${player.teamCode}.png`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
          <X className="w-5 h-5 text-white" />
        </div>
      </button>
      
      <div className="mt-2 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg min-w-[100px]">
        <div className="text-xs font-bold text-gray-900 text-center whitespace-nowrap">{player.webName}</div>
        <div className="text-[10px] text-gray-600 text-center">{player.teamShortName} • £{(player.now_cost / 10).toFixed(1)}m</div>
      </div>
    </div>
  );
}

// Bench Slot Component - PLAYER PHOTOS
function BenchSlot({ 
  player, 
  onSelect, 
  onRemove,
  onTransferOut,
  isSelected,
  transferMode
}: { 
  player: SquadPlayer | null; 
  onSelect: () => void;
  onRemove: () => void;
  onTransferOut: (p: SquadPlayer) => void;
  isSelected: boolean;
  transferMode: boolean;
}) {
  if (!player) {
    return (
      <button
        onClick={onSelect}
        className={`p-4 rounded-lg border-2 border-dashed ${
          isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-300 hover:bg-gray-50'
        } flex flex-col items-center justify-center transition-all min-h-[120px]`}
      >
        <Plus className={`w-6 h-6 mb-2 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
        <span className="text-xs text-gray-500">Add player</span>
      </button>
    );
  }

  return (
    <div
      className={`p-3 rounded-lg border-2 ${
        transferMode ? 'border-amber-300 hover:border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-red-400 bg-gray-50'
      } transition-all cursor-pointer group relative min-h-[120px]`}
      onClick={() => transferMode ? onTransferOut(player) : onRemove()}
    >
      <div className="flex flex-col items-center">
        {/* PLAYER PHOTO */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-white border-2 border-gray-300 flex items-center justify-center mb-2">
          <img
            src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photoCode}.png`}
            alt={player.webName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://resources.premierleague.com/premierleague/badges/70/t${player.teamCode}.png`;
            }}
          />
        </div>
        <div className="text-xs font-semibold text-gray-900 text-center line-clamp-1">{player.webName}</div>
        <div className="text-[10px] text-gray-600 text-center">{player.teamShortName} • {player.position}</div>
        <div className="text-[10px] font-bold text-purple-600 mt-1">£{(player.now_cost / 10).toFixed(1)}m</div>
      </div>
      <div className={`absolute inset-0 ${
        transferMode ? 'bg-amber-500/0 group-hover:bg-amber-500/10' : 'bg-red-500/0 group-hover:bg-red-500/10'
      } rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
        <X className="w-5 h-5 text-red-600" />
      </div>
    </div>
  );
}

// Export Player Card Component - Matches your exact HTML structure
function ExportPlayerCard({ 
  player, 
  position,
  isCaptain = false,
  isViceCaptain = false,
  isBench = false
}: { 
  player: SquadPlayer | null; 
  position: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isBench?: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center cursor-pointer bg-white/30 backdrop-blur-sm rounded-xl border-4 border-white/60 m-2">
      {/* Captain/Vice Captain Badge */}
      {isCaptain && (
        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-base font-black text-white z-10 shadow-xl border-2 border-white">
          C
        </div>
      )}
      {isViceCaptain && (
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-base font-black text-white z-10 shadow-xl border-2 border-white">
          V
        </div>
      )}

      <div className="rounded-t-md">
        <div className="relative w-36 h-32 rounded-t-md">
          <div className="absolute inset-x-0 -top-4 h-36 overflow-hidden pt-1">
            <img 
              alt={player?.webName || 'Photo-Missing'}
              loading="lazy"
              width="565"
              height="565"
              decoding="async"
              className="w-[190px] h-[190px] object-cover"
              src={player ? `https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.photoCode}.png` : 'https://resources.premierleague.com/premierleague/photos/players/250x250/Photo-Missing.png'}
              onError={(e) => {
                e.currentTarget.src = 'https://resources.premierleague.com/premierleague/photos/players/250x250/Photo-Missing.png';
              }}
            />
            {!player && (
              <div className="absolute inset-0 flex items-center justify-center cursor-crosshair animate-pulse">
                <span className="bg-primary text-5xl text-white font-bold border-4 border-white rounded-full w-12 h-12 flex items-center justify-center mt-20 pb-4">
                  +
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <h1 className="bg-[#9146FF] text-white text-xl py-1 font-semibold w-full text-center truncate">
        {player ? player.webName : `Add ${position}`}
      </h1>
      
      <p className="text-[#423488] bg-white/60 backdrop-blur-sm rounded-b-lg w-full text-center text-xl py-1 font-bold truncate">
        £{player ? (player.now_cost / 10).toFixed(1) : '14.5'} | {player ? player.selected_by_percent : '25.5'}%
      </p>
    </div>
  );
}

export default TeamPlannerStudio;