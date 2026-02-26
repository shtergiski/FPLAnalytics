import React, { useMemo } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ReferenceLine, ReferenceArea } from 'recharts';
import { TrendingUp, Users, DollarSign, Activity, Award, Target, Zap, Star } from 'lucide-react';
import { Player } from '../types/fpl';

interface AdvancedAnalyticsProps {
  players: Player[];
}

export function AdvancedAnalytics({ players }: AdvancedAnalyticsProps) {
  // Position Distribution
  const positionDistribution = useMemo(() => {
    const positions = [
      { name: 'Goalkeepers', value: players.filter(p => p.element_type === 1).length, color: '#eab308' },
      { name: 'Defenders', value: players.filter(p => p.element_type === 2).length, color: '#22c55e' },
      { name: 'Midfielders', value: players.filter(p => p.element_type === 3).length, color: '#3b82f6' },
      { name: 'Forwards', value: players.filter(p => p.element_type === 4).length, color: '#ef4444' },
    ];
    return positions;
  }, [players]);

  // Top Teams by Total Points
  const teamStats = useMemo(() => {
    const teamMap = new Map<string, { name: string; totalPoints: number; avgPoints: number; count: number }>();
    
    players.forEach(player => {
      if (!teamMap.has(player.team_name)) {
        teamMap.set(player.team_name, {
          name: player.team_name,
          totalPoints: 0,
          avgPoints: 0,
          count: 0,
        });
      }
      const team = teamMap.get(player.team_name)!;
      team.totalPoints += player.total_points;
      team.count += 1;
    });

    const teams = Array.from(teamMap.values()).map(team => ({
      ...team,
      avgPoints: Math.round(team.totalPoints / team.count),
    }));

    return teams.sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 10);
  }, [players]);

  // Price vs Performance
  const pricePerformance = useMemo(() => {
    const buckets = [
      { range: '< £5m', min: 0, max: 50, players: [] as Player[] },
      { range: '£5-7m', min: 50, max: 70, players: [] as Player[] },
      { range: '£7-9m', min: 70, max: 90, players: [] as Player[] },
      { range: '£9-11m', min: 90, max: 110, players: [] as Player[] },
      { range: '£11m+', min: 110, max: 999, players: [] as Player[] },
    ];

    players.forEach(player => {
      const bucket = buckets.find(b => player.now_cost >= b.min && player.now_cost < b.max);
      if (bucket) {
        bucket.players.push(player);
      }
    });

    return buckets.map(bucket => ({
      range: bucket.range,
      avgPoints: bucket.players.length > 0
        ? Math.round(bucket.players.reduce((sum, p) => sum + p.total_points, 0) / bucket.players.length)
        : 0,
      count: bucket.players.length,
      avgForm: bucket.players.length > 0
        ? (bucket.players.reduce((sum, p) => sum + parseFloat(p.form), 0) / bucket.players.length).toFixed(1)
        : '0',
    }));
  }, [players]);

  // Goals vs Assists Distribution
  const goalsAssistsData = useMemo(() => {
    const attackers = players.filter(p => [3, 4].includes(p.element_type) && (p.goals_scored > 0 || p.assists > 0));
    return attackers
      .sort((a, b) => (b.goals_scored + b.assists) - (a.goals_scored + a.assists))
      .slice(0, 15)
      .map(p => ({
        name: p.web_name,
        goals: p.goals_scored,
        assists: p.assists,
      }));
  }, [players]);

  // Form Trend (Top 10 players)
  const formTrend = useMemo(() => {
    const topPlayers = [...players]
      .filter(p => parseFloat(p.form) > 0)
      .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
      .slice(0, 10);

    return topPlayers.map(p => ({
      name: p.web_name,
      form: parseFloat(p.form),
      ppg: parseFloat(p.points_per_game),
      totalPoints: p.total_points,
    }));
  }, [players]);

  // Ownership vs Performance
  const ownershipAnalysis = useMemo(() => {
    const ranges = [
      { label: '< 5%', min: 0, max: 5 },
      { label: '5-10%', min: 5, max: 10 },
      { label: '10-20%', min: 10, max: 20 },
      { label: '20-40%', min: 20, max: 40 },
      { label: '40%+', min: 40, max: 100 },
    ];

    return ranges.map(range => {
      const playersInRange = players.filter(p => {
        const ownership = parseFloat(p.selected_by_percent);
        return ownership >= range.min && ownership < range.max;
      });

      return {
        range: range.label,
        avgPoints: playersInRange.length > 0
          ? Math.round(playersInRange.reduce((sum, p) => sum + p.total_points, 0) / playersInRange.length)
          : 0,
        count: playersInRange.length,
      };
    });
  }, [players]);

  // Key Stats
  const keyStats = useMemo(() => {
    const totalPoints = players.reduce((sum, p) => sum + p.total_points, 0);
    const avgPoints = Math.round(totalPoints / players.length);
    const maxPoints = Math.max(...players.map(p => p.total_points));
    const topScorer = players.find(p => p.total_points === maxPoints);
    const avgPrice = players.reduce((sum, p) => sum + p.now_cost, 0) / players.length / 10;
    const avgOwnership = players.reduce((sum, p) => sum + parseFloat(p.selected_by_percent), 0) / players.length;

    return {
      totalPoints,
      avgPoints,
      topScorer,
      avgPrice,
      avgOwnership,
      totalGoals: players.reduce((sum, p) => sum + p.goals_scored, 0),
      totalAssists: players.reduce((sum, p) => sum + p.assists, 0),
    };
  }, [players]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-5 h-5 opacity-80" />
            <Badge className="bg-white/20 text-white border-0">League</Badge>
          </div>
          <div className="text-sm font-medium opacity-90 mb-1">Top Scorer</div>
          <div className="text-2xl font-bold truncate">{keyStats.topScorer?.web_name || 'N/A'}</div>
          <div className="text-xs opacity-80 mt-1">{keyStats.topScorer?.total_points || 0} points</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 opacity-80" />
            <Badge className="bg-white/20 text-white border-0">Average</Badge>
          </div>
          <div className="text-sm font-medium opacity-90 mb-1">Avg Points</div>
          <div className="text-3xl font-bold">{keyStats.avgPoints}</div>
          <div className="text-xs opacity-80 mt-1">Per player</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 opacity-80" />
            <Badge className="bg-white/20 text-white border-0">Price</Badge>
          </div>
          <div className="text-sm font-medium opacity-90 mb-1">Avg Price</div>
          <div className="text-3xl font-bold">£{keyStats.avgPrice.toFixed(1)}m</div>
          <div className="text-xs opacity-80 mt-1">All players</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 opacity-80" />
            <Badge className="bg-white/20 text-white border-0">Ownership</Badge>
          </div>
          <div className="text-sm font-medium opacity-90 mb-1">Avg Owned</div>
          <div className="text-3xl font-bold">{keyStats.avgOwnership.toFixed(1)}%</div>
          <div className="text-xs opacity-80 mt-1">Across all players</div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Top Teams by Total Points
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalPoints" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Position Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Players by Position
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={positionDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {positionDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price vs Performance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Price Range Performance
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pricePerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgPoints" fill="#06b6d4" name="Avg Points" radius={[4, 4, 0, 0]} />
              <Bar dataKey="count" fill="#a855f7" name="Player Count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Goals vs Assists */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-600" />
              Top Contributors (G+A)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={goalsAssistsData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="goals" stackId="a" fill="#ef4444" name="Goals" />
              <Bar dataKey="assists" stackId="a" fill="#3b82f6" name="Assists" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Top 10 Players by Form
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="form" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Form" />
              <Line type="monotone" dataKey="ppg" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="PPG" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Ownership Analysis */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Ownership vs Performance
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ownershipAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgPoints" fill="#f59e0b" name="Avg Points" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">League Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{players.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Players</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{keyStats.totalPoints.toLocaleString()}</div>
            <div className="text-sm text-gray-600 mt-1">Total Points</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{keyStats.totalGoals}</div>
            <div className="text-sm text-gray-600 mt-1">Total Goals</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{keyStats.totalAssists}</div>
            <div className="text-sm text-gray-600 mt-1">Total Assists</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-cyan-600">
              {players.filter(p => parseFloat(p.form) > 5).length}
            </div>
            <div className="text-sm text-gray-600 mt-1">In Form (&gt;5)</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {players.filter(p => p.status !== 'a').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Unavailable</div>
          </div>
        </div>
      </Card>
    </div>
  );
}