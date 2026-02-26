import React, { useState, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Download, Upload } from 'lucide-react';
import { Player } from '../../types/fpl';
import { toPng } from 'html-to-image';
import { ImagePositionControls } from '../ImagePositionControls';

interface TeamLineupBuilderProps {
  players: Player[];
}

export function TeamLineupBuilder({ players }: TeamLineupBuilderProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [formation, setFormation] = useState('4-3-3');
  const [teamName, setTeamName] = useState('My FPL Team');
  const [gameweek, setGameweek] = useState('28');
  const [selectedPlayers, setSelectedPlayers] = useState<Array<{ name: string; image: string | null; position: { x: number; y: number; scale: number } }>>([
    { name: 'Pope', image: null, position: { x: 0, y: 0, scale: 100 } },
    { name: 'Alexander-Arnold', image: null, position: { x: 0, y: 0, scale: 100 } },
    { name: 'Gabriel', image: null, position: { x: 0, y: 0, scale: 100 } },
    { name: 'Trippier', image: null, position: { x: 0, y: 0, scale: 100 } },
    { name: 'Robertson', image: null, position: { x: 0, y: 0, scale: 100 } },
    { name: 'Salah', image: null, position: { x: 0, y: 0, scale: 100 } },
    { name: 'Saka', image: null, position: { x: 0, y: 0, scale: 100 } },
    { name: 'Palmer', image: null, position: { x: 0, y: 0, scale: 100 } },
    { name: 'Haaland', image: null, position: { x: 0, y: 0, scale: 100 } },
    { name: 'Watkins', image: null, position: { x: 0, y: 0, scale: 100 } },
    { name: 'Isak', image: null, position: { x: 0, y: 0, scale: 100 } },
  ]);

  const fileInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newPlayers = [...selectedPlayers];
        newPlayers[index].image = event.target?.result as string;
        setSelectedPlayers(newPlayers);
      };
      reader.readAsDataURL(file);
    }
  };

  const exportAsImage = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1.0, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Team_Lineup_GW${gameweek}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const formations = formation.split('-').map(Number);
  const positionPlayers = [
    selectedPlayers.slice(0, 1), // GK
    selectedPlayers.slice(1, 1 + formations[0]), // DEF
    selectedPlayers.slice(1 + formations[0], 1 + formations[0] + formations[1]), // MID
    selectedPlayers.slice(1 + formations[0] + formations[1]) // FWD
  ];

  const positionColors = [
    { bg: 'bg-yellow-500', border: 'border-yellow-400', label: 'bg-yellow-600/80' }, // GK
    { bg: 'bg-green-500', border: 'border-green-400', label: 'bg-green-700/80' }, // DEF
    { bg: 'bg-blue-500', border: 'border-blue-400', label: 'bg-blue-600/80' }, // MID
    { bg: 'bg-red-500', border: 'border-red-400', label: 'bg-red-600/80' }, // FWD
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Team Lineup Settings</h3>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Formation (Read-only)</label>
            <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-medium">
              {formation}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Team Name</label>
            <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Gameweek</label>
            <Input value={gameweek} onChange={(e) => setGameweek(e.target.value)} />
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 block">Players (Name & Photo)</label>
          {selectedPlayers.map((player, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={player.name}
                  onChange={(e) => {
                    const newPlayers = [...selectedPlayers];
                    newPlayers[idx].name = e.target.value;
                    setSelectedPlayers(newPlayers);
                  }}
                  placeholder={`Player ${idx + 1}`}
                />
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
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {player.image ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                </div>
              </div>
              {player.image && (
                <ImagePositionControls
                  label={`Player ${idx + 1}`}
                  position={player.position}
                  onChange={(newPosition) => {
                    const newPlayers = [...selectedPlayers];
                    newPlayers[idx].position = newPosition;
                    setSelectedPlayers(newPlayers);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Preview Card */}
      <div className="flex justify-center overflow-x-auto">
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-2xl mx-auto relative overflow-hidden inline-block"
          style={{ padding: '48px', minWidth: '750px', maxWidth: '900px', width: 'fit-content' }}
        >
          {/* Pitch lines */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
            <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          </div>

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="text-4xl font-black text-white mb-1">{teamName}</div>
            <div className="text-xl text-green-100 font-medium">Gameweek {gameweek} • {formation}</div>
          </div>

          {/* Formation */}
          <div className="space-y-8 relative z-10">
            {/* Forwards */}
            <div className="flex justify-center gap-6">
              {positionPlayers[3]?.map((player, idx) => (
                <div key={idx} className="text-center">
                  <div className={`w-16 h-16 ${positionColors[3].bg} border-4 ${positionColors[3].border} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg mb-2 overflow-hidden`}>
                    {player.image ? (
                      <img 
                        src={player.image} 
                        alt={player.name} 
                        className="w-full h-full object-cover"
                        style={{ transform: `translate(${player.position.x}%, ${player.position.y}%) scale(${player.position.scale / 100})` }}
                      />
                    ) : (
                      player.name.substring(0, 3).toUpperCase()
                    )}
                  </div>
                  <div className={`text-white text-sm font-bold ${positionColors[3].label} px-3 py-1 rounded-full`}>{player.name}</div>
                </div>
              ))}
            </div>

            {/* Midfielders */}
            <div className="flex justify-center gap-6">
              {positionPlayers[2]?.map((player, idx) => (
                <div key={idx} className="text-center">
                  <div className={`w-16 h-16 ${positionColors[2].bg} border-4 ${positionColors[2].border} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg mb-2 overflow-hidden`}>
                    {player.image ? (
                      <img 
                        src={player.image} 
                        alt={player.name} 
                        className="w-full h-full object-cover"
                        style={{ transform: `translate(${player.position.x}%, ${player.position.y}%) scale(${player.position.scale / 100})` }}
                      />
                    ) : (
                      player.name.substring(0, 3).toUpperCase()
                    )}
                  </div>
                  <div className={`text-white text-sm font-bold ${positionColors[2].label} px-3 py-1 rounded-full`}>{player.name}</div>
                </div>
              ))}
            </div>

            {/* Defenders */}
            <div className="flex justify-center gap-6">
              {positionPlayers[1]?.map((player, idx) => (
                <div key={idx} className="text-center">
                  <div className={`w-16 h-16 ${positionColors[1].bg} border-4 ${positionColors[1].border} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg mb-2 overflow-hidden`}>
                    {player.image ? (
                      <img 
                        src={player.image} 
                        alt={player.name} 
                        className="w-full h-full object-cover"
                        style={{ transform: `translate(${player.position.x}%, ${player.position.y}%) scale(${player.position.scale / 100})` }}
                      />
                    ) : (
                      player.name.substring(0, 3).toUpperCase()
                    )}
                  </div>
                  <div className={`text-white text-sm font-bold ${positionColors[1].label} px-3 py-1 rounded-full`}>{player.name}</div>
                </div>
              ))}
            </div>

            {/* Goalkeeper */}
            <div className="flex justify-center">
              {positionPlayers[0]?.map((player, idx) => (
                <div key={idx} className="text-center">
                  <div className={`w-16 h-16 ${positionColors[0].bg} border-4 ${positionColors[0].border} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg mb-2 overflow-hidden`}>
                    {player.image ? (
                      <img 
                        src={player.image} 
                        alt={player.name} 
                        className="w-full h-full object-cover"
                        style={{ transform: `translate(${player.position.x}%, ${player.position.y}%) scale(${player.position.scale / 100})` }}
                      />
                    ) : (
                      player.name.substring(0, 3).toUpperCase()
                    )}
                  </div>
                  <div className={`text-white text-sm font-bold ${positionColors[0].label} px-3 py-1 rounded-full`}>{player.name}</div>
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