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
import { convertImageToBase64 } from '../../utils/imageUtils';

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
      // Convert external images to base64 to avoid CORS issues
      const imgElements = cardRef.current.querySelectorAll('img');
      const originalSrcs: string[] = [];
      
      // Store original sources and convert to base64
      for (let i = 0; i < imgElements.length; i++) {
        const img = imgElements[i];
        originalSrcs.push(img.src);
        
        // Only convert if it's an external URL (not already base64)
        if (!img.src.startsWith('data:')) {
          try {
            const base64 = await convertImageToBase64(img.src);
            if (base64) {
              img.src = base64;
            }
          } catch (err) {
            console.warn('Failed to convert image:', err);
          }
        }
      }
      
      // Wait a bit for images to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Export the card
      const dataUrl = await toPng(cardRef.current, { 
        quality: 1.0, 
        pixelRatio: 2,
        cacheBust: true,
      });
      
      // Restore original sources
      for (let i = 0; i < imgElements.length; i++) {
        imgElements[i].src = originalSrcs[i];
      }
      
      // Download the image
      const link = document.createElement('a');
      link.download = `${selectedTeam?.name || 'Team'}_Fixtures_GW${gameweekStart}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export image. Please try again.');
    }
  };

  const difficultyColors = [
    { bg: 'bg-[#375523]', text: 'text-white' },        // FDR 1 - Dark green
    { bg: 'bg-[#01FC7A]', text: 'text-[#375523]' },    // FDR 2 - Bright green
    { bg: 'bg-[#E7E7E7]', text: 'text-[#375523]' },    // FDR 3 - Light gray
    { bg: 'bg-[#FF1751]', text: 'text-white' },         // FDR 4 - Red
    { bg: 'bg-[#861134]', text: 'text-white' },         // FDR 5 - Dark red
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

      {/* Preview Card - SCALED FOR MOBILE */}
      <div className="flex justify-start overflow-hidden">
        <div className="w-[1080px] h-[1080px] scale-[0.35] md:scale-[0.50] xl:scale-[0.68] transition-all duration-500 origin-top-left -mb-[680px] md:-mb-[530px] xl:-mb-[400px] -mr-[702px] md:-mr-[540px] xl:-mr-[345px]">
          <div
            ref={cardRef}
            className="bg-gradient-to-br from-cyan-600 via-blue-500 to-purple-600 rounded-3xl shadow-2xl flex flex-col items-center justify-around p-16 w-[1080px] h-[1080px]"
          >
            {/* Header */}
            <div className="text-center">
              {playerImage && (
                <div className="w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden border-8 border-white shadow-lg">
                  <img 
                    src={playerImage} 
                    alt="Team badge" 
                    className="w-full h-full object-cover"
                    style={{ transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imagePosition.scale / 100})` }}
                  />
                </div>
              )}
              <div className="text-7xl font-black text-white mb-3">{selectedTeam?.name || 'Team'}</div>
              <div className="text-4xl text-cyan-100 font-medium">Fixture Difficulty</div>
            </div>

            {/* Fixtures Grid */}
            <div className="space-y-6 w-full max-w-4xl">
              {teamFixtures.map((fixture, idx) => {
                const colorClass = difficultyColors[fixture.difficulty - 1] || difficultyColors[2];
                return (
                  <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 border-4 border-white/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 flex-1">
                        <div className="text-white/90 text-xl font-bold bg-white/30 px-5 py-2 rounded-xl">
                          GW {fixture.gw}
                        </div>
                        <div className="flex items-center gap-5 flex-1">
                          <div className="text-4xl font-black text-white">{fixture.home ? 'vs' : '@'}</div>
                          <div className="text-5xl font-black text-white">{fixture.opponent} ({fixture.home ? 'H' : 'A'})</div>
                        </div>
                      </div>
                      <div className={`${colorClass.bg} ${colorClass.text} px-12 py-6 rounded-2xl font-black text-4xl shadow-lg`}>
                        FDR {fixture.difficulty}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="text-center text-white/70 text-2xl font-medium">
              @FPL_Dave_ • FPL Analytics
            </div>
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