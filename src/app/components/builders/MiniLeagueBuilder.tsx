import React, { useState, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Download, Upload, Trophy, Medal, Award, X, Loader2, Search } from 'lucide-react';
import { toPng } from 'html-to-image';
import { corsProxyFetch } from '../../utils/corsProxy';

interface LeagueStanding {
  rank: string;
  name: string;
  points: string;
  gw: string;
  image: string | null;
}

export function MiniLeagueBuilder() {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const managerImageRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [leagueName, setLeagueName] = useState('FPL Champions League');
  const [gameweek, setGameweek] = useState('28');
  const [leagueLogo, setLeagueLogo] = useState<string | null>(null);
  const [fplId, setFplId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableLeagues, setAvailableLeagues] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null);
  const [standings, setStandings] = useState<LeagueStanding[]>([
    { rank: '1', name: 'Dave_FPL', points: '1,856', gw: '67', image: null },
    { rank: '2', name: 'ManagerJohn', points: '1,842', gw: '72', image: null },
    { rank: '3', name: 'FPL_Expert', points: '1,831', gw: '65', image: null },
    { rank: '4', name: 'GoalsGalore', points: '1,820', gw: '58', image: null },
    { rank: '5', name: 'TacticalFC', points: '1,815', gw: '61', image: null },
  ]);

  const loadFPLLeagues = async () => {
    if (!fplId.trim()) return;
    
    setIsLoading(true);
    try {
      const data = await corsProxyFetch(`https://fantasy.premierleague.com/api/entry/${fplId}/`);
      
      // Fetch leagues
      const classicLeagues = data.leagues?.classic || [];
      setAvailableLeagues(
        classicLeagues.map((league: any) => ({
          id: league.id,
          name: league.name
        }))
      );
    } catch (error) {
      console.error('Error loading FPL leagues:', error);
      alert('Failed to load FPL leagues. Please check the ID and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeagueStandings = async (leagueId: number) => {
    setIsLoading(true);
    try {
      // Fetch league standings
      const data = await corsProxyFetch(
        `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`
      );
      
      if (data.standings?.results) {
        const results = data.standings.results.slice(0, 15); // First 10-15 players
        setLeagueName(data.league?.name || 'Mini League');
        
        const newStandings = results.map((entry: any) => ({
          rank: entry.rank.toString(),
          name: entry.entry_name || entry.player_name,
          points: entry.total.toLocaleString(),
          gw: entry.event_total?.toString() || '0',
          image: null
        }));
        
        setStandings(newStandings);
      }
    } catch (error) {
      console.error('Error loading league standings:', error);
      alert('Failed to load league standings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLeagueLogo(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManagerImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newStandings = [...standings];
        newStandings[index].image = event.target?.result as string;
        setStandings(newStandings);
      };
      reader.readAsDataURL(file);
    }
  };

  const exportAsImage = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { 
        quality: 1.0, 
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true
      });
      const link = document.createElement('a');
      link.download = `${leagueName}_GW${gameweek}_Standings.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case '1':
        return <Trophy className="w-8 h-8 text-yellow-400" />;
      case '2':
        return <Medal className="w-8 h-8 text-gray-300" />;
      case '3':
        return <Award className="w-8 h-8 text-orange-400" />;
      default:
        return <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-bold">{rank}</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* FPL ID Input */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          Load Your FPL Leagues
        </h3>
        <div className="flex gap-3 mb-4">
          <Input
            placeholder="Enter your FPL Team ID"
            value={fplId}
            onChange={(e) => setFplId(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={loadFPLLeagues}
            disabled={isLoading || !fplId.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Load Leagues
              </>
            )}
          </Button>
        </div>

        {availableLeagues.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Select a League</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => {
                const leagueId = parseInt(e.target.value);
                setSelectedLeagueId(leagueId);
                loadLeagueStandings(leagueId);
              }}
              value={selectedLeagueId || ''}
            >
              <option value="">Choose a league...</option>
              {availableLeagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Mini-League Settings</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Gameweek</label>
            <Input value={gameweek} onChange={(e) => setGameweek(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">League Logo</label>
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
              Upload Logo
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview Card */}
      <div className="flex justify-center">
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 rounded-2xl shadow-2xl inline-block"
          style={{ padding: '48px', maxWidth: '1000px', width: 'fit-content' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            {leagueLogo && (
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                <img src={leagueLogo} alt="League logo" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="text-5xl font-black text-white mb-2">{leagueName}</div>
            <div className="text-2xl text-yellow-100 font-medium">GW {gameweek} Standings</div>
          </div>

          {/* Standings Table */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl" style={{ minWidth: '850px' }}>
            {/* Table Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 grid grid-cols-12 gap-4 text-white font-bold">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-6">Manager</div>
              <div className="col-span-3 text-right">Total Points</div>
              <div className="col-span-2 text-right">GW</div>
            </div>

            {/* Standings Rows */}
            <div className="divide-y divide-gray-200">
              {standings.map((standing, idx) => {
                const isTop3 = parseInt(standing.rank) <= 3;
                return (
                  <div
                    key={idx}
                    className={`px-6 py-4 grid grid-cols-12 gap-4 items-center ${
                      isTop3 ? 'bg-yellow-50' : 'bg-white'
                    } hover:bg-gray-50 transition-colors`}
                  >
                    <div className="col-span-1 flex justify-center">
                      {getRankIcon(standing.rank)}
                    </div>
                    <div className="col-span-6 flex items-center gap-3">
                      {standing.image && (
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-400 shadow-lg">
                          <img src={standing.image} alt={standing.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="font-bold text-gray-900 text-lg">{standing.name}</div>
                    </div>
                    <div className="col-span-3 text-right">
                      <div className="text-2xl font-black text-purple-600">{standing.points}</div>
                    </div>
                    <div className="col-span-2 text-right">
                      <div className="text-lg font-bold text-green-600">{standing.gw}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-white/90 text-sm font-bold mt-6 bg-white/20 backdrop-blur-sm rounded-full py-2 px-4 inline-block mx-auto w-full">
            @FPL_Dave_ • FPL Analytics
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={exportAsImage}
          className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-lg py-6"
        >
          <Download className="w-5 h-5 mr-2" />
          Download League Standings
        </Button>
      </div>
    </div>
  );
}