import React, { useState, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Download, Upload, Search } from 'lucide-react';
import { Player } from '../../types/fpl';
import { toPng } from 'html-to-image';
import { ImagePositionControls } from '../ImagePositionControls';
import { convertImageToBase64 } from '../../utils/imageUtils';

interface StatsInfographicBuilderProps {
  players: Player[];
}

export function StatsInfographicBuilder({ players }: StatsInfographicBuilderProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [season, setSeason] = useState('2024/25');
  const [playerImage, setPlayerImage] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0, scale: 100 });
  const [searchQuery, setSearchQuery] = useState('');

  // Filter players based on search
  const filteredPlayers = players.filter(p =>
    p.web_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.team_name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 20);

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setSearchQuery('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      convertImageToBase64(file).then(base64 => {
        setPlayerImage(base64);
      });
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
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      
      // Restore original sources
      for (let i = 0; i < imgElements.length; i++) {
        imgElements[i].src = originalSrcs[i];
      }
      
      // Download the image
      const link = document.createElement('a');
      link.download = `${selectedPlayer?.web_name || 'Player'}_Stats_${season}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export image. Please try again.');
    }
  };

  if (!selectedPlayer) {
    return (
      <Card className="p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Select a Player</h3>
        <div className="max-w-2xl mx-auto">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for a player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-3 text-lg"
            />
          </div>

          {searchQuery && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredPlayers.map(player => (
                <div
                  key={player.id}
                  onClick={() => handlePlayerSelect(player)}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900">{player.web_name}</div>
                      <div className="text-sm text-gray-600">{player.team_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">{player.total_points} pts</div>
                      <div className="text-sm text-gray-600">£{(player.now_cost / 10).toFixed(1)}m</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }

  const stats = [
    { label: 'PPG', value: parseFloat(selectedPlayer.points_per_game).toFixed(1), icon: '📊' },
    { label: 'Goals', value: selectedPlayer.goals_scored.toString(), icon: '⚽' },
    { label: 'Assists', value: selectedPlayer.assists.toString(), icon: '🎯' },
    { label: 'ICT Index', value: selectedPlayer.ict_index, icon: '📈' },
    { label: 'xG', value: parseFloat(selectedPlayer.expected_goals || '0').toFixed(1), icon: '🎲' },
    { label: 'xA', value: parseFloat(selectedPlayer.expected_assists || '0').toFixed(1), icon: '🅰️' },
    { label: 'xGI', value: parseFloat(selectedPlayer.expected_goal_involvements || '0').toFixed(1), icon: '💫' },
    { label: 'Threat', value: selectedPlayer.threat, icon: '🔥' },
    { label: 'Creativity', value: selectedPlayer.creativity, icon: '🎨' },
    { label: 'Influence', value: selectedPlayer.influence, icon: '⭐' },
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-6 bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Stats Infographic Settings</h3>
            <p className="text-sm text-gray-600">Currently editing: {selectedPlayer.web_name}</p>
          </div>
          <Button onClick={() => setSelectedPlayer(null)} variant="outline">
            Change Player
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Season</label>
            <Input value={season} onChange={(e) => setSeason(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Player Photo (Optional)</label>
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
              Upload Photo
            </Button>
          </div>
        </div>

        {playerImage && (
          <div className="mb-4">
            <ImagePositionControls
              label="Player Photo"
              position={imagePosition}
              onChange={setImagePosition}
            />
          </div>
        )}
      </Card>

      {/* Preview Card - SCALED FOR MOBILE */}
      <div className="flex justify-start overflow-hidden">
        <div className="w-[1080px] h-[1080px] scale-[0.35] md:scale-[0.50] xl:scale-[0.68] transition-all duration-500 origin-top-left -mb-[680px] md:-mb-[530px] xl:-mb-[400px] -mr-[702px] md:-mr-[540px] xl:-mr-[345px]">
          <div
            ref={cardRef}
            className="w-[1080px] h-[1080px] bg-gradient-to-br from-pink-600 via-purple-500 to-indigo-600 rounded-[40px] shadow-2xl flex flex-col justify-between"
            style={{ padding: '80px' }}
          >
            {/* Header with Player Image */}
            <div className="flex items-center gap-6 mb-10">
              {playerImage ? (
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl flex-shrink-0">
                  <img 
                    src={playerImage} 
                    alt={selectedPlayer.web_name} 
                    className="w-full h-full object-cover"
                    style={{ transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imagePosition.scale / 100})` }}
                  />
                </div>
              ) : (
                <div className="w-40 h-40 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white flex items-center justify-center flex-shrink-0">
                  <span className="text-7xl">🌟</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-6xl font-black text-white mb-3 truncate">{selectedPlayer.web_name}</div>
                <div className="text-2xl text-pink-100 font-medium">{selectedPlayer.team_name} • {season}</div>
                <div className="text-3xl text-white font-black mt-2">£{(selectedPlayer.now_cost / 10).toFixed(1)}m</div>
              </div>
            </div>

            {/* Stats Grid - 5 columns (2 rows) */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-5 text-center shadow-xl transform hover:scale-105 transition-transform">
                  <div className="text-4xl mb-2">{stat.icon}</div>
                  <div className="text-4xl font-black text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm font-bold text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Total Points Highlight */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center border-2 border-white/40">
              <div className="text-white/90 text-lg font-medium mb-2">Total Points</div>
              <div className="text-white text-7xl font-black drop-shadow-lg">{selectedPlayer.total_points}</div>
            </div>

            {/* Footer */}
            <div className="text-center text-white/80 text-sm font-bold mt-8 bg-white/20 backdrop-blur-sm rounded-full py-3 px-6 inline-block mx-auto">
              @FPL_Dave_ • FPL Analytics
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={exportAsImage}
          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-lg py-6"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Stats Card
        </Button>
      </div>
    </div>
  );
}