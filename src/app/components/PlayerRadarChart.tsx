import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import type { Player } from '../types/fpl';

interface PlayerRadarChartProps {
  players: [Player, Player];
  className?: string;
}

export function PlayerRadarChart({ players, className = '' }: PlayerRadarChartProps) {
  const [player1, player2] = players;

  // Prepare data for radar chart
  const data = [
    {
      metric: 'Goals',
      [player1.web_name]: player1.goals_scored,
      [player2.web_name]: player2.goals_scored,
    },
    {
      metric: 'Assists',
      [player1.web_name]: player1.assists,
      [player2.web_name]: player2.assists,
    },
    {
      metric: 'xG',
      [player1.web_name]: parseFloat(player1.expected_goals || '0'),
      [player2.web_name]: parseFloat(player2.expected_goals || '0'),
    },
    {
      metric: 'xA',
      [player1.web_name]: parseFloat(player1.expected_assists || '0'),
      [player2.web_name]: parseFloat(player2.expected_assists || '0'),
    },
    {
      metric: 'BPS',
      [player1.web_name]: player1.bps / 10, // Scale down for better visualization
      [player2.web_name]: player2.bps / 10,
    },
    {
      metric: 'Bonus',
      [player1.web_name]: player1.bonus,
      [player2.web_name]: player2.bonus,
    },
  ];

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
          <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fontSize: 10 }} />
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
          <Legend 
            wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
            iconType="circle"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}