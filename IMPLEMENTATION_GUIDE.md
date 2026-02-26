# FPL Dashboard - Implementation Guide

Complete technical reference for developers working with the FPL Analytics Dashboard.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Component Specifications](#component-specifications)
3. [State Management](#state-management)
4. [API Integration](#api-integration)
5. [Styling Guidelines](#styling-guidelines)
6. [Performance Optimization](#performance-optimization)

---

## Architecture Overview

### Tech Stack Rationale

**React 18** - Concurrent rendering for smooth interactions  
**TypeScript** - Type safety for complex FPL data structures  
**Zustand** - Lightweight state management (< 1KB)  
**React Router Data Mode** - SSR-ready routing pattern  
**Tailwind CSS v4** - Utility-first styling with new @theme  

### Folder Structure Philosophy

```
/src
  /app                    # Application code
    /components          # Feature components
    /store              # Global state
    /utils              # Helper functions
  /styles               # Global styles
  /imports              # Figma assets (if any)
```

**Why this structure?**
- Clear separation of concerns
- Easy to locate components
- Scalable for future features

---

## Component Specifications

### 1. Dashboard.tsx

**Purpose**: Overview stats and quick navigation

**Key Features**:
- Total team value display
- Points summary (current GW, total)
- Quick actions (Make Transfer, View Team)
- Top performers widget

**Data Requirements**:
```typescript
interface DashboardProps {
  teamValue: number;
  currentGWPoints: number;
  totalPoints: number;
  rank: number;
  topPlayers: Player[];
}
```

**Implementation**:
```tsx
export function Dashboard() {
  const { myTeam, currentGW } = useFPLStore();
  const teamValue = myTeam.reduce((sum, p) => sum + p.now_cost, 0) / 10;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCard title="Team Value" value={`£${teamValue}m`} />
      <StatsCard title="GW Points" value={calculateGWPoints()} />
      <StatsCard title="Rank" value={formatRank(rank)} />
    </div>
  );
}
```

**Styling**:
- White cards with shadow-md
- Cyan accent for primary stats
- Hover effects on interactive elements

---

### 2. PlayerComparison.tsx

**Purpose**: Side-by-side radar chart comparison

**Metrics Displayed**:
1. Goals (per 90 minutes)
2. Assists (per 90 minutes)
3. Form (last 5 games)
4. ICT Index (normalized 0-100)
5. Minutes Played %

**Implementation**:
```tsx
export function PlayerComparison() {
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  
  const radarData = [
    { stat: 'Goals', p1: player1?.goals_per_90 || 0, p2: player2?.goals_per_90|| 0 },
    { stat: 'Assists', p1: player1?.assists_per_90 || 0, p2: player2?.assists_per_90 || 0 },
    { stat: 'Form', p1: Number(player1?.form) || 0, p2: Number(player2?.form) || 0 },
    { stat: 'ICT', p1: Number(player1?.ict_index) / 10 || 0, p2: Number(player2?.ict_index) / 10 || 0 },
    { stat: 'Minutes', p1: player1?.minutes_played / 10 || 0, p2: player2?.minutes_played / 10 || 0 },
  ];
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="stat" tick={{ fill: '#475569', fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} />
        <Radar name={player1?.web_name} dataKey="p1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
        <Radar name={player2?.web_name} dataKey="p2" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

**Player Selector**:
```tsx
<select onChange={(e) => setPlayer1(findPlayer(e.target.value))}>
  <option>Select Player 1</option>
  {players.map(p => (
    <option key={p.id} value={p.id}>{p.web_name} - £{p.now_cost / 10}m</option>
  ))}
</select>
```

**Color Scheme**:
- Player 1: Cyan (#06b6d4)
- Player 2: Purple (#a855f7)
- Grid: Light gray (#e2e8f0)

---

### 3. FDRHeatmap.tsx

**Purpose**: Visual fixture difficulty matrix

**Grid Layout**:
- Rows: 20 Premier League teams
- Columns: Next 5 gameweeks
- Cells: Color-coded by difficulty (1-5)

**FDR Calculation**:
```typescript
function getFDR(opponentStrength: number): number {
  // FDR = Opponent's strength rating (1 = easiest, 5 = hardest)
  if (opponentStrength <= 2) return 1; // Easy (Green)
  if (opponentStrength <= 3) return 2; // Medium-Easy
  if (opponentStrength <= 4) return 3; // Medium (Yellow)
  if (opponentStrength <= 5) return 4; // Medium-Hard
  return 5; // Hard (Red)
}
```

**Color Mapping**:
```css
.fdr-1 { background: #22c55e; } /* Green-500 */
.fdr-2 { background: #86efac; } /* Green-300 */
.fdr-3 { background: #fbbf24; } /* Amber-400 */
.fdr-4 { background: #fb923c; } /* Orange-400 */
.fdr-5 { background: #ef4444; } /* Red-500 */
```

**Implementation**:
```tsx
export function FDRHeatmap() {
  const { teams, fixtures } = useFPLStore();
  const nextGWs = [currentGW, currentGW + 1, currentGW + 2, currentGW + 3, currentGW + 4];
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th>Team</th>
            {nextGWs.map(gw => <th key={gw}>GW{gw}</th>)}
          </tr>
        </thead>
        <tbody>
          {teams.map(team => (
            <tr key={team.id}>
              <td className="font-semibold">{team.short_name}</td>
              {nextGWs.map(gw => {
                const fixture = getFixture(team.id, gw);
                const fdr = calculateFDR(fixture);
                return (
                  <td key={gw} className={`fdr-${fdr} text-center p-3`}>
                    {fixture.opponent_short} {fixture.is_home ? '(H)' : '(A)'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Responsive Design**:
- Desktop: Full table visible
- Tablet: Horizontal scroll
- Mobile: Fixed team column, scrollable fixtures

---

### 4. TeamPlanner.tsx

**Purpose**: Drag-and-drop team builder with pitch visualization

**Formation Validation**:
```typescript
const VALID_FORMATIONS = [
  '3-4-3', '3-5-2', '4-3-3', '4-4-2', '4-5-1',
  '5-3-2', '5-4-1'
];

function validateFormation(team: Player[]): boolean {
  const gk = team.filter(p => p.element_type === 1).length;
  const def = team.filter(p => p.element_type === 2).length;
  const mid = team.filter(p => p.element_type === 3).length;
  const fwd = team.filter(p => p.element_type === 4).length;
  
  return gk === 1 && 
         def >= 3 && def <= 5 &&
         mid >= 2 && mid <= 5 &&
         fwd >= 1 && fwd <= 3 &&
         (gk + def + mid + fwd) === 11;
}
```

**Drag & Drop Setup**:
```tsx
// Install: react-dnd react-dnd-html5-backend
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function TeamPlanner() {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="pitch-container">
        <Pitch players={starting11} />
        <Bench players={bench} />
      </div>
    </DndProvider>
  );
}
```

**Player Card (Draggable)**:
```tsx
function PlayerCard({ player, index }: PlayerCardProps) {
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
      className={`player-card ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <div className="player-name">{player.web_name}</div>
      <div className="player-price">£{player.now_cost / 10}m</div>
    </div>
  );
}
```

**Drop Zone**:
```tsx
function PitchPosition({ position, onDrop }: PositionProps) {
  const [{ isOver }, drop] = useDrop({
    accept: 'PLAYER',
    drop: (item: { player: Player }) => onDrop(item.player, position),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });
  
  return (
    <div 
      ref={drop}
      className={`pitch-position ${isOver ? 'ring-2 ring-cyan-500' : ''}`}
    />
  );
}
```

**Pitch Layout**:
```tsx
<div className="pitch bg-gradient-to-b from-green-600 to-green-700 p-8">
  <div className="formation">
    {/* Forwards */}
    <div className="flex justify-around mb-8">
      {forwards.map((p, i) => <PlayerCard key={i} player={p} />)}
    </div>
    
    {/* Midfielders */}
    <div className="flex justify-around mb-8">
      {midfielders.map((p, i) => <PlayerCard key={i} player={p} />)}
    </div>
    
    {/* Defenders */}
    <div className="flex justify-around mb-8">
      {defenders.map((p, i) => <PlayerCard key={i} player={p} />)}
    </div>
    
    {/* Goalkeeper */}
    <div className="flex justify-center">
      <PlayerCard player={goalkeeper} />
    </div>
  </div>
</div>
```

---

### 5. FormVsFixtures.tsx

**Purpose**: Scatter plot showing form vs upcoming fixture difficulty

**Axes**:
- X-axis: Average FDR (next 3 GWs)
- Y-axis: Form (points per game last 5)

**Quadrant Analysis**:
```
High Form + Easy Fixtures (Top Left) = BUY
High Form + Hard Fixtures (Top Right) = HOLD
Low Form + Easy Fixtures (Bottom Left) = MONITOR
Low Form + Hard Fixtures (Bottom Right) = SELL
```

**Implementation**:
```tsx
export function FormVsFixtures() {
  const { players, fixtures } = useFPLStore();
  
  const scatterData = players.map(p => ({
    name: p.web_name,
    form: Number(p.form),
    avgFDR: calculateAvgFDR(p.team, fixtures),
    price: p.now_cost / 10,
  }));
  
  return (
    <ResponsiveContainer width="100%" height={500}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          type="number" 
          dataKey="avgFDR" 
          name="Fixture Difficulty"
          label={{ value: 'Easier ← Fixtures → Harder', position: 'bottom', offset: 40 }}
          domain={[1, 5]}
        />
        <YAxis 
          type="number" 
          dataKey="form" 
          name="Form"
          label={{ value: 'Form (PPG)', angle: -90, position: 'left', offset: 40 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Scatter name="Goalkeepers" data={scatterData.filter(p => p.position === 'GK')} fill="#fbbf24" />
        <Scatter name="Defenders" data={scatterData.filter(p => p.position === 'DEF')} fill="#22c55e" />
        <Scatter name="Midfielders" data={scatterData.filter(p => p.position === 'MID')} fill="#06b6d4" />
        <Scatter name="Forwards" data={scatterData.filter(p => p.position === 'FWD')} fill="#a855f7" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
```

---

## State Management

### Zustand Store Structure

**File**: `/src/app/store/fpl-store.ts`

```typescript
import { create } from 'zustand';

interface FPLStore {
  // Static Data (from bootstrap-static)
  players: Player[];
  teams: Team[];
  events: Event[];
  
  // User Data
  myTeam: Player[];
  bench: Player[];
  captain: number | null;
  viceCaptain: number | null;
  
  // Budget & Transfers
  budget: number;
  transfersAvailable: number;
  transfersMade: number;
  
  // UI State
  currentGW: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  setPlayers: (players: Player[]) => void;
  setTeams: (teams: Team[]) => void;
  addPlayerToTeam: (player: Player) => void;
  removePlayerFromTeam: (playerId: number) => void;
  swapPlayers: (player1Id: number, player2Id: number) => void;
  setCaptain: (playerId: number) => void;
  makeTransfer: (outId: number, inId: number) => void;
  setCurrentGW: (gw: number) => void;
}

export const useFPLStore = create<FPLStore>((set, get) => ({
  // Initial State
  players: [],
  teams: [],
  events: [],
  myTeam: [],
  bench: [],
  captain: null,
  viceCaptain: null,
  budget: 100.0,
  transfersAvailable: 1,
  transfersMade: 0,
  currentGW: 1,
  loading: false,
  error: null,
  
  // Actions
  setPlayers: (players) => set({ players }),
  
  setTeams: (teams) => set({ teams }),
  
  addPlayerToTeam: (player) => set((state) => {
    const newCost = state.myTeam.reduce((sum, p) => sum + p.now_cost, 0) + player.now_cost;
    if (newCost / 10 > state.budget) {
      return { error: 'Insufficient budget' };
    }
    if (state.myTeam.length >= 15) {
      return { error: 'Squad is full' };
    }
    return { 
      myTeam: [...state.myTeam, player],
      budget: state.budget - (player.now_cost / 10),
      error: null
    };
  }),
  
  removePlayerFromTeam: (playerId) => set((state) => {
    const player = state.myTeam.find(p => p.id === playerId);
    if (!player) return state;
    
    return {
      myTeam: state.myTeam.filter(p => p.id !== playerId),
      budget: state.budget + (player.now_cost / 10)
    };
  }),
  
  makeTransfer: (outId, inId) => set((state) => {
    const playerOut = state.myTeam.find(p => p.id === outId);
    const playerIn = state.players.find(p => p.id === inId);
    
    if (!playerOut || !playerIn) return state;
    
    const costDiff = (playerIn.now_cost - playerOut.now_cost) / 10;
    if (costDiff > state.budget) {
      return { error: 'Insufficient budget for transfer' };
    }
    
    return {
      myTeam: state.myTeam.map(p => p.id === outId ? playerIn : p),
      budget: state.budget - costDiff,
      transfersMade: state.transfersMade + 1,
      transfersAvailable: Math.max(0, state.transfersAvailable - 1),
      error: null
    };
  }),
  
  setCaptain: (playerId) => set({ captain: playerId }),
  
  setCurrentGW: (gw) => set({ currentGW: gw }),
}));
```

### Using the Store

```tsx
// In any component
import { useFPLStore } from '../store/fpl-store';

function MyComponent() {
  const players = useFPLStore(state => state.players);
  const addPlayer = useFPLStore(state => state.addPlayerToTeam);
  
  // Only re-renders when 'players' changes
  return <div>{players.length} players loaded</div>;
}
```

---

## API Integration

### Base Configuration

```typescript
const FPL_API_BASE = 'https://fantasy.premierleague.com/api';
const CORS_PROXY = ''; // Optional: https://corsproxy.io/?

async function fetchFPL<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${CORS_PROXY}${FPL_API_BASE}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn(`FPL API fetch failed for ${endpoint}:`, error);
    return getMockData(endpoint) as T;
  }
}
```

### Bootstrap Data (Initial Load)

```typescript
interface BootstrapData {
  elements: Player[];
  teams: Team[];
  events: Event[];
  element_types: ElementType[];
}

async function loadBootstrapData() {
  const data = await fetchFPL<BootstrapData>('/bootstrap-static/');
  
  useFPLStore.getState().setPlayers(data.elements);
  useFPLStore.getState().setTeams(data.teams);
  
  return data;
}
```

### Mock Data Fallback

```typescript
// /src/app/utils/mock-data.ts
export const mockPlayers: Player[] = [
  {
    id: 1,
    web_name: 'Haaland',
    team: 1,
    element_type: 4,
    now_cost: 150,
    form: '8.5',
    points_per_game: '7.2',
    ict_index: '85.0',
    goals_scored: 12,
    assists: 3,
  },
  // ... more players
];

export const mockTeams: Team[] = [
  { id: 1, name: 'Manchester City', short_name: 'MCI', strength: 5 },
  { id: 2, name: 'Arsenal', short_name: 'ARS', strength: 5 },
  // ... more teams
];

export function getMockData(endpoint: string) {
  if (endpoint === '/bootstrap-static/') {
    return {
      elements: mockPlayers,
      teams: mockTeams,
      events: mockEvents,
    };
  }
  return null;
}
```

---

## Styling Guidelines

### Tailwind Configuration (v4)

**File**: `/src/styles/theme.css`

```css
@import "tailwindcss";

@theme {
  --color-cyan-500: #06b6d4;
  --color-purple-500: #a855f7;
  --color-violet-500: #8b5cf6;
  
  --font-sans: Inter, system-ui, sans-serif;
}
```

### Component Styling Patterns

**Card Component**:
```tsx
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  {children}
</div>
```

**Button (Primary)**:
```tsx
<button className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity">
  {label}
</button>
```

**Table Cell (FDR)**:
```tsx
<td className={`p-3 text-center text-sm font-medium ${fdrColorClass}`}>
  {content}
</td>
```

### Custom CSS Classes

```css
/* /src/styles/theme.css */
.pitch-gradient {
  background: linear-gradient(to bottom, #16a34a, #15803d);
}

.fdr-1 { background-color: #22c55e; color: #fff; }
.fdr-2 { background-color: #86efac; color: #166534; }
.fdr-3 { background-color: #fbbf24; color: #78350f; }
.fdr-4 { background-color: #fb923c; color: #7c2d12; }
.fdr-5 { background-color: #ef4444; color: #fff; }

.player-card {
  @apply bg-white rounded-lg shadow-sm p-4 cursor-move hover:shadow-md transition-shadow;
}
```

---

## Performance Optimization

### 1. Memoization

```tsx
import { useMemo } from 'react';

function PlayerList({ players, filters }) {
  const filteredPlayers = useMemo(() => {
    return players
      .filter(p => p.element_type === filters.position)
      .filter(p => p.now_cost <= filters.maxPrice * 10)
      .sort((a, b) => Number(b.form) - Number(a.form));
  }, [players, filters]);
  
  return <div>{filteredPlayers.map(renderPlayer)}</div>;
}
```

### 2. Virtual Scrolling (for large lists)

```bash
npm install @tanstack/react-virtual
```

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function PlayerTable({ players }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: players.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(item => (
          <PlayerRow key={item.key} player={players[item.index]} />
        ))}
      </div>
    </div>
  );
}
```

### 3. Code Splitting

```tsx
import { lazy, Suspense } from 'react';

const FDRHeatmap = lazy(() => import('./components/FDRHeatmap'));
const FormVsFixtures = lazy(() => import('./components/FormVsFixtures'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/fixtures" element={<FDRHeatmap />} />
        <Route path="/analysis" element={<FormVsFixtures />} />
      </Routes>
    </Suspense>
  );
}
```

### 4. Debouncing Search

```tsx
import { useDebouncedCallback } from 'use-debounce';

function PlayerSearch() {
  const [results, setResults] = useState([]);
  
  const debouncedSearch = useDebouncedCallback((query: string) => {
    const filtered = players.filter(p => 
      p.web_name.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  }, 300);
  
  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
}
```

---

## Building & Deployment

### Production Build

```bash
npm run build

# Output: /dist folder
# - Minified JS bundles
# - Optimized CSS
# - Compressed assets
```

### Environment Variables

```env
# .env.production
VITE_FPL_API_URL=https://fantasy.premierleague.com/api
VITE_ENABLE_ANALYTICS=true
```

### Deployment Checklist

- [ ] Test all routes
- [ ] Verify API fallbacks work
- [ ] Check mobile responsiveness
- [ ] Validate accessibility (WCAG AA)
- [ ] Test with slow 3G network
- [ ] Run Lighthouse audit (>90 score)
- [ ] Set up error tracking (Sentry)
- [ ] Configure CDN for assets
- [ ] Enable Gzip/Brotli compression
- [ ] Set cache headers

---

## Troubleshooting

### Common Issues

**Issue**: CORS errors when fetching FPL API  
**Fix**: Use mock data fallback (already implemented)

**Issue**: Slow radar chart rendering  
**Fix**: Reduce tick count, use `isAnimationActive={false}`

**Issue**: Drag-and-drop not working on mobile  
**Fix**: Add `TouchBackend` for mobile devices

```tsx
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

const isTouchDevice = 'ontouchstart' in window;

<DndProvider backend={isTouchDevice ? TouchBackend : HTML5Backend}>
```

---

## Next Steps

After completing the core implementation:

1. **Add Testing**
   ```bash
   npm install -D vitest @testing-library/react
   ```

2. **Set up CI/CD**
   - GitHub Actions for automated deployment
   - Vercel/Netlify webhook integration

3. **Enhance Features**
   - Historical gameweek comparison
   - Custom leagues
   - Push notifications

4. **Optimize Bundle**
   - Analyze with `npm run build -- --analyze`
   - Tree-shake unused Recharts components

---

**Author**: @FPL_Dave_  
**Last Updated**: February 2026  
**Version**: 1.0.0
