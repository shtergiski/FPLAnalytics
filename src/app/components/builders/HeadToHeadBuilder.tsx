import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Download, Upload } from 'lucide-react';
import { Player } from '../../types/fpl';
import { toPng } from 'html-to-image';
import { ImagePositionControls } from '../ImagePositionControls';
import { PlayerCombobox } from '../ui/player-combobox';
import { Loading } from '../ui/loading';
import { useFPLStore } from '../../store/fpl-store';
import { convertImageToBase64 } from '../../utils/imageUtils';

interface HeadToHeadBuilderProps {
  players: Player[];
}

export function HeadToHeadBuilder({ players }: HeadToHeadBuilderProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { bootstrap, fetchBootstrapData } = useFPLStore();
  const [loading, setLoading] = useState(false);
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const [player1Image, setPlayer1Image] = useState<string | null>(null);
  const [player1Position, setPlayer1Position] = useState({ x: 0, y: 0, scale: 100 });
  const [player2Image, setPlayer2Image] = useState<string | null>(null);
  const [player2Position, setPlayer2Position] = useState({ x: 0, y: 0, scale: 100 });

  // Load bootstrap data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!bootstrap) {
        setLoading(true);
        await fetchBootstrapData();
        setLoading(false);
      }
    };
    loadData();
  }, [bootstrap, fetchBootstrapData]);

  // Auto-load official player photos when players are selected
  useEffect(() => {
    if (player1) {
      const photoUrl = `https://resources.premierleague.com/premierleague/photos/players/110x140/p${player1.code}.png`;
      setPlayer1Image(photoUrl);
    }
  }, [player1]);

  useEffect(() => {
    if (player2) {
      const photoUrl = `https://resources.premierleague.com/premierleague/photos/players/110x140/p${player2.code}.png`;
      setPlayer2Image(photoUrl);
    }
  }, [player2]);

  const handleImageUpload = (type: 1 | 2, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (type === 1) {
          setPlayer1Image(event.target?.result as string);
        } else {
          setPlayer2Image(event.target?.result as string);
        }
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
      link.download = `${player1?.web_name}_vs_${player2?.web_name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export image. Please try again.');
    }
  };

  if (loading) {
    return <Loading message="Loading players..." />;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Select Players to Compare</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Player 1</label>
              <PlayerCombobox
                players={players}
                value={player1?.id}
                onSelect={setPlayer1}
                placeholder="Search for Player 1..."
              />
            </div>
            <ImagePositionControls
              label="Player 1 Photo"
              position={player1Position}
              onChange={setPlayer1Position}
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Player 2</label>
              <PlayerCombobox
                players={players}
                value={player2?.id}
                onSelect={setPlayer2}
                placeholder="Search for Player 2..."
              />
            </div>
            <ImagePositionControls
              label="Player 2 Photo"
              position={player2Position}
              onChange={setPlayer2Position}
            />
          </div>
        </div>
      </Card>

      {!player1 || !player2 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 text-lg">Select two players to compare</p>
        </Card>
      ) : (
        <>
          {/* Preview Card - SCALED FOR MOBILE */}
          <div className="flex justify-start overflow-hidden">
            <div className="w-[1080px] h-[1080px] scale-[0.35] md:scale-[0.50] xl:scale-[0.68] transition-all duration-500 origin-top-left -mb-[680px] md:-mb-[530px] xl:-mb-[400px] -mr-[702px] md:-mr-[540px] xl:-mr-[345px]">
              <div
                ref={cardRef}
                className="bg-gradient-to-r from-orange-600 via-red-500 to-pink-600 rounded-3xl shadow-2xl flex flex-col items-center justify-around p-16 w-[1080px] h-[1080px]"
              >
                {/* Header */}
                <div className="text-center">
                  <div className="text-7xl font-black text-white mb-3">HEAD TO HEAD</div>
                  <div className="text-4xl text-orange-100 font-medium">Player Comparison</div>
                </div>

                {/* Players Grid */}
                <div className="grid grid-cols-2 gap-12 w-full max-w-5xl">
                  {/* Player 1 */}
                  <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-10 border-4 border-white/30">
                    <div className="text-center mb-6">
                      {player1Image ? (
                        <div className="w-44 h-44 mx-auto mb-6 rounded-full overflow-hidden border-8 border-white shadow-lg">
                          <img
                            src={player1Image}
                            alt={player1.web_name}
                            className="w-full h-full object-cover"
                            style={{
                              transform: `translate(${player1Position.x}px, ${player1Position.y}px) scale(${player1Position.scale / 100})`,
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-44 h-44 mx-auto mb-6 rounded-full bg-white/20 border-8 border-white flex items-center justify-center">
                          <span className="text-8xl">👤</span>
                        </div>
                      )}
                      <div className="text-5xl font-black text-white mb-2">{player1.web_name}</div>
                      <div className="text-3xl text-white/90">{player1.team_name}</div>
                      <div className="text-4xl font-bold text-white mt-4">£{(player1.now_cost / 10).toFixed(1)}m</div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-white">
                        <span className="text-white/80 text-2xl">Total Points</span>
                        <span className="font-bold text-3xl">{player1.total_points}</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span className="text-white/80 text-2xl">Form</span>
                        <span className="font-bold text-3xl">{player1.form}</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span className="text-white/80 text-2xl">Goals</span>
                        <span className="font-bold text-3xl">{player1.goals_scored}</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span className="text-white/80 text-2xl">Assists</span>
                        <span className="font-bold text-3xl">{player1.assists}</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span className="text-white/80 text-2xl">Ownership</span>
                        <span className="font-bold text-3xl">{player1.selected_by_percent}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Player 2 */}
                  <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-10 border-4 border-white/30">
                    <div className="text-center mb-6">
                      {player2Image ? (
                        <div className="w-44 h-44 mx-auto mb-6 rounded-full overflow-hidden border-8 border-white shadow-lg">
                          <img
                            src={player2Image}
                            alt={player2.web_name}
                            className="w-full h-full object-cover"
                            style={{
                              transform: `translate(${player2Position.x}px, ${player2Position.y}px) scale(${player2Position.scale / 100})`,
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-44 h-44 mx-auto mb-6 rounded-full bg-white/20 border-8 border-white flex items-center justify-center">
                          <span className="text-8xl">👤</span>
                        </div>
                      )}
                      <div className="text-5xl font-black text-white mb-2">{player2.web_name}</div>
                      <div className="text-3xl text-white/90">{player2.team_name}</div>
                      <div className="text-4xl font-bold text-white mt-4">£{(player2.now_cost / 10).toFixed(1)}m</div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-white">
                        <span className="text-white/80 text-2xl">Total Points</span>
                        <span className="font-bold text-3xl">{player2.total_points}</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span className="text-white/80 text-2xl">Form</span>
                        <span className="font-bold text-3xl">{player2.form}</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span className="text-white/80 text-2xl">Goals</span>
                        <span className="font-bold text-3xl">{player2.goals_scored}</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span className="text-white/80 text-2xl">Assists</span>
                        <span className="font-bold text-3xl">{player2.assists}</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span className="text-white/80 text-2xl">Ownership</span>
                        <span className="font-bold text-3xl">{player2.selected_by_percent}%</span>
                      </div>
                    </div>
                  </div>
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
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-lg py-6"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Comparison
            </Button>
          </div>
        </>
      )}
    </div>
  );
}