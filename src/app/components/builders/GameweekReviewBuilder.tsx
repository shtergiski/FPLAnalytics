import React, { useState, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Download, Share2, Upload } from 'lucide-react';
import { Player } from '../../types/fpl';
import { toPng } from 'html-to-image';
import { convertImageToBase64 } from '../../utils/imageUtils';

interface GameweekReviewBuilderProps {
  players: Player[];
}

export function GameweekReviewBuilder({ players }: GameweekReviewBuilderProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const captainImageRef = useRef<HTMLInputElement>(null);
  const topScorerImageRef = useRef<HTMLInputElement>(null);
  const [gameweek, setGameweek] = useState('28');
  const [totalPoints, setTotalPoints] = useState('67');
  const [rank, setRank] = useState('1.2M');
  const [captain, setCaptain] = useState(players[0]?.web_name || 'Haaland');
  const [captainPoints, setCaptainPoints] = useState('18');
  const [captainImage, setCaptainImage] = useState<string | null>(null);
  const [captainPosition, setCaptainPosition] = useState({ x: 50, y: 50, scale: 100 });
  const [chipUsed, setChipUsed] = useState('');
  const [topScorer, setTopScorer] = useState(players[0]?.web_name || 'Salah');
  const [topScorerPoints, setTopScorerPoints] = useState('12');
  const [topScorerImage, setTopScorerImage] = useState<string | null>(null);
  const [topScorerPosition, setTopScorerPosition] = useState({ x: 50, y: 50, scale: 100 });

  const handleImageUpload = (type: 'captain' | 'topScorer', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (type === 'captain') {
          setCaptainImage(event.target?.result as string);
        } else {
          setTopScorerImage(event.target?.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const exportAsImage = async (format: 'png' | 'jpeg') => {
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
      link.download = `GW${gameweek}_Review.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export image. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-purple-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Gameweek Review Settings</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Gameweek</label>
            <Input value={gameweek} onChange={(e) => setGameweek(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Total Points</label>
            <Input value={totalPoints} onChange={(e) => setTotalPoints(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Rank</label>
            <Input value={rank} onChange={(e) => setRank(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Captain</label>
            <Input value={captain} onChange={(e) => setCaptain(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Captain Points</label>
            <Input value={captainPoints} onChange={(e) => setCaptainPoints(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Captain Photo</label>
            <input
              ref={captainImageRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload('captain', e)}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => captainImageRef.current?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Photo
            </Button>
          </div>
          {captainImage && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Captain Photo X Position</label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={captainPosition.x}
                  onChange={(e) => setCaptainPosition({ ...captainPosition, x: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Captain Photo Y Position</label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={captainPosition.y}
                  onChange={(e) => setCaptainPosition({ ...captainPosition, y: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Captain Photo Scale</label>
                <Input
                  type="range"
                  min="50"
                  max="200"
                  value={captainPosition.scale}
                  onChange={(e) => setCaptainPosition({ ...captainPosition, scale: parseInt(e.target.value) })}
                />
              </div>
            </>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Chip Used</label>
            <Input value={chipUsed} onChange={(e) => setChipUsed(e.target.value)} placeholder="Triple Captain" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Top Scorer</label>
            <Input value={topScorer} onChange={(e) => setTopScorer(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Top Scorer Points</label>
            <Input value={topScorerPoints} onChange={(e) => setTopScorerPoints(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Top Scorer Photo</label>
            <input
              ref={topScorerImageRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload('topScorer', e)}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => topScorerImageRef.current?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Photo
            </Button>
          </div>
          {topScorerImage && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Top Scorer Photo X Position</label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={topScorerPosition.x}
                  onChange={(e) => setTopScorerPosition({ ...topScorerPosition, x: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Top Scorer Photo Y Position</label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={topScorerPosition.y}
                  onChange={(e) => setTopScorerPosition({ ...topScorerPosition, y: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Top Scorer Photo Scale</label>
                <Input
                  type="range"
                  min="50"
                  max="200"
                  value={topScorerPosition.scale}
                  onChange={(e) => setTopScorerPosition({ ...topScorerPosition, scale: parseInt(e.target.value) })}
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Preview Card - SCALED FOR MOBILE */}
      <div className="flex justify-start overflow-hidden">
        <div className="w-[1080px] h-[1080px] scale-[0.35] md:scale-[0.50] xl:scale-[0.68] transition-all duration-500 origin-top-left -mb-[680px] md:-mb-[530px] xl:-mb-[400px] -mr-[702px] md:-mr-[540px] xl:-mr-[345px]">
          <div
            ref={cardRef}
            className="w-[1080px] h-[1080px] bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 rounded-[40px] shadow-2xl flex flex-col justify-between"
            style={{ padding: '60px' }}
          >
            {/* Header */}
            <div className="text-center">
              <div className="text-8xl font-black text-white mb-3">GAMEWEEK {gameweek}</div>
              <div className="text-3xl text-blue-100 font-medium">Review</div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 text-center border border-white/30">
                <div className="text-white/80 text-xl font-medium mb-3">Total Points</div>
                <div className="text-8xl font-black text-white">{totalPoints}</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 text-center border border-white/30">
                <div className="text-white/80 text-xl font-medium mb-3">Overall Rank</div>
                <div className="text-8xl font-black text-white">{rank}</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 text-center border border-white/30">
                {captainImage && (
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden border-3 border-white shadow-lg">
                    <img
                      src={captainImage}
                      alt={captain}
                      className="w-full h-full object-cover"
                      style={{
                        transform: `translate(${captainPosition.x}%, ${captainPosition.y}%) scale(${captainPosition.scale}%)`,
                      }}
                    />
                  </div>
                )}
                <div className="text-white/80 text-xl font-medium mb-3">Captain</div>
                <div className="text-4xl font-black text-white">{captain}</div>
                <div className="text-3xl text-white/90 font-bold mt-1">{captainPoints} pts</div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl p-5 text-center">
                {topScorerImage && (
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden border-3 border-purple-600 shadow-lg">
                    <img
                      src={topScorerImage}
                      alt={topScorer}
                      className="w-full h-full object-cover"
                      style={{
                        transform: `translate(${topScorerPosition.x}%, ${topScorerPosition.y}%) scale(${topScorerPosition.scale}%)`,
                      }}
                    />
                  </div>
                )}
                <div className="text-gray-600 text-sm font-medium mb-1">Top Scorer</div>
                <div className="text-3xl font-black text-purple-600">{topScorer}</div>
                <div className="text-xl font-bold text-gray-700">{topScorerPoints} points</div>
              </div>
              {chipUsed && (
                <div className="bg-white rounded-xl p-5 text-center">
                  <div className="text-gray-600 text-sm font-medium mb-1">Chip Used</div>
                  <div className="text-3xl font-black text-blue-600">{chipUsed}</div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-white/70 text-sm font-medium">
              @FPL_Dave_ • FPL Analytics
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => exportAsImage('png')}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-lg py-6"
        >
          <Download className="w-5 h-5 mr-2" />
          Download PNG
        </Button>
        <Button
          onClick={() => exportAsImage('jpeg')}
          variant="outline"
          className="flex-1 text-lg py-6"
        >
          <Download className="w-5 h-5 mr-2" />
          Download JPG
        </Button>
      </div>
    </div>
  );
}