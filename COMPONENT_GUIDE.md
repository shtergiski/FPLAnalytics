# Component Reference Guide

Detailed documentation for all React components in the FPL Dashboard.

## Table of Contents
1. [Dashboard](#dashboard)
2. [PlayerComparison](#playercomparison)
3. [FDRHeatmap](#fdrheatmap)
4. [TeamPlanner](#teamplanner)
5. [FixturesComparison](#fixturescomparison)
6. [FormVsFixtures](#formvsfixtures)
7. [PriceChanges](#pricechanges)
8. [Shared Components](#shared-components)

---

## Dashboard

**Path**: `/src/app/components/Dashboard.tsx`

### Purpose
Landing page showing overview statistics and quick navigation to key features.

### Props
```typescript
// No props - uses Zustand store
```

### State
```typescript
const { myTeam, budget, currentGW } = useFPLStore();
```

### Features
- **Team Value Display**: Sum of all player prices
- **Points Summary**: Current GW and total points
- **Rank Display**: Overall rank with formatting (e.g., "125,432")
- **Top Performers**: Cards for best players this GW
- **Quick Actions**: Buttons to navigate to other pages

### Code Structure
```tsx
export function Dashboard() {
  const { myTeam, currentGW, players } = useFPLStore();
  
  // Calculations
  const teamValue = myTeam.reduce((sum, p) => sum + p.now_cost, 0) / 10;
  const currentGWPoints = calculateCurrentGWPoints(myTeam, currentGW);
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1>Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard title="Team Value" value={`£${teamValue}m`} icon={<TrendingUp />} />
        <StatsCard title="GW Points" value={currentGWPoints} icon={<Target />} />
        <StatsCard title="Total Points" value={calculateTotalPoints()} icon={<Award />} />
      </div>
      
      {/* Top Performers */}
      <TopPerformers players={getTopPerformers(players, 5)} />
      
      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
```

### Styling
```css
/* Card styles */
.stats-card {
  @apply bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow;
}

.stats-card-title {
  @apply text-sm text-gray-600 mb-2;
}

.stats-card-value {
  @apply text-3xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent;
}
```

### Usage Example
```tsx
// In routes.ts
import { Dashboard } from './components/Dashboard';

createBrowserRouter([
  { index: true, Component: Dashboard }
]);
```

---

## PlayerComparison

**Path**: `/src/app/components/PlayerComparison.tsx`

### Purpose
Side-by-side radar chart comparison of two players across 5 key metrics.

### Props
```typescript
interface PlayerComparisonProps {
  preselectedPlayer1?: number; // Optional: Pre-select player 1 by ID
  preselectedPlayer2?: number; // Optional: Pre-select player 2 by ID
}
```

### State
```typescript
const [player1, setPlayer1] = useState<Player | null>(null);
const [player2, setPlayer2] = useState<Player | null>(null);
const [filterPosition, setFilterPosition] = useState<number>(0); // 0 = All
```

### Metrics
1. **Goals** (normalized per 90 min, 0-10 scale)
2. **Assists** (normalized per 90 min, 0-10 scale)
3. **Form** (already 0-10 scale)
4. **ICT Index** (divided by 10 for 0-10 scale)
5. **Minutes** (divided by 100 for 0-10 scale)

### Data Transformation
```typescript
function normalizePlayerData(player: Player | null): RadarDataPoint[] {
  if (!player) return emptyData;
  
  return [
    { stat: 'Goals', value: Math.min((player.goals_scored / (player.minutes / 90)) * 5, 10) },
    { stat: 'Assists', value: Math.min((player.assists / (player.minutes / 90)) * 5, 10) },
    { stat: 'Form', value: Math.min(parseFloat(player.form), 10) },
    { stat: 'ICT', value: Math.min(parseFloat(player.ict_index) / 30, 10) },
    { stat: 'Minutes', value: Math.min(player.minutes / 100, 10) },
  ];
}
```

### Code Structure
```tsx
export function PlayerComparison({ preselectedPlayer1, preselectedPlayer2 }: PlayerComparisonProps) {
  const { players } = useFPLStore();
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  
  // Filter players by position
  const filteredPlayers = filterPosition === 0 
    ? players 
    : players.filter(p => p.element_type === filterPosition);
  
  // Prepare radar data
  const radarData = useMemo(() => {
    const p1Data = normalizePlayerData(player1);
    const p2Data = normalizePlayerData(player2);
    
    return p1Data.map((item, index) => ({
      stat: item.stat,
      [player1?.web_name || 'Player 1']: item.value,
      [player2?.web_name || 'Player 2']: p2Data[index].value,
    }));
  }, [player1, player2]);
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1>Player Comparison</h1>
      
      {/* Player Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <PlayerSelector
          label="Player 1"
          players={filteredPlayers}
          selected={player1}
          onChange={setPlayer1}
          accentColor="cyan"
        />
        <PlayerSelector
          label="Player 2"
          players={filteredPlayers}
          selected={player2}
          onChange={setPlayer2}
          accentColor="purple"
        />
      </div>
      
      {/* Position Filter */}
      <PositionFilter value={filterPosition} onChange={setFilterPosition} />
      
      {/* Radar Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <ResponsiveContainer width="100%" height={500}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis 
              dataKey="stat" 
              tick={{ fill: '#475569', fontSize: 14, fontWeight: 600 }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} />
            <Radar 
              name={player1?.web_name || 'Player 1'}
              dataKey={player1?.web_name || 'Player 1'}
              stroke="#06b6d4" 
              fill="#06b6d4" 
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Radar 
              name={player2?.web_name || 'Player 2'}
              dataKey={player2?.web_name || 'Player 2'}
              stroke="#a855f7" 
              fill="#a855f7" 
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Stats Comparison Table */}
      {player1 && player2 && (
        <StatsComparisonTable player1={player1} player2={player2} />
      )}
    </div>
  );
}
```

### Supporting Components

#### PlayerSelector
```tsx
interface PlayerSelectorProps {
  label: string;
  players: Player[];
  selected: Player | null;
  onChange: (player: Player) => void;
  accentColor: 'cyan' | 'purple';
}

function PlayerSelector({ label, players, selected, onChange, accentColor }: PlayerSelectorProps) {
  return (
    <div className={`border-2 border-${accentColor}-500 rounded-lg p-4`}>
      <label className="block text-sm font-semibold mb-2">{label}</label>
      <select
        className="w-full p-2 border rounded"
        value={selected?.id || ''}
        onChange={(e) => {
          const player = players.find(p => p.id === Number(e.target.value));
          if (player) onChange(player);
        }}
      >
        <option value="">Select a player...</option>
        {players.map(p => (
          <option key={p.id} value={p.id}>
            {p.web_name} - £{p.now_cost / 10}m ({getPositionName(p.element_type)})
          </option>
        ))}
      </select>
      
      {selected && (
        <div className="mt-4 space-y-1 text-sm">
          <div>Team: {getTeamName(selected.team)}</div>
          <div>Price: £{selected.now_cost / 10}m</div>
          <div>Form: {selected.form}</div>
          <div>Ownership: {selected.selected_by_percent}%</div>
        </div>
      )}
    </div>
  );
}
```

#### StatsComparisonTable
```tsx
function StatsComparisonTable({ player1, player2 }: { player1: Player; player2: Player }) {
  const stats = [
    { label: 'Goals', p1: player1.goals_scored, p2: player2.goals_scored },
    { label: 'Assists', p1: player1.assists, p2: player2.assists },
    { label: 'Clean Sheets', p1: player1.clean_sheets, p2: player2.clean_sheets },
    { label: 'Bonus', p1: player1.bonus, p2: player2.bonus },
    { label: 'Total Points', p1: player1.total_points, p2: player2.total_points },
  ];
  
  return (
    <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-4">Statistic</th>
            <th className="text-center p-4 text-cyan-600">{player1.web_name}</th>
            <th className="text-center p-4 text-purple-600">{player2.web_name}</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((stat, index) => (
            <tr key={stat.label} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="p-4 font-medium">{stat.label}</td>
              <td className={`text-center p-4 ${stat.p1 > stat.p2 ? 'font-bold text-cyan-600' : ''}`}>
                {stat.p1}
              </td>
              <td className={`text-center p-4 ${stat.p2 > stat.p1 ? 'font-bold text-purple-600' : ''}`}>
                {stat.p2}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Responsive Behavior
- **Desktop**: Side-by-side selectors, large radar chart
- **Tablet**: Stacked selectors, medium radar chart
- **Mobile**: Full-width selectors, scrollable table

---

## FDRHeatmap

**Path**: `/src/app/components/FDRHeatmap.tsx`

### Purpose
Color-coded matrix showing fixture difficulty for all teams across next 5 gameweeks.

### Props
```typescript
interface FDRHeatmapProps {
  gameweeksToShow?: number; // Default: 5
}
```

### State
```typescript
const { teams, fixtures, currentGW } = useFPLStore();
```

### FDR Color Scale
```typescript
const FDR_COLORS = {
  1: { bg: '#22c55e', text: '#fff', label: 'Very Easy' },
  2: { bg: '#86efac', text: '#166534', label: 'Easy' },
  3: { bg: '#fbbf24', text: '#78350f', label: 'Medium' },
  4: { bg: '#fb923c', text: '#7c2d12', label: 'Hard' },
  5: { bg: '#ef4444', text: '#fff', label: 'Very Hard' },
};
```

### FDR Calculation Logic
```typescript
function calculateFDR(fixture: Fixture, isHome: boolean): number {
  // Get opponent's strength
  const opponent = isHome ? fixture.team_a : fixture.team_h;
  const opponentTeam = teams.find(t => t.id === opponent);
  
  if (!opponentTeam) return 3; // Default medium
  
  // Use FPL's built-in difficulty if available
  if (fixture.team_h_difficulty && fixture.team_a_difficulty) {
    return isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
  }
  
  // Fallback: Calculate from team strength
  const strength = isHome 
    ? opponentTeam.strength_overall_away 
    : opponentTeam.strength_overall_home;
  
  if (strength >= 1350) return 5;
  if (strength >= 1300) return 4;
  if (strength >= 1200) return 3;
  if (strength >= 1100) return 2;
  return 1;
}
```

### Code Structure
```tsx
export function FDRHeatmap({ gameweeksToShow = 5 }: FDRHeatmapProps) {
  const { teams, fixtures, currentGW } = useFPLStore();
  
  // Get next N gameweeks
  const gameweeks = Array.from({ length: gameweeksToShow }, (_, i) => currentGW + i);
  
  // Build fixture grid
  const fixtureGrid = teams.map(team => {
    const teamFixtures = gameweeks.map(gw => {
      const fixture = fixtures.find(f => 
        f.event === gw && (f.team_h === team.id || f.team_a === team.id)
      );
      
      if (!fixture) return null;
      
      const isHome = fixture.team_h === team.id;
      const opponentId = isHome ? fixture.team_a : fixture.team_h;
      const opponent = teams.find(t => t.id === opponentId);
      const fdr = calculateFDR(fixture, isHome);
      
      return {
        opponent: opponent?.short_name || 'TBD',
        isHome,
        fdr,
        kickoff: fixture.kickoff_time,
      };
    });
    
    return {
      team,
      fixtures: teamFixtures,
    };
  });
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1>Fixture Difficulty Rating</h1>
        <FDRLegend />
      </div>
      
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 text-left p-3 font-semibold">
                Team
              </th>
              {gameweeks.map(gw => (
                <th key={gw} className="text-center p-3 font-semibold">
                  GW{gw}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fixtureGrid.map(({ team, fixtures }) => (
              <tr key={team.id} className="border-b hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white p-3 font-medium">
                  <div className="flex items-center gap-2">
                    <img src={team.badge} alt={team.short_name} className="w-6 h-6" />
                    {team.short_name}
                  </div>
                </td>
                {fixtures.map((fixture, index) => (
                  <td key={index} className="p-0">
                    {fixture ? (
                      <div
                        className="p-3 text-center font-medium cursor-pointer hover:opacity-80"
                        style={{
                          backgroundColor: FDR_COLORS[fixture.fdr].bg,
                          color: FDR_COLORS[fixture.fdr].text,
                        }}
                        title={`${fixture.opponent} ${fixture.isHome ? '(H)' : '(A)'} - ${FDR_COLORS[fixture.fdr].label}`}
                      >
                        {fixture.opponent}
                        <span className="text-xs ml-1">
                          {fixture.isHome ? '(H)' : '(A)'}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 text-center text-gray-400">-</div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {fixtureGrid.map(({ team, fixtures }) => (
          <FDRMobileCard key={team.id} team={team} fixtures={fixtures} gameweeks={gameweeks} />
        ))}
      </div>
    </div>
  );
}
```

### Supporting Components

#### FDRLegend
```tsx
function FDRLegend() {
  return (
    <div className="flex gap-2 items-center text-sm">
      <span className="font-medium">Difficulty:</span>
      {Object.entries(FDR_COLORS).map(([fdr, { bg, text, label }]) => (
        <div key={fdr} className="flex items-center gap-1">
          <div 
            className="w-4 h-4 rounded" 
            style={{ backgroundColor: bg }}
          />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
```

#### FDRMobileCard
```tsx
function FDRMobileCard({ team, fixtures, gameweeks }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center gap-2 mb-3">
        <img src={team.badge} alt={team.short_name} className="w-8 h-8" />
        <h3 className="font-bold">{team.name}</h3>
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {fixtures.map((fixture, index) => (
          <div key={index} className="text-center">
            <div className="text-xs text-gray-600 mb-1">GW{gameweeks[index]}</div>
            {fixture ? (
              <div
                className="p-2 rounded text-sm font-medium"
                style={{
                  backgroundColor: FDR_COLORS[fixture.fdr].bg,
                  color: FDR_COLORS[fixture.fdr].text,
                }}
              >
                {fixture.opponent}
                <div className="text-xs">{fixture.isHome ? 'H' : 'A'}</div>
              </div>
            ) : (
              <div className="p-2 text-gray-400">-</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Features
- **Hover Details**: Shows full opponent name and difficulty label
- **Sticky Team Column**: Team names stay visible when scrolling horizontally
- **Responsive**: Table on desktop, cards on mobile
- **Color Blind Mode**: Optional pattern overlays

---

## TeamPlanner

**Path**: `/src/app/components/TeamPlanner.tsx`

### Purpose
Interactive team builder with drag-and-drop functionality and formation validation.

### State
```typescript
const { myTeam, budget, addPlayer, removePlayer, swapPlayers } = useFPLStore();
const [starting11, setStarting11] = useState<(Player | null)[]>(Array(11).fill(null));
const [bench, setBench] = useState<(Player | null)[]>(Array(4).fill(null));
const [captain, setCaptain] = useState<number | null>(null);
const [viceCaptain, setViceCaptain] = useState<number | null>(null);
```

### Formation Validation
```typescript
const VALID_FORMATIONS = [
  [1, 3, 4, 3],
  [1, 3, 5, 2],
  [1, 4, 3, 3],
  [1, 4, 4, 2],
  [1, 4, 5, 1],
  [1, 5, 3, 2],
  [1, 5, 4, 1],
];

function validateFormation(players: (Player | null)[]): { valid: boolean; message: string } {
  const gk = players.filter(p => p?.element_type === 1).length;
  const def = players.filter(p => p?.element_type === 2).length;
  const mid = players.filter(p => p?.element_type === 3).length;
  const fwd = players.filter(p => p?.element_type === 4).length;
  
  if (gk !== 1) return { valid: false, message: 'Must have exactly 1 goalkeeper' };
  if (def < 3) return { valid: false, message: 'Must have at least 3 defenders' };
  if (mid < 2) return { valid: false, message: 'Must have at least 2 midfielders' };
  if (fwd < 1) return { valid: false, message: 'Must have at least 1 forward' };
  
  const formationValid = VALID_FORMATIONS.some(
    f => f[0] === gk && f[1] === def && f[2] === mid && f[3] === fwd
  );
  
  if (!formationValid) {
    return { valid: false, message: `Invalid formation: ${gk}-${def}-${mid}-${fwd}` };
  }
  
  return { valid: true, message: 'Valid formation' };
}
```

### Code Structure
```tsx
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export function TeamPlanner() {
  const { myTeam, budget } = useFPLStore();
  const [starting11, setStarting11] = useState<(Player | null)[]>([]);
  const [bench, setBench] = useState<(Player | null)[]>([]);
  
  // Handle drag & drop
  const handleDrop = (draggedPlayer: Player, targetIndex: number, zone: 'pitch' | 'bench') => {
    if (zone === 'pitch') {
      const newStarting = [...starting11];
      newStarting[targetIndex] = draggedPlayer;
      setStarting11(newStarting);
    } else {
      const newBench = [...bench];
      newBench[targetIndex] = draggedPlayer;
      setBench(newBench);
    }
  };
  
  // Validate current formation
  const formationStatus = validateFormation(starting11);
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1>My Team</h1>
          <div className="text-right">
            <div className="text-2xl font-bold">£{budget.toFixed(1)}m</div>
            <div className="text-sm text-gray-600">Remaining</div>
          </div>
        </div>
        
        {/* Formation Status */}
        <div className={`p-4 rounded-lg mb-6 ${
          formationStatus.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {formationStatus.message}
        </div>
        
        {/* Pitch */}
        <div className="pitch-gradient rounded-lg p-8 mb-6">
          <PitchLayout 
            players={starting11} 
            onDrop={(player, index) => handleDrop(player, index, 'pitch')}
            captain={captain}
            viceCaptain={viceCaptain}
            onSetCaptain={setCaptain}
            onSetViceCaptain={setViceCaptain}
          />
        </div>
        
        {/* Bench */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Bench</h2>
          <div className="grid grid-cols-4 gap-4">
            {bench.map((player, index) => (
              <DropZone
                key={index}
                index={index}
                player={player}
                onDrop={(p) => handleDrop(p, index, 'bench')}
              />
            ))}
          </div>
        </div>
        
        {/* Player Search & Add */}
        <PlayerSearch onAddPlayer={(player) => {/* Add logic */}} />
      </div>
    </DndProvider>
  );
}
```

### Drag & Drop Components

#### DraggablePlayer
```tsx
interface DraggablePlayerProps {
  player: Player;
  index: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

function DraggablePlayer({ player, index, isCaptain, isViceCaptain }: DraggablePlayerProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'PLAYER',
    item: { player, sourceIndex: index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  return (
    <div
      ref={drag}
      className={`relative cursor-move transition-opacity ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      {/* Captain Badge */}
      {isCaptain && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10">
          C
        </div>
      )}
      
      {/* Vice Captain Badge */}
      {isViceCaptain && (
        <div className="absolute -top-2 -right-2 bg-gray-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10">
          V
        </div>
      )}
      
      {/* Player Card */}
      <div className="bg-white rounded-lg shadow-md p-3 text-center">
        <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white font-bold mb-2 ${
          getPositionColor(player.element_type)
        }`}>
          {player.web_name.substring(0, 2).toUpperCase()}
        </div>
        <div className="font-semibold text-sm truncate">{player.web_name}</div>
        <div className="text-xs text-gray-600">£{player.now_cost / 10}m</div>
      </div>
    </div>
  );
}
```

#### DropZone
```tsx
interface DropZoneProps {
  index: number;
  player: Player | null;
  onDrop: (player: Player) => void;
  positionFilter?: number; // Optional: Only accept specific position
}

function DropZone({ index, player, onDrop, positionFilter }: DropZoneProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'PLAYER',
    drop: (item: { player: Player }) => onDrop(item.player),
    canDrop: (item: { player: Player }) => {
      if (positionFilter) {
        return item.player.element_type === positionFilter;
      }
      return true;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });
  
  return (
    <div
      ref={drop}
      className={`min-h-[100px] border-2 border-dashed rounded-lg flex items-center justify-center ${
        isOver && canDrop ? 'border-cyan-500 bg-cyan-50' :
        isOver && !canDrop ? 'border-red-500 bg-red-50' :
        'border-gray-300'
      }`}
    >
      {player ? (
        <DraggablePlayer player={player} index={index} />
      ) : (
        <div className="text-gray-400 text-sm">Drop player here</div>
      )}
    </div>
  );
}
```

#### PitchLayout
```tsx
function PitchLayout({ players, onDrop, captain, viceCaptain, onSetCaptain, onSetViceCaptain }) {
  // Group by position
  const gk = players.filter(p => p?.element_type === 1);
  const def = players.filter(p => p?.element_type === 2);
  const mid = players.filter(p => p?.element_type === 3);
  const fwd = players.filter(p => p?.element_type === 4);
  
  return (
    <div className="space-y-12">
      {/* Forwards */}
      <div className="flex justify-around">
        {fwd.map((player, index) => (
          <DropZone
            key={index}
            index={index}
            player={player}
            onDrop={(p) => onDrop(p, index)}
            positionFilter={4}
          />
        ))}
      </div>
      
      {/* Midfielders */}
      <div className="flex justify-around">
        {mid.map((player, index) => (
          <DropZone
            key={index}
            index={index + fwd.length}
            player={player}
            onDrop={(p) => onDrop(p, index + fwd.length)}
            positionFilter={3}
          />
        ))}
      </div>
      
      {/* Defenders */}
      <div className="flex justify-around">
        {def.map((player, index) => (
          <DropZone
            key={index}
            index={index + fwd.length + mid.length}
            player={player}
            onDrop={(p) => onDrop(p, index + fwd.length + mid.length)}
            positionFilter={2}
          />
        ))}
      </div>
      
      {/* Goalkeeper */}
      <div className="flex justify-center">
        <DropZone
          index={10}
          player={gk[0] || null}
          onDrop={(p) => onDrop(p, 10)}
          positionFilter={1}
        />
      </div>
    </div>
  );
}
```

### Features
- **Drag & Drop**: Intuitive player movement
- **Formation Validation**: Real-time feedback
- **Captain Selection**: Tap player to set captain/vice
- **Budget Tracking**: Live remaining budget
- **Player Search**: Add new players to squad
- **Auto-Substitution**: Suggest optimal bench order

---

## FormVsFixtures

**Path**: `/src/app/components/FormVsFixtures.tsx`

### Purpose
Scatter plot showing player form vs upcoming fixture difficulty to identify optimal transfers.

### Props
```typescript
interface FormVsFixturesProps {
  gameweeksToAnalyze?: number; // Default: 3
  minMinutes?: number;          // Filter: min minutes played
}
```

### Quadrant Analysis
```
        High Form
           |
   BUY  |  HOLD
  (Best)|  (Keep)
--------|--------
 WATCH  |  SELL
(Monitor)|(Avoid)
           |
        Low Form

Easy ← Fixtures → Hard
```

### Data Preparation
```typescript
function prepareScatterData(
  players: Player[],
  fixtures: Fixture[],
  gameweeksToAnalyze: number,
  minMinutes: number
) {
  return players
    .filter(p => p.minutes >= minMinutes)
    .map(p => {
      const avgFDR = calculateAverageFDR(p.team, fixtures, gameweeksToAnalyze);
      const form = parseFloat(p.form);
      
      return {
        id: p.id,
        name: p.web_name,
        team: p.team,
        position: p.element_type,
        form: form,
        fdr: avgFDR,
        price: p.now_cost / 10,
        ownership: parseFloat(p.selected_by_percent),
        
        // Quadrant classification
        quadrant: form > 5 && avgFDR < 3 ? 'buy' :
                  form > 5 && avgFDR >= 3 ? 'hold' :
                  form <= 5 && avgFDR < 3 ? 'watch' : 'sell',
      };
    });
}
```

### Code Structure
```tsx
export function FormVsFixtures({ gameweeksToAnalyze = 3, minMinutes = 450 }: FormVsFixturesProps) {
  const { players, fixtures, currentGW } = useFPLStore();
  const [filterPosition, setFilterPosition] = useState<number>(0);
  const [highlightedPlayer, setHighlightedPlayer] = useState<number | null>(null);
  
  const scatterData = useMemo(() => 
    prepareScatterData(players, fixtures, gameweeksToAnalyze, minMinutes),
    [players, fixtures, gameweeksToAnalyze, minMinutes]
  );
  
  const filteredData = filterPosition === 0
    ? scatterData
    : scatterData.filter(p => p.position === filterPosition);
  
  // Group by position for different colors
  const dataByPosition = {
    gk: filteredData.filter(p => p.position === 1),
    def: filteredData.filter(p => p.position === 2),
    mid: filteredData.filter(p => p.position === 3),
    fwd: filteredData.filter(p => p.position === 4),
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1>Form vs Fixtures Analysis</h1>
      
      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <PositionFilter value={filterPosition} onChange={setFilterPosition} />
        <MinutesSlider value={minMinutes} onChange={setMinMinutes} />
      </div>
      
      {/* Scatter Plot */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <ResponsiveContainer width="100%" height={600}>
          <ScatterChart margin={{ top: 20, right: 80, bottom: 80, left: 80 }}>
            {/* Quadrant Background */}
            <ReferenceArea x1={1} x2={3} y1={5} y2={10} fill="#dcfce7" fillOpacity={0.3} />
            <ReferenceArea x1={3} x2={5} y1={5} y2={10} fill="#fef3c7" fillOpacity={0.3} />
            <ReferenceArea x1={1} x2={3} y1={0} y2={5} fill="#f3f4f6" fillOpacity={0.3} />
            <ReferenceArea x1={3} x2={5} y1={0} y2={5} fill="#fee2e2" fillOpacity={0.3} />
            
            {/* Quadrant Lines */}
            <ReferenceLine x={3} stroke="#9ca3af" strokeDasharray="3 3" />
            <ReferenceLine y={5} stroke="#9ca3af" strokeDasharray="3 3" />
            
            <CartesianGrid strokeDasharray="3 3" />
            
            <XAxis 
              type="number" 
              dataKey="fdr" 
              name="Fixture Difficulty"
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              label={{ 
                value: 'Easy ← Fixture Difficulty → Hard', 
                position: 'bottom', 
                offset: 60,
                style: { fontSize: 14, fontWeight: 600 }
              }}
            />
            
            <YAxis 
              type="number" 
              dataKey="form" 
              name="Form"
              domain={[0, 10]}
              label={{ 
                value: 'Form (Points per Game)', 
                angle: -90, 
                position: 'left', 
                offset: 60,
                style: { fontSize: 14, fontWeight: 600 }
              }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            {/* Scatter Series */}
            {filterPosition === 0 || filterPosition === 1 ? (
              <Scatter 
                name="Goalkeepers" 
                data={dataByPosition.gk} 
                fill="#fbbf24"
                shape="circle"
              />
            ) : null}
            
            {filterPosition === 0 || filterPosition === 2 ? (
              <Scatter 
                name="Defenders" 
                data={dataByPosition.def} 
                fill="#22c55e"
                shape="circle"
              />
            ) : null}
            
            {filterPosition === 0 || filterPosition === 3 ? (
              <Scatter 
                name="Midfielders" 
                data={dataByPosition.mid} 
                fill="#06b6d4"
                shape="circle"
              />
            ) : null}
            
            {filterPosition === 0 || filterPosition === 4 ? (
              <Scatter 
                name="Forwards" 
                data={dataByPosition.fwd} 
                fill="#a855f7"
                shape="circle"
              />
            ) : null}
          </ScatterChart>
        </ResponsiveContainer>
        
        {/* Quadrant Labels */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <QuadrantCard 
            title="BUY" 
            description="High form + Easy fixtures" 
            color="green"
            players={scatterData.filter(p => p.quadrant === 'buy').slice(0, 5)}
          />
          <QuadrantCard 
            title="HOLD" 
            description="High form + Hard fixtures" 
            color="yellow"
            players={scatterData.filter(p => p.quadrant === 'hold').slice(0, 5)}
          />
          <QuadrantCard 
            title="WATCH" 
            description="Low form + Easy fixtures" 
            color="gray"
            players={scatterData.filter(p => p.quadrant === 'watch').slice(0, 5)}
          />
          <QuadrantCard 
            title="SELL" 
            description="Low form + Hard fixtures" 
            color="red"
            players={scatterData.filter(p => p.quadrant === 'sell').slice(0, 5)}
          />
        </div>
      </div>
    </div>
  );
}
```

### Custom Tooltip
```tsx
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg shadow-lg p-4">
      <div className="font-bold text-lg mb-2">{data.name}</div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Team:</span>
          <span className="font-medium">{getTeamName(data.team)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Position:</span>
          <span className="font-medium">{getPositionName(data.position)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Form:</span>
          <span className="font-medium">{data.form.toFixed(1)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Avg FDR:</span>
          <span className="font-medium">{data.fdr.toFixed(1)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Price:</span>
          <span className="font-medium">£{data.price}m</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Ownership:</span>
          <span className="font-medium">{data.ownership}%</span>
        </div>
      </div>
      
      {/* Quadrant Recommendation */}
      <div className={`mt-3 pt-3 border-t font-medium ${
        data.quadrant === 'buy' ? 'text-green-600' :
        data.quadrant === 'hold' ? 'text-yellow-600' :
        data.quadrant === 'watch' ? 'text-gray-600' : 'text-red-600'
      }`}>
        {data.quadrant === 'buy' ? '✓ Strong Buy' :
         data.quadrant === 'hold' ? '→ Hold' :
         data.quadrant === 'watch' ? '⚠ Monitor' : '✗ Consider Selling'}
      </div>
    </div>
  );
}
```

---

## Shared Components

### StatsCard
```tsx
interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
}

export function StatsCard({ title, value, icon, trend, trendValue }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="text-sm text-gray-600">{title}</div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      
      <div className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent mb-2">
        {value}
      </div>
      
      {trend && trendValue && (
        <div className={`text-sm font-medium flex items-center gap-1 ${
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend === 'up' ? '↑' : '↓'} {trendValue}
        </div>
      )}
    </div>
  );
}
```

### LoadingSpinner
```tsx
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  
  return (
    <div className="flex justify-center items-center p-8">
      <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-cyan-500 rounded-full animate-spin`} />
    </div>
  );
}
```

### ErrorBoundary
```tsx
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, { hasError: boolean }> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="text-red-500 text-xl font-bold mb-4">Something went wrong</div>
          <button 
            className="bg-cyan-500 text-white px-4 py-2 rounded"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

---

**This component guide provides implementation details for all major components in the FPL Dashboard. Each section includes code examples, props/state definitions, and usage patterns.**

**Author**: @FPL_Dave_  
**Last Updated**: February 2026
