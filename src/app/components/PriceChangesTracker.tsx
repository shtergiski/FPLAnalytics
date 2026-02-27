import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ArrowUpDown,
  Filter,
  DollarSign,
  Percent,
  Activity
} from 'lucide-react';
import { Player } from '../types/fpl';

interface PriceChangesTrackerProps {
  players: Player[];
}

export function PriceChangesTracker({ players }: PriceChangesTrackerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'change' | 'price' | 'ownership'>('change');
  const [filterPosition, setFilterPosition] = useState<number>(0);

  // Calculate price changes
  const priceData = useMemo(() => {
    return players.map(player => ({
      ...player,
      changeValue: player.cost_change_start / 10,
      changePercent: ((player.cost_change_start / 10) / (player.now_cost / 10 - player.cost_change_start / 10)) * 100,
      transfersNet: player.transfers_in_event - player.transfers_out_event,
    }));
  }, [players]);

  // Filter and sort
  const filteredData = useMemo(() => {
    let filtered = priceData;

    // Search
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.web_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.team_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Position filter
    if (filterPosition > 0) {
      filtered = filtered.filter(p => p.element_type === filterPosition);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'change':
          return Math.abs(b.changeValue) - Math.abs(a.changeValue);
        case 'price':
          return b.now_cost - a.now_cost;
        case 'ownership':
          return parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent);
        default:
          return 0;
      }
    });

    return filtered;
  }, [priceData, searchQuery, sortBy, filterPosition]);

  const risers = filteredData.filter(p => p.changeValue > 0).slice(0, 20);
  const fallers = filteredData.filter(p => p.changeValue < 0).slice(0, 20);
  const mostTransferredIn = [...priceData]
    .sort((a, b) => b.transfers_in_event - a.transfers_in_event)
    .slice(0, 20);
  const mostTransferredOut = [...priceData]
    .sort((a, b) => b.transfers_out_event - a.transfers_out_event)
    .slice(0, 20);

  const positionColors = {
    1: 'bg-yellow-100 text-yellow-800',
    2: 'bg-green-100 text-green-800',
    3: 'bg-blue-100 text-blue-800',
    4: 'bg-red-100 text-red-800',
  };

  const positionNames = ['All', 'GK', 'DEF', 'MID', 'FWD'];

  const PriceChangeRow = ({ player, showTransfers = false }: { player: typeof priceData[0]; showTransfers?: boolean | string }) => (
    <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-white text-xs sm:text-base ${ 
          player.element_type === 1 ? 'bg-yellow-500' :
          player.element_type === 2 ? 'bg-green-500' :
          player.element_type === 3 ? 'bg-blue-500' : 'bg-red-500'
        }`}>
          {player.web_name.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">{player.web_name}</div>
          <div className="text-xs sm:text-sm text-gray-600 truncate">{player.team_name}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0">
        {showTransfers ? (
          <div className="text-center min-w-[60px] sm:min-w-[80px]">
            <div className="text-[10px] sm:text-sm text-gray-600 mb-1 hidden sm:block">Transfers</div>
            <div className="font-bold text-sm sm:text-lg text-purple-600">
              {showTransfers === 'in' 
                ? (player.transfers_in_event?.toLocaleString() || '0')
                : (player.transfers_out_event?.toLocaleString() || '0')}
            </div>
          </div>
        ) : (
          <div className="text-center min-w-[70px] sm:min-w-[100px]">
            <div className="text-[10px] sm:text-sm text-gray-600 mb-1 hidden sm:block">Change</div>
            <div className={`font-bold text-sm sm:text-lg flex items-center justify-center gap-0.5 sm:gap-1 ${
              player.changeValue > 0 ? 'text-green-600' : 
              player.changeValue < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {player.changeValue > 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : 
               player.changeValue < 0 ? <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" /> : null}
              {player.changeValue > 0 ? '+' : ''}{player.changeValue.toFixed(1)}m
            </div>
          </div>
        )}

        <div className="text-center min-w-[50px] sm:min-w-[80px]">
          <div className="text-[10px] sm:text-sm text-gray-600 mb-1 hidden sm:block">Price</div>
          <div className="font-bold text-sm sm:text-lg text-gray-900">
            £{(player.now_cost / 10).toFixed(1)}m
          </div>
        </div>

        <div className="text-center min-w-[50px] sm:min-w-[80px] hidden md:block">
          <div className="text-[10px] sm:text-sm text-gray-600 mb-1">Owned</div>
          <div className="font-bold text-sm sm:text-lg text-gray-900">
            {player.selected_by_percent}%
          </div>
        </div>

        <div className="text-center min-w-[50px] sm:min-w-[70px] hidden lg:block">
          <div className="text-[10px] sm:text-sm text-gray-600 mb-1">Form</div>
          <div className="font-bold text-sm sm:text-lg text-cyan-600">
            {player.form}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Total Risers</div>
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <div className="text-3xl font-bold">
            {priceData.filter(p => p.changeValue > 0).length}
          </div>
          <div className="text-xs opacity-80 mt-1">
            Avg: +£{(priceData.filter(p => p.changeValue > 0).reduce((sum, p) => sum + p.changeValue, 0) / Math.max(1, priceData.filter(p => p.changeValue > 0).length)).toFixed(2)}m
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Total Fallers</div>
            <TrendingDown className="w-5 h-5 opacity-80" />
          </div>
          <div className="text-3xl font-bold">
            {priceData.filter(p => p.changeValue < 0).length}
          </div>
          <div className="text-xs opacity-80 mt-1">
            Avg: -£{Math.abs(priceData.filter(p => p.changeValue < 0).reduce((sum, p) => sum + p.changeValue, 0) / Math.max(1, priceData.filter(p => p.changeValue < 0).length)).toFixed(2)}m
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Most Active</div>
            <Activity className="w-5 h-5 opacity-80" />
          </div>
          <div className="text-2xl font-bold truncate">
            {mostTransferredIn[0]?.web_name || 'N/A'}
          </div>
          <div className="text-xs opacity-80 mt-1">
            {mostTransferredIn[0]?.transfers_in_event?.toLocaleString() || 0} transfers in
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Biggest Rise</div>
            <DollarSign className="w-5 h-5 opacity-80" />
          </div>
          <div className="text-2xl font-bold truncate">
            {risers[0]?.web_name || 'N/A'}
          </div>
          <div className="text-xs opacity-80 mt-1">
            +£{(risers[0]?.changeValue || 0).toFixed(1)}m
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {positionNames.map((pos, index) => (
              <Button
                key={pos}
                variant={filterPosition === index ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterPosition(index)}
              >
                {pos}
              </Button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="change">Sort by Change</option>
            <option value="price">Sort by Price</option>
            <option value="ownership">Sort by Ownership</option>
          </select>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="risers" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="risers" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Price Rises</span>
            <span className="sm:hidden">Rises</span>
          </TabsTrigger>
          <TabsTrigger value="fallers" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
            <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Price Falls</span>
            <span className="sm:hidden">Falls</span>
          </TabsTrigger>
          <TabsTrigger value="transfers-in" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
            <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Transfers In</span>
            <span className="sm:hidden">In</span>
          </TabsTrigger>
          <TabsTrigger value="transfers-out" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
            <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Transfers Out</span>
            <span className="sm:hidden">Out</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="risers">
          <Card>
            <div className="border-b p-4 bg-green-50">
              <h3 className="font-bold text-lg text-green-900">
                Top Price Risers ({risers.length})
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Players who have increased in price since the season started
              </p>
            </div>
            <div className="divide-y">
              {risers.length > 0 ? (
                risers.map(player => <PriceChangeRow key={player.id} player={player} />)
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No price risers found
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="fallers">
          <Card>
            <div className="border-b p-4 bg-red-50">
              <h3 className="font-bold text-lg text-red-900">
                Top Price Fallers ({fallers.length})
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Players who have decreased in price since the season started
              </p>
            </div>
            <div className="divide-y">
              {fallers.length > 0 ? (
                fallers.map(player => <PriceChangeRow key={player.id} player={player} />)
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No price fallers found
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="transfers-in">
          <Card>
            <div className="border-b p-4 bg-blue-50">
              <h3 className="font-bold text-lg text-blue-900">
                Most Transferred In
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Players with the highest transfers in this gameweek
              </p>
            </div>
            <div className="divide-y">
              {mostTransferredIn.map(player => (
                <PriceChangeRow key={player.id} player={player} showTransfers={'in'} />
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="transfers-out">
          <Card>
            <div className="border-b p-4 bg-orange-50">
              <h3 className="font-bold text-lg text-orange-900">
                Most Transferred Out
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                Players with the highest transfers out this gameweek
              </p>
            </div>
            <div className="divide-y">
              {mostTransferredOut.map(player => (
                <PriceChangeRow key={player.id} player={player} showTransfers={'out'} />
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}