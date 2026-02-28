import React, { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, Legend } from 'recharts';
import type { Player } from '../types/fpl';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface FormVsFixtureScatterProps {
  players: Player[];
  getAverageFDR: (playerId: number) => number;
  className?: string;
}

// Position colors for "all" mode
const POSITION_COLORS: Record<number, { fill: string; stroke: string; label: string }> = {
  1: { fill: '#eab308', stroke: '#ca8a04', label: 'GKP' },
  2: { fill: '#22c55e', stroke: '#16a34a', label: 'DEF' },
  3: { fill: '#3b82f6', stroke: '#2563eb', label: 'MID' },
  4: { fill: '#ef4444', stroke: '#dc2626', label: 'FWD' },
};

// 10 distinct colors for individual player mode
const PLAYER_PALETTE = [
  { fill: '#8b5cf6', stroke: '#7c3aed' },
  { fill: '#ec4899', stroke: '#db2777' },
  { fill: '#f59e0b', stroke: '#d97706' },
  { fill: '#10b981', stroke: '#059669' },
  { fill: '#3b82f6', stroke: '#2563eb' },
  { fill: '#ef4444', stroke: '#dc2626' },
  { fill: '#06b6d4', stroke: '#0891b2' },
  { fill: '#84cc16', stroke: '#65a30d' },
  { fill: '#f97316', stroke: '#ea580c' },
  { fill: '#6366f1', stroke: '#4f46e5' },
];

interface ScatterPoint {
  x: number;
  y: number;
  name: string;
  price: string;
  ownership: string;
  playerId: number;
  position: number;
  color: string;
  strokeColor: string;
}

export function FormVsFixtureScatter({ players, getAverageFDR, className = '' }: FormVsFixtureScatterProps) {
  const [positionFilter, setPositionFilter] = useState('all');

  const isTopTenMode = positionFilter !== 'all';

  // Filter players by position
  const filteredPlayers = useMemo(() => {
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
      filtered = filtered.slice(0, 100);
    }

    return filtered;
  }, [players, positionFilter]);

  // Build scatter data with assigned colors
  const scatterData: ScatterPoint[] = useMemo(() => {
    return filteredPlayers
      .map((player, index) => {
        const posColor = POSITION_COLORS[player.element_type] || POSITION_COLORS[3];
        const playerColor = PLAYER_PALETTE[index % PLAYER_PALETTE.length];

        return {
          x: getAverageFDR(player.id),
          y: parseFloat(player.form),
          name: player.web_name,
          price: (player.now_cost / 10).toFixed(1),
          ownership: player.selected_by_percent,
          playerId: player.id,
          position: player.element_type,
          color: isTopTenMode ? playerColor.fill : posColor.fill,
          strokeColor: isTopTenMode ? playerColor.stroke : posColor.stroke,
        };
      })
      .filter(d => d.x > 0);
  }, [filteredPlayers, getAverageFDR, isTopTenMode]);

  // Group data by position for "all" mode (separate Scatter per position)
  const positionGroups = useMemo(() => {
    if (isTopTenMode) return null;
    const groups: Record<number, ScatterPoint[]> = { 1: [], 2: [], 3: [], 4: [] };
    scatterData.forEach(d => {
      if (groups[d.position]) groups[d.position].push(d);
    });
    return groups;
  }, [scatterData, isTopTenMode]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterPoint }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const positionNames: Record<number, string> = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
      return (
        <div className="bg-white/95 backdrop-blur-sm border-2 border-purple-200 rounded-xl p-3 sm:p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="font-bold text-gray-900 text-sm sm:text-lg">{data.name}</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-600 space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Position:</span>
              <span className="font-semibold text-gray-700">{positionNames[data.position]}</span>
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

  // Custom dot shape that reads color from data point
  const CustomDot = (props: { cx?: number; cy?: number; payload?: ScatterPoint }) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload) return null;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={payload.color}
        stroke={payload.strokeColor}
        strokeWidth={2}
        fillOpacity={0.8}
      />
    );
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

          {/* "All" mode: one Scatter per position for automatic Recharts Legend */}
          {positionGroups && Object.entries(positionGroups).map(([posKey, points]) => {
            const pos = Number(posKey);
            const posConfig = POSITION_COLORS[pos];
            if (points.length === 0) return null;
            return (
              <Scatter
                key={pos}
                name={posConfig.label}
                data={points}
                fill={posConfig.fill}
                stroke={posConfig.stroke}
                strokeWidth={2}
                fillOpacity={0.8}
              />
            );
          })}

          {/* "Top 10" mode: single Scatter with custom colored dots */}
          {isTopTenMode && (
            <Scatter
              name="Players"
              data={scatterData}
              shape={<CustomDot />}
              legendType="none"
            />
          )}

          {/* Show position legend for "all" mode */}
          {!isTopTenMode && (
            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
              iconType="circle"
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>

      {/* Player color legend for top 10 mode */}
      {isTopTenMode && scatterData.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Players</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {scatterData.map((d) => (
              <div key={d.playerId} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: d.color, border: `2px solid ${d.strokeColor}` }}
                />
                <span className="text-xs sm:text-sm font-medium text-gray-700">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quadrant guide */}
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