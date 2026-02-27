import React, { useState, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Download, Upload, Users, Shirt, Image as ImageIcon, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { Player } from '../../types/fpl';
import { ImagePositionControls } from '../ImagePositionControls';
import { useFPLStore } from '../../store/fpl-store';
import { TransferPlanningPanel } from '../TransferPlanningPanel';
import { FPLService } from '../../utils/corsProxy';
import { ExportService } from '../../utils/exportService';

interface TeamLineupBuilderAdvancedProps {
  players: Player[];
}

interface SquadPlayer {
  id: number | null;
  webName: string;
  position: 'GKP' | 'DEF' | 'MID' | 'FWD';
  teamCode: number | null;
  photoCode: string | null;
  customImage: string | null;
  imagePosition: { x: number; y: number; scale: number };
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  transferOut?: boolean;
  transferIn?: boolean;
}

export function TeamLineupBuilderAdvanced({ players }: TeamLineupBuilderAdvancedProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { fetchBootstrapData, bootstrap } = useFPLStore();
  
  const [fplId, setFplId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFPLTeamLoaded, setIsFPLTeamLoaded] = useState(false); // Track if official FPL team was loaded
  
  const [formation, setFormation] = useState('4-4-2');
  const [teamName, setTeamName] = useState('My FPL Team');
  const [gameweek, setGameweek] = useState('28');
  const [displayMode, setDisplayMode] = useState<'player' | 'kit'>('player');
  
  // 15 players: 11 starters + 4 bench
  const [squad, setSquad] = useState<SquadPlayer[]>(
    Array(15).fill(null).map((_, idx) => ({
      id: null,
      webName: `Player ${idx + 1}`,
      position: idx === 0 ? 'GKP' : idx < 5 ? 'DEF' : idx < 9 ? 'MID' : 'FWD',
      teamCode: null,
      photoCode: null,
      customImage: null,
      imagePosition: { x: 0, y: 0, scale: 100 },
    }))
  );

  const fileInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // FPL Formation Rules (official constraints)
  const FPL_RULES = {
    GKP: { min: 1, max: 1 }, // Exactly 1 GKP in starting XI
    DEF: { min: 3, max: 5 }, // 3-5 DEF
    MID: { min: 2, max: 5 }, // 2-5 MID
    FWD: { min: 1, max: 3 }, // 1-3 FWD
  };

  // Valid FPL formations
  const formations = [
    '3-4-3', '3-5-2', '4-3-3', '4-4-2', '4-5-1', '5-3-2', '5-4-1'
  ];

  // Validate if a formation is legal according to FPL rules
  const isValidFormation = (def: number, mid: number, fwd: number): boolean => {
    return (
      def >= FPL_RULES.DEF.min && def <= FPL_RULES.DEF.max &&
      mid >= FPL_RULES.MID.min && mid <= FPL_RULES.MID.max &&
      fwd >= FPL_RULES.FWD.min && fwd <= FPL_RULES.FWD.max &&
      def + mid + fwd === 10 // 10 outfield players + 1 GK = 11
    );
  };

  // Auto-detect formation from starting XI
  const detectFormation = (starters: SquadPlayer[]): string => {
    const counts = { GKP: 0, DEF: 0, MID: 0, FWD: 0 };
    starters.forEach(p => counts[p.position]++);
    
    if (counts.GKP !== 1) {
      return '4-4-2'; // Default if invalid
    }
    
    if (isValidFormation(counts.DEF, counts.MID, counts.FWD)) {
      return `${counts.DEF}-${counts.MID}-${counts.FWD}`;
    }
    
    return '4-4-2'; // Default fallback
  };

  // Move player to bench (swap with first bench player of same position if possible)
  const benchPlayer = (starterIndex: number) => {
    const newSquad = [...squad];
    const playerToBench = newSquad[starterIndex];
    
    // Find first bench player of same position
    let benchIndex = 11;
    for (let i = 11; i < 15; i++) {
      if (newSquad[i].position === playerToBench.position) {
        benchIndex = i;
        break;
      }
    }
    
    // If no same position, just swap with first available bench slot
    if (benchIndex === 11 || newSquad[benchIndex].position !== playerToBench.position) {
      benchIndex = 11 + (starterIndex % 4); // Distribute across bench
    }
    
    // Swap
    [newSquad[starterIndex], newSquad[benchIndex]] = [newSquad[benchIndex], newSquad[starterIndex]];
    
    setSquad(newSquad);
    
    // Auto-update formation
    const newFormation = detectFormation(newSquad.slice(0, 11));
    setFormation(newFormation);
  };

  // Move bench player to starting XI
  const unstartPlayer = (benchIndex: number) => {
    const newSquad = [...squad];
    const playerToStart = newSquad[benchIndex];
    
    // Find a starter of same position to swap
    let starterIndex = 0;
    for (let i = 0; i < 11; i++) {
      if (newSquad[i].position === playerToStart.position) {
        starterIndex = i;
        break;
      }
    }
    
    // Swap
    [newSquad[starterIndex], newSquad[benchIndex]] = [newSquad[benchIndex], newSquad[starterIndex]];
    
    setSquad(newSquad);
    
    // Auto-update formation
    const newFormation = detectFormation(newSquad.slice(0, 11));
    setFormation(newFormation);
  };

  // Load team from FPL ID with GW fallback logic
  const loadTeamFromFPL = async () => {
    if (!fplId || isNaN(Number(fplId))) {
      setError('Please enter a valid FPL ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch bootstrap data if not loaded
      if (!bootstrap) {
        await fetchBootstrapData();
      }

      const managerId = Number(fplId);
      const targetGw = Number(gameweek);

      // Fetch manager data
      const managerData = await FPLService.getManager(managerId);
      setTeamName(managerData.name);

      // Try current GW, then GW-1, then GW-2 (in case current GW hasn't started)
      let picksData: any = null;
      let actualGw = targetGw;
      
      for (const gwTry of [targetGw, targetGw - 1, targetGw - 2].filter(g => g > 0)) {
        try {
          const res = await FPLService.getManagerTeam(managerId, gwTry);
          
          if (res?.picks?.length) {
            picksData = res;
            actualGw = gwTry;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (!picksData) {
        throw new Error('No picks found for this manager. Try an earlier gameweek or check the manager ID.');
      }

      // Update gameweek to actual GW found
      if (actualGw !== targetGw) {
        setGameweek(String(actualGw));
      }

      // Sort picks by position field (FPL orders: GK→DEF→MID→FWD→bench)
      const sortedPicks = [...picksData.picks].sort((a, b) => a.position - b.position).slice(0, 15);
      
      // Map picks to squad with player data from already-loaded players array
      const newSquad: SquadPlayer[] = sortedPicks.map((pick: any) => {
        const player = players.find(p => p.id === pick.element);
        
        return {
          id: pick.element,
          webName: player?.web_name || `Player ${pick.element}`,
          position: player?.element_type === 1 ? 'GKP' : player?.element_type === 2 ? 'DEF' : player?.element_type === 3 ? 'MID' : 'FWD',
          teamCode: player?.team_code || null,
          photoCode: player?.code ? String(player.code) : null,
          customImage: null,
          imagePosition: { x: 0, y: 0, scale: 100 },
          isCaptain: pick.is_captain,
          isViceCaptain: pick.is_vice_captain,
        };
      });

      setSquad(newSquad);

      // Auto-detect formation from starting XI (first 11 picks)
      const newFormation = detectFormation(newSquad.slice(0, 11));
      setFormation(newFormation);

      setError('');
      
      // Show success message if we used a fallback GW
      if (actualGw !== targetGw) {
        setError(`✅ Loaded GW${actualGw} team (GW${targetGw} picks not available yet)`);
      }

      // Mark that an official FPL team was loaded
      setIsFPLTeamLoaded(true);
    } catch (err: any) {
      console.error('Failed to load FPL team:', err);
      
      // Show user-friendly error
      if (err.message?.includes('CORS proxies failed')) {
        setError('⚠️ FPL API temporarily unavailable. The proxies that bypass CORS restrictions are currently blocked or down. Please try again later, or use the manual squad builder below.');
      } else if (err.message?.includes('404')) {
        setError('❌ FPL ID not found. Please check the ID and try an earlier gameweek.');
      } else if (err.message?.includes('No picks found')) {
        setError('❌ No team data found. The manager may not have played in recent gameweeks. Try GW1-27.');
      } else {
        setError(`❌ Failed to load team: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get player image URL (CORS-protected, will fallback gracefully)
  const getPlayerImageUrl = (photoCode: string | null): string | null => {
    if (!photoCode) return null;
    return `https://resources.premierleague.com/premierleague/photos/players/250x250/p${photoCode}.png`;
  };

  // Get kit image URL (CORS-protected, will fallback gracefully)
  const getKitImageUrl = (teamCode: number | null, isGK: boolean): string | null => {
    if (!teamCode) return null;
    const kitType = isGK ? '5' : '1';
    return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}_${kitType}-220.webp`;
  };

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newSquad = [...squad];
        newSquad[index].customImage = event.target?.result as string;
        setSquad(newSquad);
      };
      reader.readAsDataURL(file);
    }
  };

  const exportAsImage = async () => {
    if (!cardRef.current) return;
    try {
      await ExportService.exportCard(cardRef.current, `${teamName.replace(/\s/g, '_')}_GW${gameweek}`);
    } catch (error) {
      console.error('Failed to export:', error);
      setError('❌ Export failed. Please try again or use browser screenshot.');
    }
  };

  // Split formation string into array
  const formationArray = formation.split('-').map(Number);
  const starters = squad.slice(0, 11);
  const bench = squad.slice(11, 15);

  // Organize starters by position based on formation
  const positionGroups = [
    starters.slice(0, 1), // GK
    starters.slice(1, 1 + formationArray[0]), // DEF
    starters.slice(1 + formationArray[0], 1 + formationArray[0] + formationArray[1]), // MID
    starters.slice(1 + formationArray[0] + formationArray[1]) // FWD
  ];

  const positionColors = [
    { bg: 'bg-yellow-500', border: 'border-yellow-400', label: 'bg-yellow-600/90' }, // GK
    { bg: 'bg-green-500', border: 'border-green-400', label: 'bg-green-700/90' }, // DEF
    { bg: 'bg-blue-500', border: 'border-blue-400', label: 'bg-blue-600/90' }, // MID
    { bg: 'bg-red-500', border: 'border-red-400', label: 'bg-red-600/90' }, // FWD
  ];

  // Render player avatar (with fallback handling for CORS)
  const renderPlayerAvatar = (player: SquadPlayer, colorScheme: any) => {
    let imageUrl: string | null = null;

    // Priority: custom uploaded image > player photo > kit
    if (player.customImage) {
      imageUrl = player.customImage;
    } else if (displayMode === 'player' && player.photoCode) {
      imageUrl = getPlayerImageUrl(player.photoCode);
    } else if (displayMode === 'kit' && player.teamCode) {
      imageUrl = getKitImageUrl(player.teamCode, player.position === 'GKP');
    }

    if (imageUrl) {
      return (
        <img 
          src={imageUrl}
          alt={player.webName}
          className="w-full h-full object-cover"
          style={{ 
            transform: `translate(${player.imagePosition.x}%, ${player.imagePosition.y}%) scale(${player.imagePosition.scale / 100})` 
          }}
          onError={(e) => {
            // Fallback to initials if image fails to load (CORS issue)
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }

    // Fallback to initials
    return (
      <span className="text-white font-bold text-sm">
        {player.webName.substring(0, 3).toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* FPL ID Loader */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🎮 Load Team from FPL ID</h3>
        <div className="flex gap-3">
          <Input
            value={fplId}
            onChange={(e) => setFplId(e.target.value)}
            placeholder="Enter FPL ID (e.g., 123456)"
            className="flex-1"
            type="number"
          />
          <Input
            value={gameweek}
            onChange={(e) => setGameweek(e.target.value)}
            placeholder="GW"
            className="w-24"
            type="number"
          />
          <Button 
            onClick={loadTeamFromFPL}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Load Team
              </>
            )}
          </Button>
        </div>
        {error && (
          <div className={`mt-3 p-3 border rounded-lg flex items-center gap-2 text-sm ${
            error.startsWith('✅') 
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2">
          💡 Find your FPL ID in your profile URL: fantasy.premierleague.com/entry/<strong>YOUR_ID</strong>/event/
        </p>
      </Card>

      {/* Team Settings */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">⚙️ Team Settings</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Team Name</label>
            <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Formation</label>
            {isFPLTeamLoaded ? (
              <div className="w-full h-10 px-3 border border-gray-300 rounded-md bg-gray-100 flex items-center text-gray-700 font-semibold">
                {formation} <span className="ml-2 text-xs text-gray-500">(auto-detected)</span>
              </div>
            ) : (
              <select
                value={formation}
                onChange={(e) => setFormation(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-md"
              >
                {formations.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Display Mode Toggle */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">Display Mode</label>
          <div className="flex gap-2">
            <Button
              variant={displayMode === 'player' ? 'default' : 'outline'}
              onClick={() => setDisplayMode('player')}
              className="flex-1"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Player Photos
            </Button>
            <Button
              variant={displayMode === 'kit' ? 'default' : 'outline'}
              onClick={() => setDisplayMode('kit')}
              className="flex-1"
            >
              <Shirt className="w-4 h-4 mr-2" />
              Team Kits
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ⚠️ Note: FPL images may be blocked by CORS. Upload custom images for best results.
          </p>
        </div>
      </Card>

      {/* Player Editor */}
      <Card className="p-6 bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">👥 Starting XI</h3>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {starters.map((player, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-white">
              <div className="grid grid-cols-3 gap-2 mb-2">
                <Input
                  value={player.webName}
                  onChange={(e) => {
                    const newSquad = [...squad];
                    newSquad[idx].webName = e.target.value;
                    setSquad(newSquad);
                  }}
                  placeholder={`Player ${idx + 1}`}
                  className="text-sm"
                />
                <select
                  value={player.position}
                  onChange={(e) => {
                    const newSquad = [...squad];
                    newSquad[idx].position = e.target.value as any;
                    setSquad(newSquad);
                  }}
                  className="h-10 px-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="GKP">GKP</option>
                  <option value="DEF">DEF</option>
                  <option value="MID">MID</option>
                  <option value="FWD">FWD</option>
                </select>
                <div>
                  <input
                    ref={(el) => (fileInputRefs.current[idx] = el)}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(idx, e)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRefs.current[idx]?.click()}
                    className="w-full h-10"
                    size="sm"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    {player.customImage ? 'Change' : 'Upload'}
                  </Button>
                </div>
              </div>
              {player.customImage && (
                <ImagePositionControls
                  label=""
                  position={player.imagePosition}
                  onChange={(newPosition) => {
                    const newSquad = [...squad];
                    newSquad[idx].imagePosition = newPosition;
                    setSquad(newSquad);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Bench */}
      <Card className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🪑 Bench</h3>
        <div className="grid grid-cols-2 gap-3">
          {bench.map((player, idx) => (
            <Input
              key={idx}
              value={player.webName}
              onChange={(e) => {
                const newSquad = [...squad];
                newSquad[11 + idx].webName = e.target.value;
                setSquad(newSquad);
              }}
              placeholder={`Bench ${idx + 1}`}
              className="text-sm"
            />
          ))}
        </div>
      </Card>

      {/* Preview Card */}
      <div className="flex justify-center overflow-x-auto">
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-2xl relative overflow-hidden inline-block"
          style={{ padding: '48px', minWidth: '850px', maxWidth: '1000px', width: 'fit-content' }}
        >
          {/* Pitch lines */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
            <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-0 left-1/2 w-48 h-24 border-2 border-white border-t-0 -translate-x-1/2" />
            <div className="absolute bottom-0 left-1/2 w-48 h-24 border-2 border-white border-b-0 -translate-x-1/2" />
          </div>

          {/* Header */}
          <div className="text-center mb-10 relative z-10">
            <div className="text-5xl font-black text-white mb-2">{teamName}</div>
            <div className="text-2xl text-green-100 font-medium">
              Gameweek {gameweek} • Formation: {formation}
            </div>
          </div>

          {/* Formation Display */}
          <div className="space-y-10 relative z-10">
            {/* Forwards */}
            <div className="flex justify-center gap-8">
              {positionGroups[3]?.map((player, idx) => (
                <div key={idx} className="text-center relative">
                  <div className={`w-20 h-20 ${positionColors[3].bg} border-4 ${positionColors[3].border} rounded-full flex items-center justify-center shadow-2xl mb-2 overflow-hidden relative`}>
                    {renderPlayerAvatar(player, positionColors[3])}
                    {player.isCaptain && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">C</div>
                    )}
                    {player.isViceCaptain && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold">V</div>
                    )}
                  </div>
                  <div className={`text-white text-sm font-bold ${positionColors[3].label} px-3 py-1 rounded-full shadow-lg`}>
                    {player.webName}
                  </div>
                </div>
              ))}
            </div>

            {/* Midfielders */}
            <div className="flex justify-center gap-8">
              {positionGroups[2]?.map((player, idx) => (
                <div key={idx} className="text-center relative">
                  <div className={`w-20 h-20 ${positionColors[2].bg} border-4 ${positionColors[2].border} rounded-full flex items-center justify-center shadow-2xl mb-2 overflow-hidden relative`}>
                    {renderPlayerAvatar(player, positionColors[2])}
                    {player.isCaptain && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">C</div>
                    )}
                    {player.isViceCaptain && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold">V</div>
                    )}
                  </div>
                  <div className={`text-white text-sm font-bold ${positionColors[2].label} px-3 py-1 rounded-full shadow-lg`}>
                    {player.webName}
                  </div>
                </div>
              ))}
            </div>

            {/* Defenders */}
            <div className="flex justify-center gap-8">
              {positionGroups[1]?.map((player, idx) => (
                <div key={idx} className="text-center relative">
                  <div className={`w-20 h-20 ${positionColors[1].bg} border-4 ${positionColors[1].border} rounded-full flex items-center justify-center shadow-2xl mb-2 overflow-hidden relative`}>
                    {renderPlayerAvatar(player, positionColors[1])}
                    {player.isCaptain && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">C</div>
                    )}
                    {player.isViceCaptain && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold">V</div>
                    )}
                  </div>
                  <div className={`text-white text-sm font-bold ${positionColors[1].label} px-3 py-1 rounded-full shadow-lg`}>
                    {player.webName}
                  </div>
                </div>
              ))}
            </div>

            {/* Goalkeeper */}
            <div className="flex justify-center">
              {positionGroups[0]?.map((player, idx) => (
                <div key={idx} className="text-center relative">
                  <div className={`w-20 h-20 ${positionColors[0].bg} border-4 ${positionColors[0].border} rounded-full flex items-center justify-center shadow-2xl mb-2 overflow-hidden relative`}>
                    {renderPlayerAvatar(player, positionColors[0])}
                    {player.isCaptain && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">C</div>
                    )}
                    {player.isViceCaptain && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold">V</div>
                    )}
                  </div>
                  <div className={`text-white text-sm font-bold ${positionColors[0].label} px-3 py-1 rounded-full shadow-lg`}>
                    {player.webName}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bench Display - No images, text only */}
          <div className="mt-10 relative z-10">
            <div className="text-white/70 text-sm font-bold mb-3 text-center">BENCH</div>
            <div className="flex justify-center gap-4">
              {bench.map((player, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-14 h-14 bg-gray-700/50 border-2 border-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    {player.position}
                  </div>
                  <div className="text-white/70 text-xs font-medium mt-1 max-w-[60px] truncate">{player.webName}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-white/70 text-sm font-medium mt-8 relative z-10">
            @FPL_Dave_ • FPL Analytics
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={exportAsImage}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-lg py-6"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Team Lineup
        </Button>
      </div>
    </div>
  );
}