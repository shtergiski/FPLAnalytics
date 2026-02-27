import React, { useRef, useState } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Download, Share2, Upload, X, ImageIcon, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Player } from '../types/fpl';
import { useFPLStore } from '../store/fpl-store';
import { convertImageToBase64 } from '../utils/imageUtils';

interface ExportablePlayerCardProps {
  player: Player;
  fixtures?: Array<{
    opponent: string;
    difficulty: number;
    isHome: boolean;
  }>;
}

export function ExportablePlayerCard({ player, fixtures }: ExportablePlayerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [playerImage, setPlayerImage] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 }); // Center position
  const [imageZoom, setImageZoom] = useState(100);
  const { getTeamName } = useFPLStore();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlayerImage(reader.result as string);
        // Reset position and zoom when new image is uploaded
        setImagePosition({ x: 50, y: 50 });
        setImageZoom(100);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPlayerImage(null);
    setImagePosition({ x: 50, y: 50 });
    setImageZoom(100);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      const dataUrl = format === 'png' 
        ? await toPng(cardRef.current, { quality: 1.0, pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true })
        : await toJpeg(cardRef.current, { quality: 0.95, pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true });
      
      // Restore original sources
      for (let i = 0; i < imgElements.length; i++) {
        imgElements[i].src = originalSrcs[i];
      }
      
      // Download the image
      const link = document.createElement('a');
      link.download = `${player.web_name.replace(/\s+/g, '_')}_FPL_Card.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export image:', error);
      alert('Failed to export image. Please try again.');
    }
  };

  const shareCard = async () => {
    if (!cardRef.current) return;

    try {
      // Convert external images to base64 to avoid CORS issues
      const imgElements = cardRef.current.querySelectorAll('img');
      const originalSrcs: string[] = [];
      
      for (let i = 0; i < imgElements.length; i++) {
        const img = imgElements[i];
        originalSrcs.push(img.src);
        
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
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(cardRef.current, { quality: 1.0, pixelRatio: 2 });
      
      // Restore original sources
      for (let i = 0; i < imgElements.length; i++) {
        imgElements[i].src = originalSrcs[i];
      }
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${player.web_name}_FPL.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${player.web_name} - FPL Stats`,
          text: `Check out ${player.web_name}'s FPL stats! £${(player.now_cost / 10).toFixed(1)}m | ${player.total_points} pts`,
        });
      } else {
        // Fallback to download
        exportAsImage('png');
      }
    } catch (error) {
      console.error('Failed to share:', error);
      alert('Failed to share card. Please try again.');
    }
  };

  const positionColors = {
    1: { bg: 'bg-yellow-500', text: 'text-yellow-50', name: 'GK' },
    2: { bg: 'bg-green-500', text: 'text-green-50', name: 'DEF' },
    3: { bg: 'bg-blue-500', text: 'text-blue-50', name: 'MID' },
    4: { bg: 'bg-red-500', text: 'text-red-50', name: 'FWD' },
  };

  const positionStyle = positionColors[player.element_type as keyof typeof positionColors];

  const priceChange = player.cost_change_start / 10;
  const form = parseFloat(player.form);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Image Upload Section */}
      <Card className="p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Player Image</h3>
            <p className="text-xs sm:text-sm text-gray-600">Upload a custom player image (optional)</p>
          </div>
          {playerImage && (
            <Button
              variant="outline"
              size="sm"
              onClick={removeImage}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          )}
        </div>

        {!playerImage ? (
          <div className="flex gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="player-image-upload"
            />
            <label
              htmlFor="player-image-upload"
              className="flex-1 cursor-pointer"
            >
              <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 sm:p-8 text-center hover:border-purple-500 hover:bg-purple-50/50 transition-all">
                <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400 mx-auto mb-3" />
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Click to upload player image
                </p>
                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Preview with Positioning */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
              {/* Preview Circle */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-purple-300 shadow-lg">
                  <img
                    src={playerImage}
                    alt="Player preview"
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                      transform: `scale(${imageZoom / 100})`,
                    }}
                  />
                </div>
              </div>

              {/* Position Controls */}
              <div className="flex-1 w-full space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Move className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                    Horizontal Position
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={imagePosition.x}
                    onChange={(e) => setImagePosition(prev => ({ ...prev, x: Number(e.target.value) }))}
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Move className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 rotate-90" />
                    Vertical Position
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={imagePosition.y}
                    onChange={(e) => setImagePosition(prev => ({ ...prev, y: Number(e.target.value) }))}
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                    Zoom ({imageZoom}%)
                  </label>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImageZoom(Math.max(50, imageZoom - 10))}
                      disabled={imageZoom <= 50}
                      className="p-2"
                    >
                      <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={imageZoom}
                      onChange={(e) => setImageZoom(Number(e.target.value))}
                      className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImageZoom(Math.min(200, imageZoom + 10))}
                      disabled={imageZoom >= 200}
                      className="p-2"
                    >
                      <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Image Button */}
            <div className="flex gap-3">
              <label
                htmlFor="player-image-upload"
                className="flex-1 cursor-pointer"
              >
                <div className="border-2 border-purple-300 rounded-lg p-3 text-center hover:border-purple-500 hover:bg-purple-50 transition-all">
                  <p className="text-xs sm:text-sm font-medium text-gray-700">
                    Click to change image
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}
      </Card>

      {/* Exportable Card */}
      <div className="overflow-hidden">
        <div className="flex justify-start overflow-x-auto pb-4">
          <div 
            ref={cardRef} 
            className="bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 rounded-2xl shadow-2xl inline-block"
            style={{ padding: '32px', minWidth: '320px', maxWidth: '700px', width: 'fit-content' }}
          >
            {/* Header with Player Image */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Player Image Circle */}
              <div className="flex-shrink-0">
                {playerImage ? (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
                    <img
                      src={playerImage}
                      alt={player.web_name}
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                        transform: `scale(${imageZoom / 100})`,
                      }}
                    />
                  </div>
                ) : (
                  <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full ${positionStyle.bg} border-4 border-white shadow-xl flex items-center justify-center`}>
                    <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-white/50" />
                  </div>
                )}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className={`inline-flex items-center gap-2 ${positionStyle.bg} ${positionStyle.text} px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold mb-2 sm:mb-3`}>
                  {positionStyle.name}
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white mb-1 sm:mb-2 drop-shadow-lg truncate">
                  {player.web_name}
                </h2>
                <div className="text-purple-100 text-sm sm:text-lg font-medium">
                  {player.team_name}
                </div>
              </div>

              {/* Price */}
              <div className="text-center sm:text-right flex-shrink-0">
                <div className="text-3xl sm:text-5xl font-black text-white">
                  £{(player.now_cost / 10).toFixed(1)}
                </div>
              </div>
            </div>

            {/* Stats Grid - 3 columns */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-white rounded-xl p-3 sm:p-5 text-center shadow-lg">
                <div className="text-2xl sm:text-4xl font-black text-purple-600">
                  {player.selected_by_percent}%
                </div>
                <div className="text-gray-600 text-xs sm:text-sm font-medium mt-1">Ownership</div>
              </div>
              <div className="bg-white rounded-xl p-3 sm:p-5 text-center shadow-lg">
                <div className="text-2xl sm:text-4xl font-black text-purple-600">{player.form}</div>
                <div className="text-gray-600 text-xs sm:text-sm font-medium mt-1">Form</div>
              </div>
              <div className="bg-white rounded-xl p-3 sm:p-5 text-center shadow-lg">
                <div className="text-2xl sm:text-4xl font-black text-purple-600">
                  {parseFloat(player.points_per_game).toFixed(1)}
                </div>
                <div className="text-gray-600 text-xs sm:text-sm font-medium mt-1">PPG</div>
              </div>
            </div>

            {/* Total Points */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="text-white text-4xl sm:text-6xl font-black drop-shadow-lg">
                {player.total_points}
              </div>
              <div className="text-purple-200 text-xs sm:text-sm font-medium mt-1">Total Points</div>
            </div>

            {/* Fixtures Strip - Official FPL Colors */}
            {fixtures && fixtures.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <div className="flex gap-0.5 sm:gap-1 h-3 sm:h-4 rounded-full overflow-hidden shadow-lg">
                  {fixtures.slice(0, 5).map((fixture, index) => {
                    // Official FPL FDR Colors
                    const difficultyColors = [
                      'bg-[#01FC7C]',  // FDR 1 - Dark Green
                      'bg-[#00FF87]',  // FDR 2 - Light Green  
                      'bg-gray-400',   // FDR 3 - Gray
                      'bg-[#FF1751]',  // FDR 4 - Pink/Red
                      'bg-[#861134]',  // FDR 5 - Dark Red
                    ];
                    return (
                      <div 
                        key={index}
                        className={`flex-1 ${difficultyColors[fixture.difficulty - 1]}`}
                        title={`${fixture.opponent} (${fixture.isHome ? 'H' : 'A'}) - FDR ${fixture.difficulty}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-white/60 text-xs">
                  {fixtures.slice(0, 5).map((fixture, index) => (
                    <div key={index} className="text-center flex-1">
                      <div className="font-semibold truncate px-0.5">{fixture.opponent}</div>
                      <div>{fixture.isHome ? 'H' : 'A'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-white/70 text-xs sm:text-sm font-medium mt-4 sm:mt-6">
              @FPL_Dave_ • FPL Analytics
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={() => exportAsImage('png')}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-base sm:text-lg py-4 sm:py-6"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Download PNG
        </Button>
        <Button 
          onClick={() => exportAsImage('jpeg')}
          variant="outline"
          className="flex-1 text-base sm:text-lg py-4 sm:py-6"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Download JPG
        </Button>
        <Button 
          onClick={shareCard}
          variant="outline"
          className="flex-1 text-base sm:text-lg py-4 sm:py-6"
        >
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
}