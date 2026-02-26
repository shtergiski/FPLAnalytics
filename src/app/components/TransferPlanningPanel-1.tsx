import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Minus, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Player } from '../../types/fpl';

interface TransferPlanProps {
  players: Player[];
  currentSquad: number[];
  budget: number;
  freeTransfers: number;
}

interface PlannedTransfer {
  gameweek: number;
  playerOut: Player | null;
  playerIn: Player | null;
  cost: number;
}

export function TransferPlanningPanel({ players, currentSquad, budget, freeTransfers }: TransferPlanProps) {
  const [transfers, setTransfers] = useState<PlannedTransfer[]>([
    { gameweek: 29, playerOut: null, playerIn: null, cost: 0 },
    { gameweek: 30, playerOut: null, playerIn: null, cost: 0 },
    { gameweek: 31, playerOut: null, playerIn: null, cost: 0 },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGW, setSelectedGW] = useState(29);
  const [selectingFor, setSelectingFor] = useState<'out' | 'in' | null>(null);

  // FPL Rules Constants
  const TRANSFER_HIT_COST = 4;
  const MAX_PLAYERS_PER_TEAM = 3;
  const SQUAD_SIZE = 15;
  const MIN_GK = 2;
  const MIN_DEF = 5;
  const MIN_MID = 5;
  const MIN_FWD = 3;

  // Calculate current budget after all planned transfers
  const calculateRemainingBudget = (): number => {
    let remaining = budget;
    transfers.forEach(t => {
      if (t.playerOut && t.playerIn) {
        remaining += (t.playerOut.now_cost / 10);
        remaining -= (t.playerIn.now_cost / 10);
      }
    });
    return remaining;
  };

  // Calculate transfer hits
  const calculateHits = (gwIndex: number): number => {
    let hits = 0;
    let freeTransfersRemaining = freeTransfers;

    for (let i = 0; i <= gwIndex; i++) {
      const transfer = transfers[i];
      if (transfer.playerOut && transfer.playerIn) {
        if (freeTransfersRemaining > 0) {
          freeTransfersRemaining--;
        } else {
          hits += TRANSFER_HIT_COST;
        }
      }
      // Accumulate free transfers (max 2)
      if (i < gwIndex) {
        freeTransfersRemaining = Math.min(2, freeTransfersRemaining + 1);
      }
    }

    return hits;
  };

  // Validate squad composition
  const validateSquad = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const squadAfterTransfers = [...currentSquad];

    // Apply all transfers
    transfers.forEach(t => {
      if (t.playerOut && t.playerIn) {
        const outIndex = squadAfterTransfers.indexOf(t.playerOut.id);
        if (outIndex !== -1) {
          squadAfterTransfers[outIndex] = t.playerIn.id;
        }
      }
    });

    // Check position requirements
    const squadPlayers = squadAfterTransfers.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];
    const positionCounts = {
      GKP: squadPlayers.filter(p => p.element_type === 1).length,
      DEF: squadPlayers.filter(p => p.element_type === 2).length,
      MID: squadPlayers.filter(p => p.element_type === 3).length,
      FWD: squadPlayers.filter(p => p.element_type === 4).length,
    };

    if (positionCounts.GKP < MIN_GK) errors.push(`Need at least ${MIN_GK} goalkeepers`);
    if (positionCounts.DEF < MIN_DEF) errors.push(`Need at least ${MIN_DEF} defenders`);
    if (positionCounts.MID < MIN_MID) errors.push(`Need at least ${MIN_MID} midfielders`);
    if (positionCounts.FWD < MIN_FWD) errors.push(`Need at least ${MIN_FWD} forwards`);

    // Check max players per team
    const teamCounts: { [key: number]: number } = {};
    squadPlayers.forEach(p => {
      teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
    });

    Object.entries(teamCounts).forEach(([teamId, count]) => {
      if (count > MAX_PLAYERS_PER_TEAM) {
        const teamName = players.find(p => p.team === Number(teamId))?.team_name || 'Unknown';
        errors.push(`Max ${MAX_PLAYERS_PER_TEAM} players from ${teamName} (currently ${count})`);
      }
    });

    // Check budget
    if (calculateRemainingBudget() < 0) {
      errors.push('Budget exceeded');
    }

    return { valid: errors.length === 0, errors };
  };

  const handleSelectPlayer = (gwIndex: number, type: 'out' | 'in') => {
    setSelectedGW(transfers[gwIndex].gameweek);
    setSelectingFor(type);
  };

  const handlePlayerClick = (player: Player) => {
    if (!selectingFor) return;

    const gwIndex = transfers.findIndex(t => t.gameweek === selectedGW);
    if (gwIndex === -1) return;

    const newTransfers = [...transfers];
    
    if (selectingFor === 'out') {
      newTransfers[gwIndex].playerOut = player;
    } else {
      newTransfers[gwIndex].playerIn = player;
    }

    // Calculate cost if both players selected
    if (newTransfers[gwIndex].playerOut && newTransfers[gwIndex].playerIn) {
      const priceDiff = (newTransfers[gwIndex].playerIn!.now_cost - newTransfers[gwIndex].playerOut!.now_cost) / 10;
      newTransfers[gwIndex].cost = priceDiff;
    }

    setTransfers(newTransfers);
    setSelectingFor(null);
    setSearchQuery('');
  };

  const removeTransfer = (gwIndex: number) => {
    const newTransfers = [...transfers];
    newTransfers[gwIndex] = { gameweek: newTransfers[gwIndex].gameweek, playerOut: null, playerIn: null, cost: 0 };
    setTransfers(newTransfers);
  };

  const filteredPlayers = players
    .filter(p => p.web_name.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 20);

  const validation = validateSquad();
  const totalHits = calculateHits(transfers.length - 1);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Transfer Planning Summary</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="text-sm text-gray-600">Remaining Budget</div>
            <div className="text-2xl font-bold text-gray-900">£{calculateRemainingBudget().toFixed(1)}m</div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="text-sm text-gray-600">Free Transfers</div>
            <div className="text-2xl font-bold text-green-600">{freeTransfers}</div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Hits</div>
            <div className="text-2xl font-bold text-red-600">-{totalHits} pts</div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="text-sm text-gray-600">Status</div>
            <div className="flex items-center gap-2">
              {validation.valid ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-bold text-green-600">Valid</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="font-bold text-red-600">Invalid</span>
                </>
              )}
            </div>
          </div>
        </div>

        {!validation.valid && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="font-bold text-red-900 mb-2">⚠️ Validation Errors:</div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {validation.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Transfer Plans */}
      <div className="space-y-4">
        {transfers.map((transfer, idx) => (
          <Card key={idx} className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">
                Gameweek {transfer.gameweek}
              </h4>
              <div className="flex items-center gap-2">
                {calculateHits(idx) > 0 && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                    -{calculateHits(idx)} pts
                  </span>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Player OUT */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  Transfer OUT
                </label>
                {transfer.playerOut ? (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <div className="font-bold text-gray-900">{transfer.playerOut.web_name}</div>
                    <div className="text-sm text-gray-600">
                      {transfer.playerOut.team_name} • £{(transfer.playerOut.now_cost / 10).toFixed(1)}m
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newTransfers = [...transfers];
                        newTransfers[idx].playerOut = null;
                        newTransfers[idx].cost = 0;
                        setTransfers(newTransfers);
                      }}
                      className="mt-2"
                    >
                      <Minus className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleSelectPlayer(idx, 'out')}
                    className="w-full h-24 border-2 border-dashed"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Select Player
                  </Button>
                )}
              </div>

              {/* Player IN */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Transfer IN
                </label>
                {transfer.playerIn ? (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="font-bold text-gray-900">{transfer.playerIn.web_name}</div>
                    <div className="text-sm text-gray-600">
                      {transfer.playerIn.team_name} • £{(transfer.playerIn.now_cost / 10).toFixed(1)}m
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newTransfers = [...transfers];
                        newTransfers[idx].playerIn = null;
                        newTransfers[idx].cost = 0;
                        setTransfers(newTransfers);
                      }}
                      className="mt-2"
                    >
                      <Minus className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleSelectPlayer(idx, 'in')}
                    className="w-full h-24 border-2 border-dashed"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Select Player
                  </Button>
                )}
              </div>
            </div>

            {transfer.playerOut && transfer.playerIn && (
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <div className="text-sm text-gray-600">Cost Impact:</div>
                <div className={`text-lg font-bold ${transfer.cost > 0 ? 'text-red-600' : transfer.cost < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {transfer.cost > 0 ? '+' : ''}{transfer.cost.toFixed(1)}m
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Player Search Modal */}
      {selectingFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="bg-white p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2">
                Select Player to {selectingFor === 'out' ? 'Transfer OUT' : 'Transfer IN'}
              </h3>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search player name..."
                className="mb-4"
              />
            </div>

            <div className="space-y-2">
              {filteredPlayers.map(player => (
                <div
                  key={player.id}
                  onClick={() => handlePlayerClick(player)}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="font-bold">{player.web_name}</div>
                  <div className="text-sm text-gray-600">
                    {player.team_name} • {['', 'GKP', 'DEF', 'MID', 'FWD'][player.element_type]} • 
                    £{(player.now_cost / 10).toFixed(1)}m • {player.total_points} pts
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setSelectingFor(null)}
              variant="outline"
              className="w-full mt-4"
            >
              Cancel
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
