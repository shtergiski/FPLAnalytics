import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Download, Upload, X } from 'lucide-react';
import { Player } from '../../types/fpl';
import { toPng } from 'html-to-image';
import { useFPLStore } from '../../store/fpl-store';
import { ImagePositionControls } from '../ImagePositionControls';
import { TeamCombobox } from '../ui/team-combobox';
import { Loading } from '../ui/loading';

interface FDRFixtureBuilderProps {
  players: Player[];
}

export function FDRFixtureBuilder({ players }: FDRFixtureBuilderProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { bootstrap, fetchBootstrapData, getPlayerFixtures, fixtures, fetchFixtures } = useFPLStore();
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [gameweekStart, setGameweekStart] = useState('28');
  const [playerImage, setPlayerImage] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0, scale: 100 });
  const [teamFixtures, setTeamFixtures] = useState<any[]>([]);

  // Load bootstrap data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (!bootstrap) {
        await fetchBootstrapData();
      }
      if (!fixtures || fixtures.length === 0) {
        await fetchFixtures();
      }
      setLoading(false);
    };
    loadData();
  }, [bootstrap, fixtures, fetchBootstrapData, fetchFixtures]);

  // Load team fixtures when team is selected
  useEffect(() => {
    if (selectedTeam && fixtures && fixtures.length > 0) {
      const startGw = parseInt(gameweekStart) || 28;
      const teamId = selectedTeam.id;
      
      const relevantFixtures = fixtures
        .filter((fixture: any) => {
          return (fixture.team_h === teamId || fixture.team_a === teamId) && 
                 fixture.event >= startGw && 
                 fixture.event <= startGw + 4;
        })
        .sort((a: any, b: any) => a.event - b.event)
        .slice(0, 5)
        .map((fixture: any) => {
          const isHome = fixture.team_h === teamId;
          const opponentId = isHome ? fixture.team_a : fixture.team_h;
          const opponentTeam = bootstrap?.teams?.find((t: any) => t.id === opponentId);
          const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
          
          return {
            gw: fixture.event.toString(),
            opponent: opponentTeam?.short_name || 'TBD',
            difficulty: difficulty || 3,
            home: isHome
          };
        });
      
      setTeamFixtures(relevantFixtures);
    }
  }, [selectedTeam, gameweekStart, fixtures, bootstrap]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPlayerImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const exportAsImage = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1.0, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${selectedTeam?.name || 'Team'}_Fixtures_GW${gameweekStart}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const difficultyColors = [
    { bg: 'bg-[#01FC7C]', text: 'text-gray-900' },  // FDR 1 - Dark Green
    { bg: 'bg-[#00FF87]', text: 'text-gray-900' },  // FDR 2 - Light Green
    { bg: 'bg-gray-400', text: 'text-white' },      // FDR 3 - Gray
    { bg: 'bg-[#FF1751]', text: 'text-white' },     // FDR 4 - Pink/Red
    { bg: 'bg-[#861134]', text: 'text-white' },     // FDR 5 - Dark Red
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Fixture Difficulty Settings</h3>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Team Name</label>
            <TeamCombobox
              teams={bootstrap?.teams || []}
              value={selectedTeam?.id}
              onSelect={setSelectedTeam}
              placeholder="Search for a team..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Starting GW</label>
            <Input value={gameweekStart} onChange={(e) => setGameweekStart(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Team Badge</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Badge
            </Button>
          </div>
        </div>

        {playerImage && (
          <div className="mb-4">
            <ImagePositionControls
              label="Team Badge"
              position={imagePosition}
              onChange={setImagePosition}
            />
          </div>
        )}

        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 block">Fixtures (GW, Opponent, Difficulty 1-5, Home/Away)</label>
          {teamFixtures.map((fixture, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-2">
              <Input
                value={fixture.gw}
                onChange={(e) => {
                  const newFixtures = [...teamFixtures];
                  newFixtures[idx].gw = e.target.value;
                  setTeamFixtures(newFixtures);
                }}
                placeholder="GW"
              />
              <Input
                value={fixture.opponent}
                onChange={(e) => {
                  const newFixtures = [...teamFixtures];
                  newFixtures[idx].opponent = e.target.value;
                  setTeamFixtures(newFixtures);
                }}
                placeholder="Opponent"
              />
              <Input
                type="number"
                min="1"
                max="5"
                value={fixture.difficulty}
                onChange={(e) => {
                  const newFixtures = [...teamFixtures];
                  newFixtures[idx].difficulty = parseInt(e.target.value);
                  setTeamFixtures(newFixtures);
                }}
                placeholder="FDR"
              />
              <select
                value={fixture.home ? 'H' : 'A'}
                onChange={(e) => {
                  const newFixtures = [...teamFixtures];
                  newFixtures[idx].home = e.target.value === 'H';
                  setTeamFixtures(newFixtures);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="H">Home</option>
                <option value="A">Away</option>
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTeamFixtures(teamFixtures.filter((_, i) => i !== idx))}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => setTeamFixtures([...teamFixtures, { gw: `${parseInt(teamFixtures[teamFixtures.length - 1]?.gw || '28') + 1}`, opponent: 'TBD', difficulty: 3, home: true }])}
            className="w-full"
          >
            Add Fixture
          </Button>
        </div>
      </Card>

      {/* Preview Card */}
      <div className="flex justify-center overflow-x-auto">
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-cyan-600 via-blue-500 to-purple-600 rounded-2xl shadow-2xl inline-block"
          style={{ padding: '48px', minWidth: '750px', maxWidth: '900px', width: 'fit-content' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            {playerImage && (
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img 
                  src={playerImage} 
                  alt="Team badge" 
                  className="w-full h-full object-cover"
                  style={{ transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imagePosition.scale / 100})` }}
                />
              </div>
            )}
            <div className="text-5xl font-black text-white mb-2">{selectedTeam?.name || 'Team'}</div>
            <div className="text-2xl text-cyan-100 font-medium">Fixture Difficulty</div>
          </div>

          {/* Fixtures Grid */}
          <div className="space-y-4">
            {teamFixtures.map((fixture, idx) => {
              const colorClass = difficultyColors[fixture.difficulty - 1] || difficultyColors[2];
              return (
                <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-xl p-5 border border-white/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-white/80 text-sm font-bold bg-white/20 px-3 py-1 rounded-lg">
                        GW {fixture.gw}
                      </div>
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-2xl font-black text-white">{fixture.home ? 'vs' : '@'}</div>
                        <div className="text-3xl font-black text-white">{fixture.opponent} ({fixture.home ? 'H' : 'A'})</div>
                      </div>
                    </div>
                    <div className={`${colorClass.bg} ${colorClass.text} px-8 py-4 rounded-xl font-black text-2xl shadow-lg`}>
                      FDR {fixture.difficulty}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="text-center text-white/70 text-sm font-medium mt-8">
            @FPL_Dave_ • FPL Analytics
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={exportAsImage}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-lg py-6"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Fixture Card
        </Button>
      </div>
    </div>
  );
}