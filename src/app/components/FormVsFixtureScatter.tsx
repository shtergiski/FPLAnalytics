import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';
import type { Player } from '../types/fpl';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface FormVsFixtureScatterProps {
  players: Player[];
  getAverageFDR: (playerId: number) => number;
  className?: string;
}

export function FormVsFixtureScatter({ players, getAverageFDR, className = '' }: FormVsFixtureScatterProps) {
  const [positionFilter, setPositionFilter] = useState('all');
  
  // Filter players by position
  const getFilteredPlayers = () => {
    let filtered = players.filter(p => parseFloat(p.form) > 0);
    
    if (positionFilter === 'def') {
      filtered = filtered.filter(p => p.element_type === 2)
        .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
        .slice(0, 10);
    } else if (positionFilter === 'mid') {
      filtered = filtered.filter(p => p.element_type === 3)
        .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
        .slice(0, 10);
    } else if (positionFilter === 'fwd') {
      filtered = filtered.filter(p => p.element_type === 4)
        .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
        .slice(0, 10);
    } else {
      filtered = filtered.slice(0, 100); // Show top 100 for 'all'
    }
    
    return filtered;
  };
  
  // Prepare data for scatter plot
  const scatterData = getFilteredPlayers()
    .map(player => ({
      x: getAverageFDR(player.id), // Average fixture difficulty
      y: parseFloat(player.form), // Current form
      name: player.web_name,
      price: (player.now_cost / 10).toFixed(1),
      ownership: player.selected_by_percent,
      playerId: player.id,
      position: player.element_type
    }))
    .filter(d => d.x > 0); // Only include players with fixtures

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const positionNames = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
      return (
        <div className="bg-white/95 backdrop-blur-sm border-2 border-purple-200 rounded-xl p-3 sm:p-4 shadow-xl">
          <div className="font-bold text-gray-900 text-sm sm:text-lg">{data.name}</div>
          <div className="text-xs sm:text-sm text-gray-600 space-y-1 mt-2">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Position:</span>
              <span className="font-semibold text-gray-700">{positionNames[data.position as keyof typeof positionNames]}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Form:</span>
              <span className="font-semibold text-purple-600">{data.y}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Avg FDR:</span>
              <span className="font-semibold text-blue-600">{data.x.toFixed(1)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Price:</span>
              <span className="font-semibold text-green-600">£{data.price}m</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Ownership:</span>
              <span className="font-semibold text-orange-600">{data.ownership}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`p-4 sm:p-6 ${className}`}>
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900">
            Form vs. Fixture Difficulty
          </h3>
          <Select onValueChange={setPositionFilter} value={positionFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Positions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All (Top 100)</SelectItem>
              <SelectItem value="def">Top 10 DEF</SelectItem>
              <SelectItem value="mid">Top 10 MID</SelectItem>
              <SelectItem value="fwd">Top 10 FWD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs sm:text-sm text-gray-600">
          Players in the top-left (high form, easy fixtures) are the best targets
        </p>
      </div>

      <ResponsiveContainer width="100%" height={350} className="sm:!h-[500px]">
        <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 30 }} className="sm:!m-[20px_20px_40px_40px]">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Fixture Difficulty"
            domain={[1, 5]}
            stroke="#6b7280"
            tick={{ fill: '#374151', fontSize: 10 }}
            className="sm:!text-xs"
          >
            <Label 
              value="Avg FDR (Lower = Easier)" 
              offset={-15} 
              position="insideBottom"
              style={{ fill: '#374151', fontWeight: 600, fontSize: '11px' }}
              className="sm:!text-sm"
            />
          </XAxis>
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Form"
            domain={[0, 'auto']}
            stroke="#6b7280"
            tick={{ fill: '#374151', fontSize: 10 }}
            className="sm:!text-xs"
          >
            <Label 
              value="Form" 
              angle={-90} 
              position="insideLeft"
              style={{ fill: '#374151', fontWeight: 600, textAnchor: 'middle', fontSize: '11px' }}
              className="sm:!text-sm"
            />
          </YAxis>
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter 
            data={scatterData} 
            fill="#8b5cf6"
            fillOpacity={0.7}
            stroke="#7c3aed"
            strokeWidth={2}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 sm:mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 text-center">
        <div className="p-2 sm:p-3 bg-green-50 rounded-lg border-2 border-green-200">
          <div className="text-xl sm:text-2xl mb-1">🎯</div>
          <div className="text-xs font-semibold text-gray-700">Top Left</div>
          <div className="text-xs text-gray-600 hidden sm:block">High Form + Easy Fixtures</div>
        </div>
        <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
          <div className="text-xl sm:text-2xl mb-1">⚡</div>
          <div className="text-xs font-semibold text-gray-700">Top Right</div>
          <div className="text-xs text-gray-600 hidden sm:block">High Form + Hard Fixtures</div>
        </div>
        <div className="p-2 sm:p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
          <div className="text-xl sm:text-2xl mb-1">📈</div>
          <div className="text-xs font-semibold text-gray-700">Bottom Left</div>
          <div className="text-xs text-gray-600 hidden sm:block">Low Form + Easy Fixtures</div>
        </div>
        <div className="p-2 sm:p-3 bg-red-50 rounded-lg border-2 border-red-200">
          <div className="text-xl sm:text-2xl mb-1">❌</div>
          <div className="text-xs font-semibold text-gray-700">Bottom Right</div>
          <div className="text-xs text-gray-600 hidden sm:block">Low Form + Hard Fixtures</div>
        </div>
      </div>
    </Card>
  );
}