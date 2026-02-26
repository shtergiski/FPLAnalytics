# FPL Analytics Dashboard - Project Context

## Overview
A comprehensive Fantasy Premier League analytics and content creation platform built with React, TypeScript, and Tailwind CSS. Integrates with the official FPL API to provide real-time player data, team planning tools, and social media graphics generation.

**Creator**: @FPL_Dave_
**Purpose**: Help FPL managers make data-driven decisions and create shareable content
**Deployment**: Figma Make (web preview environment)

---

## Key Features

### 1. Dashboard (Home)
**Route**: `/`
**Component**: `/src/app/components/Dashboard.tsx`

- **Key Metrics Cards**: Budget remaining, team value, total points, transfers made
- **Top Players Grid**: Displays top 20 players sorted by total points
- **Player Stats**: Points, form, selected by %, price, next fixture with FDR color
- **Search & Filter**: Real-time search, position filter (ALL/GKP/DEF/MID/FWD)

### 2. Team Planner Studio
**Route**: `/team-planner`
**Component**: `/src/app/components/studio/TeamPlannerStudio.tsx`

**Features**:
- Visual football pitch with drag-and-drop-like interface
- Load official FPL team by manager ID
- 3-column layout: Player database | Team sheet with pitch | Stats sidebar
- Automatic formation detection (3-4-3, 3-5-2, 4-3-3, 4-4-2, 4-5-1, 5-3-2, 5-4-1)
- Transfer mode with FPL rules validation
- Captain/Vice-captain selection
- Budget tracking with £100m limit
- Squad composition validation (2 GKP, 5 DEF, 5 MID, 3 FWD)
- Max 3 players per team rule enforcement
- Official player photos (110x140) with team badge fallback
- Export to PNG functionality

**Critical Logic**:
- Formation is **locked/read-only** after loading official FPL team (auto-detected from squad)
- Transfer validation checks: budget, squad composition, team limits
- Position-based validation: can transfer any position to any position IF squad rules are met

### 3. Creator Hub
**Route**: `/creator-hub`
**Component**: `/src/app/components/CreatorHub.tsx`

**Builder Types**:

#### a) Player Cards Gallery
- Grid of player cards with stats
- Exportable individual player cards
- Stats: Points, form, price, ownership, bonus points

#### b) Gameweek Review Builder
- Create GW recap graphics
- Top performers display
- Customizable text and styling

#### c) Team Lineup Builder (Advanced)
**Component**: `/src/app/components/builders/TeamLineupBuilderAdvanced.tsx`
- Full squad builder (11 starters + 4 bench)
- Load FPL team by manager ID with gameweek fallback logic
- Formation selector **DISABLED after FPL team load** (shows "auto-detected")
- Display modes: Player photos vs Team kits
- Custom image upload per player
- Image position controls (x/y/scale)
- Captain/vice-captain badges
- Manual player editing (name, position, custom images)
- Export to high-res PNG (3x resolution)

**Technical Details**:
- Uses `isFPLTeamLoaded` state flag to lock formation
- GW fallback: Tries current GW → GW-1 → GW-2
- Player photos: 250x250 resolution
- Team kits: Different for GK (type 5) vs outfield (type 1)

#### d) Head-to-Head Builder
- Compare 2 players side-by-side
- Stats comparison with visual bars

#### e) FDR Fixture Builder
- Fixture difficulty rating visualization
- Custom GW range selection

### 4. Transfer Tips
**Route**: `/transfer-tips`
**Component**: `/src/app/components/TransferTips.tsx`

- Player comparison tool (transfer out vs transfer in)
- Shows price difference and validation
- Fixture difficulty comparison (next 5 GWs)
- Form analysis with trend indicators
- Stats comparison: Points, goals, assists, minutes, bonus

### 5. Fixtures Comparison
**Route**: `/fixtures-comparison`
**Component**: `/src/app/components/FixturesComparison.tsx`

- Compare fixtures for multiple players (up to 4)
- FDR visualization by gameweek
- Official FDR colors (1=dark green → 5=dark red)
- Next 8 gameweeks display
- PlayerCombobox for player selection

### 6. Head-to-Head
**Route**: `/head-to-head`
**Component**: `/src/app/components/HeadToHead.tsx`

- Side-by-side player comparison
- Stats breakdown: Season, last 5 GWs, upcoming fixtures
- Visual stat bars with percentile indicators
- Fixture difficulty upcoming (next 5 GWs)

### 7. FDR Fixtures
**Route**: `/fixtures`
**Component**: `/src/app/components/FDRFixturesPage.tsx`

**Features**:
- Complete fixture difficulty matrix
- GW range selector (next 5, 8, or 10 GWs)
- Player filtering by position
- Sorting: By team, by position, by FDR, by difficulty sum
- **Best Fixture Highlighting**: Green border + icon on lowest FDR each row
- Official FDR colors: 1 (easiest) to 5 (hardest)
- Responsive grid layout

**FDR Color System**:
```typescript
1: bg-emerald-600 (Easiest)
2: bg-green-500
3: bg-yellow-500 (Medium)
4: bg-orange-500
5: bg-red-600 (Hardest)
```

### 8. Player Stats
**Route**: `/player-stats`
**Component**: `/src/app/components/PlayerStats.tsx`

- Comprehensive player statistics table
- Advanced filtering and search
- Sortable columns
- Stats: Points, form, price, ownership, ICT index, bonus, goals, assists

---

## Architecture

### State Management (Zustand)
**File**: `/src/app/store/fpl-store.ts`

**Store Structure**:
```typescript
{
  bootstrap: BootstrapData | null,
  fixtures: Fixture[] | null,
  loading: boolean,
  error: string | null,
  fetchBootstrapData: () => Promise<void>,
  fetchFixtures: () => Promise<void>
}
```

**Bootstrap Data Contains**:
- `elements`: All players (600+)
- `teams`: All 20 Premier League teams
- `events`: All gameweeks with deadlines
- `element_types`: Position types (1=GKP, 2=DEF, 3=MID, 4=FWD)

### CORS Proxy System
**File**: `/src/app/utils/corsProxy.ts`

**Three-Tier Fallback Strategy**:
1. `corsproxy.io/?{url}`
2. `api.allorigins.win/raw?url={url}`
3. `api.codetabs.com/v1/proxy?quest={url}`

**Timeout**: 12 seconds per proxy attempt

**FPLService Methods**:
- `getBootstrap()`: Get all players, teams, GWs
- `getFixtures()`: Get all fixtures
- `getEntry(managerId)`: Get manager info
- `getEntryPicks(managerId, gw)`: Get manager's team for specific GW
- `getManager(managerId)`: Alias for getEntry
- `getManagerTeam(managerId, gw)`: Alias for getEntryPicks

### Export System
**File**: `/src/app/utils/exportService.ts`

**Two-Stage Image Conversion**:
1. **Canvas Extraction** (preferred): Works if images have CORS headers
2. **Proxy Fetch** (fallback): Fetches image through proxy, converts to base64

**Export Process**:
```
1. Find all <img> and <image> elements
2. Try canvas extraction (fast, works for already-loaded images)
3. If fails → Proxy fetch with blob → FileReader → data URL
4. Replace all src/href with base64 data URLs
5. Use html-to-image (toPng) at 3x resolution
6. Download PNG file
```

**Known Issue**: Proxy fetch sometimes fails (520/522 errors from api.allorigins.win) but canvas extraction usually works since images are already displayed.

### Routing (React Router v7 Data Mode)
**File**: `/src/app/routes.ts`

**Pattern**:
```typescript
createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "team-planner", Component: TeamPlannerStudio },
      { path: "creator-hub", Component: CreatorHub },
      // ... etc
    ]
  }
]);
```

**Important**: Must use `react-router` package (NOT `react-router-dom` - doesn't work in this environment)

---

## Data Structures

### Player Type
```typescript
interface Player {
  id: number;
  web_name: string;           // Display name (e.g., "Salah")
  first_name: string;
  second_name: string;
  element_type: 1 | 2 | 3 | 4; // Position (GKP/DEF/MID/FWD)
  team: number;               // Team ID
  team_code: number;          // For images
  code: number;               // Photo code
  now_cost: number;           // Price in 0.1m (85 = £8.5m)
  selected_by_percent: string; // Ownership %
  total_points: number;
  form: string;               // Recent form (decimal string)
  points_per_game: string;
  ep_next: string;            // Expected points next GW
  ep_this: string;
  // ... 50+ more fields
}
```

### Fixture Type
```typescript
interface Fixture {
  id: number;
  event: number;              // Gameweek number
  team_h: number;             // Home team ID
  team_a: number;             // Away team ID
  team_h_difficulty: number;  // FDR 1-5
  team_a_difficulty: number;  // FDR 1-5
  kickoff_time: string;
  finished: boolean;
  team_h_score: number | null;
  team_a_score: number | null;
}
```

### Team Type
```typescript
interface Team {
  id: number;
  name: string;               // "Arsenal"
  short_name: string;         // "ARS"
  code: number;               // For images
  strength: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
}
```

---

## UI Components Library

### Location: `/src/app/components/ui/`

**Available Components**:
- `Button`: Primary, outline, ghost variants with Lucide icons
- `Card`: White cards with shadow, optional padding prop
- `Input`: Text inputs with consistent styling
- `Select`: Dropdown selects
- `PlayerCombobox`: Searchable player dropdown with avatar (uses Radix Popover + Command)

**Button Example**:
```tsx
<Button variant="default">Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
```

**Card Example**:
```tsx
<Card className="p-6">
  <h3>Title</h3>
  <p>Content</p>
</Card>
```

**PlayerCombobox Example**:
```tsx
<PlayerCombobox
  players={players}
  selectedPlayer={player1}
  onSelect={setPlayer1}
  placeholder="Select player..."
/>
```

---

## Styling System

### Theme Colors (Tailwind CSS v4)
**File**: `/src/styles/theme.css`

**Gradient Theme**: Cyan to Purple
- Primary gradient: `from-cyan-400 to-purple-600`
- Accent gradient: `from-purple-600 to-pink-600`
- Dark mode: `from-gray-800 to-gray-900`

**FDR Colors**:
- FDR 1: `bg-emerald-600` (easiest)
- FDR 2: `bg-green-500`
- FDR 3: `bg-yellow-500`
- FDR 4: `bg-orange-500`
- FDR 5: `bg-red-600` (hardest)

**Position Colors**:
- GKP: `bg-yellow-500`
- DEF: `bg-green-500` / `bg-blue-500`
- MID: `bg-blue-500`
- FWD: `bg-red-500`

### Typography
Default font: System font stack
Custom fonts: Add to `/src/styles/fonts.css` ONLY (never in other CSS files)

---

## Known Issues & Limitations

### 1. CORS Proxy Reliability
**Issue**: api.allorigins.win occasionally returns 520/522 errors
**Impact**: Export proxy fallback may fail
**Mitigation**: Canvas extraction works for displayed images
**Workaround**: Browser screenshot if export fails completely

### 2. FPL API Rate Limiting
**Issue**: FPL API may throttle requests
**Impact**: Slow data loading or temporary failures
**Mitigation**: Zustand store caches bootstrap data

### 3. Player Photos CORS
**Issue**: resources.premierleague.com doesn't send CORS headers to all origins
**Impact**: Canvas extraction may fail in some environments
**Mitigation**: Fallback to team badge, then initials

### 4. Gameweek Data Availability
**Issue**: Current GW picks may not be available before deadline
**Impact**: Load team by ID may fail for current GW
**Mitigation**: Automatic fallback to GW-1, then GW-2

---

## Development Patterns

### 1. Adding a New Page
```typescript
// 1. Create component: /src/app/components/MyNewPage.tsx
export function MyNewPage() {
  const { bootstrap, fetchBootstrapData } = useFPLStore();
  // ... implementation
}

// 2. Add route: /src/app/routes.ts
{ path: "my-new-page", Component: MyNewPage }

// 3. Add to sidebar: /src/app/App.tsx (navigation items)
{ name: 'My New Page', href: '/my-new-page', icon: Star }
```

### 2. Fetching Player Data
```typescript
const { bootstrap, fetchBootstrapData, loading } = useFPLStore();

useEffect(() => {
  if (!bootstrap) {
    fetchBootstrapData();
  }
}, [bootstrap, fetchBootstrapData]);

const players = bootstrap?.elements || [];
```

### 3. Using CORS Proxy
```typescript
// ✅ CORRECT
import { FPLService } from '../utils/corsProxy';
const data = await FPLService.getBootstrap();

// ❌ WRONG
const data = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
```

### 4. Player Photos with Fallback
```tsx
<img
  src={`https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.code}.png`}
  alt={player.web_name}
  onError={(e) => {
    e.currentTarget.src = `https://resources.premierleague.com/premierleague/badges/70/t${player.team_code}.png`;
  }}
/>
```

---

## Performance Optimizations

1. **Lazy Loading**: All routes are lazy loaded via `React.lazy()`
2. **Zustand Store**: Centralized state prevents unnecessary re-fetches
3. **Player Filtering**: Limited to top 120 results for performance
4. **Memoization**: Use `useMemo` for expensive calculations (sorting, filtering)
5. **Debouncing**: Search inputs debounced (future enhancement)

---

## Footer Attribution
Every page must include:
```tsx
<footer className="text-center text-gray-500 py-8">
  Created by <span className="font-semibold text-purple-600">@FPL_Dave_</span>
</footer>
```

---

## Testing Strategy

### Manual Testing Checklist:
- [ ] Load bootstrap data successfully
- [ ] Search and filter players
- [ ] Load FPL team by manager ID
- [ ] Transfer validation works correctly
- [ ] Formation auto-detection works
- [ ] Export generates PNG file
- [ ] CORS proxy fallbacks work
- [ ] All navigation links work
- [ ] Mobile responsive layout
- [ ] Player photos load with fallbacks

### Common Test Cases:
- **Manager ID**: 4809216 (test with real FPL team)
- **Gameweek**: 27 or 28 (current season)
- **Player Search**: "Salah", "Haaland", "Palmer"
- **Position Filter**: GKP, DEF, MID, FWD, ALL

---

## Future Enhancements

### Potential Features:
- [ ] Injury and suspension indicators
- [ ] Double gameweek highlighting
- [ ] Player comparison (3+ players)
- [ ] Historical performance charts (Recharts)
- [ ] Team strength analysis
- [ ] Wildcard planner
- [ ] Chip usage tracker
- [ ] Price change predictions
- [ ] Differential finder (low ownership gems)
- [ ] Custom player notes/tags
- [ ] Save/load custom teams (localStorage)
- [ ] Gameweek live scores

### Technical Improvements:
- [ ] Add Supabase for persistent storage
- [ ] Implement debounced search
- [ ] Add React Query for caching
- [ ] Optimize bundle size
- [ ] Add unit tests (Vitest)
- [ ] Add E2E tests (Playwright)
- [ ] Implement service worker for offline mode
- [ ] Add PWA manifest

---

**Last Updated**: February 26, 2026
**Status**: Production-ready, fully functional
**Creator**: @FPL_Dave_
