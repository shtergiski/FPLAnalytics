import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Player } from '../types/fpl';

interface PlayerRadarChartProps {
  players: [Player, Player];
  className?: string;
}

export function PlayerRadarChart({ players, className = '' }: PlayerRadarChartProps) {
  const [player1, player2] = players;

  // Raw values for each metric
  const rawMetrics = [
    { metric: 'Goals', p1: player1.goals_scored, p2: player2.goals_scored },
    { metric: 'Assists', p1: player1.assists, p2: player2.assists },
    { metric: 'xG', p1: parseFloat(player1.expected_goals || '0'), p2: parseFloat(player2.expected_goals || '0') },
    { metric: 'xA', p1: parseFloat(player1.expected_assists || '0'), p2: parseFloat(player2.expected_assists || '0') },
    { metric: 'BPS', p1: player1.bps, p2: player2.bps },
    { metric: 'Bonus', p1: player1.bonus, p2: player2.bonus },
  ];

  // Normalize each metric to 0-100 relative to the max between both players.
  // This makes the radar chart axes comparable regardless of original scale.
  const data = rawMetrics.map(({ metric, p1, p2 }) => {
    const max = Math.max(p1, p2, 1); // avoid division by 0
    return {
      metric,
      [player1.web_name]: Math.round((p1 / max) * 100),
      [player2.web_name]: Math.round((p2 / max) * 100),
      // Store raw values for tooltip
      [`${player1.web_name}_raw`]: p1,
      [`${player2.web_name}_raw`]: p2,
    };
  });

  // Custom tooltip showing actual values instead of percentages
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; dataKey: string; payload: Record<string, number> }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
          <div className="font-bold text-gray-900 mb-1">{label}</div>
          {payload.map((entry) => {
            const rawKey = `${entry.name}_raw`;
            const rawValue = entry.payload[rawKey];
            const displayValue = label === 'xG' || label === 'xA'
              ? rawValue.toFixed(2)
              : rawValue;
            return (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.name === player1.web_name ? '#8b5cf6' : '#ec4899' }}
                />
                <span className="text-gray-600">{entry.name}:</span>
                <span className="font-semibold">{displayValue}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-6 ${className}`}>
      <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">
        Player Comparison
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="text-center">
          <div className="text-sm sm:text-lg font-bold text-gray-900 truncate px-1">{player1.web_name}</div>
          <div className="text-xs sm:text-sm text-gray-600 truncate">{player1.team_name}</div>
          <div className="text-xs sm:text-sm font-semibold text-purple-600">
            £{(player1.now_cost / 10).toFixed(1)}m
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm sm:text-lg font-bold text-gray-900 truncate px-1">{player2.web_name}</div>
          <div className="text-xs sm:text-sm text-gray-600 truncate">{player2.team_name}</div>
          <div className="text-xs sm:text-sm font-semibold text-purple-600">
            £{(player2.now_cost / 10).toFixed(1)}m
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300} className="sm:!h-[400px]">
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: '#374151', fontSize: 10, fontWeight: 600 }}
            className="sm:text-xs"
          />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name={player1.web_name}
            dataKey={player1.web_name}
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.5}
            strokeWidth={2}
          />
          <Radar
            name={player2.web_name}
            dataKey={player2.web_name}
            stroke="#ec4899"
            fill="#ec4899"
            fillOpacity={0.5}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
            iconType="circle"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}