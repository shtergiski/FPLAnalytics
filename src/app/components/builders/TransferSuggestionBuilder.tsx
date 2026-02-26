import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Download, Upload, ArrowRight } from 'lucide-react';
import { Player } from '../../types/fpl';
import { toPng } from 'html-to-image';
import { ImagePositionControls } from '../ImagePositionControls';
import { PlayerCombobox } from '../ui/player-combobox';
import { useFPLStore } from '../../store/fpl-store';
import { Loading } from '../ui/loading';

interface TransferSuggestionBuilderProps {
  players: Player[];
}

export function TransferSuggestionBuilder({ players }: TransferSuggestionBuilderProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { bootstrap, fetchBootstrapData } = useFPLStore();
  const [loading, setLoading] = useState(false);
  const [gameweek, setGameweek] = useState('28');
  const [selectedPlayerOut, setSelectedPlayerOut] = useState<Player | null>(null);
  const [selectedPlayerIn, setSelectedPlayerIn] = useState<Player | null>(null);
  const [imageOut, setImageOut] = useState<string | null>(null);
  const [positionOut, setPositionOut] = useState({ x: 50, y: 50, scale: 100 });
  const [imageIn, setImageIn] = useState<string | null>(null);
  const [positionIn, setPositionIn] = useState({ x: 50, y: 50, scale: 100 });
  const [reasonTitle, setReasonTitle] = useState('Form & Fixtures');
  const [reasons, setReasons] = useState([
    '🔥 Great recent form with consistent returns',
    '📅 Favorable fixture run ahead',
    '📉 Better value for money option',
  ]);

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

  // Auto-load official player photos when player is selected
  useEffect(() => {
    if (selectedPlayerOut) {
      const photoUrl = `https://resources.premierleague.com/premierleague/photos/players/110x140/p${selectedPlayerOut.code}.png`;
      setImageOut(photoUrl);
    }
  }, [selectedPlayerOut]);

  useEffect(() => {
    if (selectedPlayerIn) {
      const photoUrl = `https://resources.premierleague.com/premierleague/photos/players/110x140/p${selectedPlayerIn.code}.png`;
      setImageIn(photoUrl);
    }
  }, [selectedPlayerIn]);

  const handleImageUpload = (type: 'out' | 'in', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (type === 'out') {
          setImageOut(event.target?.result as string);
        } else {
          setImageIn(event.target?.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const exportAsImage = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1.0, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Transfer_${selectedPlayerOut?.web_name}_to_${selectedPlayerIn?.web_name}_GW${gameweek}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  if (loading) {
    return <Loading message="Loading players..." />;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Transfer Suggestion Settings</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Gameweek</label>
            <Input value={gameweek} onChange={(e) => setGameweek(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Reason Title</label>
            <Input value={reasonTitle} onChange={(e) => setReasonTitle(e.target.value)} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-4">
          {/* Player Out */}
          <div className="space-y-3">
            <h4 className="font-bold text-red-600">Transfer Out</h4>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Search Player</label>
              <PlayerCombobox
                players={players}
                value={selectedPlayerOut?.id}
                onSelect={setSelectedPlayerOut}
                placeholder="Search player to transfer out..."
              />
            </div>
            <ImagePositionControls
              label="Player Out Photo"
              position={positionOut}
              onChange={setPositionOut}
            />
          </div>

          {/* Player In */}
          <div className="space-y-3">
            <h4 className="font-bold text-green-600">Transfer In</h4>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Search Player</label>
              <PlayerCombobox
                players={players}
                value={selectedPlayerIn?.id}
                onSelect={setSelectedPlayerIn}
                placeholder="Search player to transfer in..."
              />
            </div>
            <ImagePositionControls
              label="Player In Photo"
              position={positionIn}
              onChange={setPositionIn}
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 block">Reasons (with emoji)</label>
          {reasons.map((reason, idx) => (
            <Input
              key={idx}
              value={reason}
              onChange={(e) => {
                const newReasons = [...reasons];
                newReasons[idx] = e.target.value;
                setReasons(newReasons);
              }}
              placeholder="Add a reason with emoji"
            />
          ))}
          <Button
            variant="outline"
            onClick={() => setReasons([...reasons, '✅ Add your reason here'])}
            className="w-full"
          >
            Add Reason
          </Button>
        </div>
      </Card>

      {/* Preview Card */}
      <div className="flex justify-center overflow-x-auto">
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-600 rounded-2xl shadow-2xl inline-block"
          style={{ padding: '48px', minWidth: '850px', maxWidth: '1000px', width: 'fit-content' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl font-black text-white mb-2">TRANSFER SUGGESTION</div>
            <div className="text-2xl text-indigo-100 font-medium">Gameweek {gameweek}</div>
          </div>

          {/* Transfer Display */}
          <div className="flex items-center gap-6 mb-8">
            {/* Player Out */}
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-red-400">
              <div className="text-center">
                {imageOut ? (
                  <div
                    className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden border-4 border-red-400 shadow-lg"
                    style={{
                      transform: `translate(${positionOut.x}%, ${positionOut.y}%) scale(${positionOut.scale}%)`,
                    }}
                  >
                    <img src={imageOut} alt={selectedPlayerOut?.web_name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-28 h-28 mx-auto mb-4 rounded-full bg-red-400/30 border-4 border-red-400 flex items-center justify-center">
                    <span className="text-5xl">👤</span>
                  </div>
                )}
                <div className="text-white/70 text-sm font-bold mb-1">OUT</div>
                <div className="text-3xl font-black text-white mb-2">{selectedPlayerOut?.web_name}</div>
                <div className="text-xl font-bold text-red-300">£{selectedPlayerOut?.now_cost / 10}m</div>
              </div>
            </div>

            {/* Arrow */}
            <div className="bg-white rounded-full p-4 shadow-xl">
              <ArrowRight className="w-10 h-10 text-purple-600" strokeWidth={3} />
            </div>

            {/* Player In */}
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-green-400">
              <div className="text-center">
                {imageIn ? (
                  <div
                    className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden border-4 border-green-400 shadow-lg"
                    style={{
                      transform: `translate(${positionIn.x}%, ${positionIn.y}%) scale(${positionIn.scale}%)`,
                    }}
                  >
                    <img src={imageIn} alt={selectedPlayerIn?.web_name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-28 h-28 mx-auto mb-4 rounded-full bg-green-400/30 border-4 border-green-400 flex items-center justify-center">
                    <span className="text-5xl">👤</span>
                  </div>
                )}
                <div className="text-white/70 text-sm font-bold mb-1">IN</div>
                <div className="text-3xl font-black text-white mb-2">{selectedPlayerIn?.web_name}</div>
                <div className="text-xl font-bold text-green-300">£{selectedPlayerIn?.now_cost / 10}m</div>
              </div>
            </div>
          </div>

          {/* Reasons */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-2xl font-black text-purple-600 mb-4">{reasonTitle}</h3>
            <div className="space-y-2">
              {reasons.map((reason, idx) => (
                <div key={idx} className="text-gray-800 text-lg font-medium">
                  {reason}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-white/70 text-sm font-medium mt-6">
            @FPL_Dave_ • FPL Analytics
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={exportAsImage}
          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-lg py-6"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Transfer Card
        </Button>
      </div>
    </div>
  );
}