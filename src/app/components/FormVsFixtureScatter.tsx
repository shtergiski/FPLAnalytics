import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';
import type { Player } from '../types/fpl';
import { Card } from './ui/card';

interface FormVsFixtureScatterProps {
  players: Player[];
  getAverageFDR: (playerId: number) => number;
  className?: string;
}

export function FormVsFixtureScatter({ players, getAverageFDR, className = '' }: FormVsFixtureScatterProps) {
  // Prepare data for scatter plot
  const scatterData = players
    .filter(p => parseFloat(p.form) > 0)
    .map(player => ({
      x: getAverageFDR(player.id), // Average fixture difficulty
      y: parseFloat(player.form), // Current form
      name: player.web_name,
      price: (player.now_cost / 10).toFixed(1),
      ownership: player.selected_by_percent,
      playerId: player.id
    }))
    .filter(d => d.x > 0) // Only include players with fixtures
    .slice(0, 100); // Limit to top 100 for performance

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border-2 border-purple-200 rounded-xl p-4 shadow-xl">
          <div className="font-bold text-gray-900 text-lg">{data.name}</div>
          <div className="text-sm text-gray-600 space-y-1 mt-2">
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
    <Card className={`p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Form vs. Fixture Difficulty
        </h3>
        <p className="text-sm text-gray-600">
          Players in the top-left (high form, easy fixtures) are the best targets
        </p>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Fixture Difficulty"
            domain={[1, 5]}
            stroke="#6b7280"
            tick={{ fill: '#374151', fontSize: 12 }}
          >
            <Label 
              value="Average Fixture Difficulty (Lower = Easier)" 
              offset={-20} 
              position="insideBottom"
              style={{ fill: '#374151', fontWeight: 600 }}
            />
          </XAxis>
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Form"
            domain={[0, 'auto']}
            stroke="#6b7280"
            tick={{ fill: '#374151', fontSize: 12 }}
          >
            <Label 
              value="Current Form (Higher = Better)" 
              angle={-90} 
              position="insideLeft"
              style={{ fill: '#374151', fontWeight: 600, textAnchor: 'middle' }}
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
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-3 bg-green-50 rounded-lg border-2 border-green-200">
          <div className="text-2xl mb-1">🎯</div>
          <div className="text-xs font-semibold text-gray-700">Top Left</div>
          <div className="text-xs text-gray-600">High Form + Easy Fixtures</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
          <div className="text-2xl mb-1">⚡</div>
          <div className="text-xs font-semibold text-gray-700">Top Right</div>
          <div className="text-xs text-gray-600">High Form + Hard Fixtures</div>
        </div>
        <div className="p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
          <div className="text-2xl mb-1">📈</div>
          <div className="text-xs font-semibold text-gray-700">Bottom Left</div>
          <div className="text-xs text-gray-600">Low Form + Easy Fixtures</div>
        </div>
        <div className="p-3 bg-red-50 rounded-lg border-2 border-red-200">
          <div className="text-2xl mb-1">❌</div>
          <div className="text-xs font-semibold text-gray-700">Bottom Right</div>
          <div className="text-xs text-gray-600">Low Form + Hard Fixtures</div>
        </div>
      </div>
    </Card>
  );
}
