# FPL Analytics Dashboard - API Documentation

## Official FPL API

### Base URL
```
https://fantasy.premierleague.com/api/
```

**Important**: All requests MUST go through the CORS proxy system. Direct fetch will fail.

---

## Endpoints Used

### 1. Bootstrap Static Data
**Endpoint**: `/bootstrap-static/`
**Method**: GET
**Auth**: None (public)
**Response Size**: ~2MB JSON

**Contains**:
- `elements`: Array of all players (~650 players)
- `teams`: Array of all 20 Premier League teams
- `events`: Array of all 38 gameweeks
- `element_types`: Position types (GKP=1, DEF=2, MID=3, FWD=4)
- `element_stats`: Available stat categories
- `phases`: Season phases

**Usage**:
```typescript
const bootstrap = await FPLService.getBootstrap();
const players = bootstrap.elements;
const teams = bootstrap.teams;
const currentGW = bootstrap.events.find(e => e.is_current);
```

**Player Object Structure** (50+ fields):
```typescript
{
  id: 284,
  web_name: "Salah",
  first_name: "Mohamed",
  second_name: "Salah",
  element_type: 3,              // 1=GKP, 2=DEF, 3=MID, 4=FWD
  team: 10,                     // Team ID (Liverpool = 10)
  team_code: 14,                // For images/badges
  code: 223094,                 // Photo code (p223094.png)
  now_cost: 130,                // Price in £0.1m (130 = £13.0m)
  cost_change_start: 5,         // Price change since season start
  cost_change_event: 0,         // Price change this GW
  selected_by_percent: "45.6",  // Ownership %
  total_points: 234,
  event_points: 12,             // Points this GW
  points_per_game: "6.7",
  form: "7.8",                  // Recent form (last 5 GWs average)
  ep_next: "6.5",               // Expected points next GW
  ep_this: "7.2",               // Expected points this GW
  goals_scored: 18,
  assists: 12,
  clean_sheets: 9,
  goals_conceded: 28,
  bonus: 24,                    // Bonus points
  bps: 567,                     // Bonus points system score
  influence: "1234.5",          // ICT Index - Influence
  creativity: "987.6",          // ICT Index - Creativity
  threat: "1543.2",             // ICT Index - Threat
  ict_index: "123.4",           // Total ICT Index
  minutes: 2456,
  yellow_cards: 2,
  red_cards: 0,
  saves: 0,                     // GK only
  penalties_saved: 0,           // GK only
  penalties_missed: 1,
  own_goals: 0,
  dreamteam_count: 8,           // Times in Dream Team
  in_dreamteam: false,          // In this GW's Dream Team
  transfers_in: 123456,
  transfers_out: 98765,
  transfers_in_event: 45678,    // Transfers in this GW
  transfers_out_event: 23456,   // Transfers out this GW
  status: "a",                  // a=available, d=doubtful, i=injured, u=unavailable, s=suspended
  news: "",                     // Injury/suspension news
  news_added: null,             // Timestamp of news
  chance_of_playing_next_round: 100,  // 0-100 or null
  chance_of_playing_this_round: 100,
  // ... more fields
}
```

**Team Object Structure**:
```typescript
{
  id: 10,
  name: "Liverpool",
  short_name: "LIV",
  code: 14,                     // For images (t14.png)
  strength: 5,                  // Overall strength (1-5)
  strength_overall_home: 1380,
  strength_overall_away: 1340,
  strength_attack_home: 1390,
  strength_attack_away: 1340,
  strength_defence_home: 1370,
  strength_defence_away: 1340,
  pulse_id: 26,
  unavailable: false
}
```

**Event (Gameweek) Object Structure**:
```typescript
{
  id: 28,
  name: "Gameweek 28",
  deadline_time: "2026-03-14T10:30:00Z",
  finished: false,
  is_current: true,
  is_next: false,
  is_previous: false,
  data_checked: true,
  highest_scoring_entry: 4567890,
  highest_score: 134,
  average_entry_score: 52,
  chip_plays: [
    { chip_name: "wildcard", num_played: 12345 },
    { chip_name: "bboost", num_played: 8765 }
  ]
}
```

---

### 2. Fixtures
**Endpoint**: `/fixtures/`
**Method**: GET
**Auth**: None
**Response Size**: ~400KB JSON

**Returns**: Array of all 380 PL fixtures

**Fixture Object Structure**:
```typescript
{
  id: 234,
  code: 12345,
  event: 28,                    // Gameweek number
  finished: false,
  kickoff_time: "2026-03-14T15:00:00Z",
  team_h: 10,                   // Home team ID
  team_a: 3,                    // Away team ID
  team_h_score: null,           // Score (null if not finished)
  team_a_score: null,
  team_h_difficulty: 3,         // FDR for home team (1-5)
  team_a_difficulty: 4,         // FDR for away team (1-5)
  pulse_id: 123456,
  stats: [                      // Match stats (if finished)
    {
      identifier: "goals_scored",
      a: [{ element: 284, value: 1 }],  // Away team stats
      h: [{ element: 123, value: 2 }]   // Home team stats
    }
  ]
}
```

**Usage**:
```typescript
const fixtures = await FPLService.getFixtures();
const upcomingFixtures = fixtures.filter(f => !f.finished && f.event === 28);
const team10Fixtures = fixtures.filter(f => f.team_h === 10 || f.team_a === 10);
```

---

### 3. Manager Entry
**Endpoint**: `/entry/{manager_id}/`
**Method**: GET
**Auth**: None (public profiles only)

**Manager Object Structure**:
```typescript
{
  id: 4809216,
  joined_time: "2019-07-10T13:45:00Z",
  name: "FPL Dave's Team",
  player_first_name: "Dave",
  player_last_name: "Smith",
  player_region_name: "England",
  summary_overall_points: 1876,
  summary_overall_rank: 123456,
  summary_event_points: 67,
  summary_event_rank: 234567,
  current_event: 28,
  favourite_team: 10,           // Liverpool
  kit: null,
  last_deadline_bank: 15,       // Budget remaining (£1.5m)
  last_deadline_total_transfers: 24,
  last_deadline_value: 1015,    // Team value (£101.5m)
  name_change_blocked: false,
  entered_events: [1, 2, 3, ...], // GWs played
  leagues: {
    classic: [...],             // Classic leagues
    h2h: [...],                 // H2H leagues
    cup: {...}                  // Cup status
  }
}
```

**Usage**:
```typescript
const manager = await FPLService.getEntry(4809216);
console.log(`Team: ${manager.name}`);
console.log(`Rank: ${manager.summary_overall_rank}`);
console.log(`Points: ${manager.summary_overall_points}`);
```

---

### 4. Manager Picks (Team Selection)
**Endpoint**: `/entry/{manager_id}/event/{gameweek}/picks/`
**Method**: GET
**Auth**: None (public)

**Response Structure**:
```typescript
{
  active_chip: null,            // "wildcard", "bboost", "3xc", "freehit"
  automatic_subs: [             // Auto-subs made
    {
      entry: 1,
      element_in: 284,
      element_out: 123,
      event: 28
    }
  ],
  entry_history: {              // Manager's GW history
    event: 28,
    points: 67,
    total_points: 1876,
    rank: 123456,
    rank_sort: 123456,
    overall_rank: 123456,
    bank: 15,                   // Budget remaining (£1.5m)
    value: 1015,                // Team value (£101.5m)
    event_transfers: 1,
    event_transfers_cost: 4,    // Points deducted
    points_on_bench: 12
  },
  picks: [                      // The actual team
    {
      element: 284,             // Player ID
      position: 1,              // 1-15 (1-11 = starting, 12-15 = bench)
      multiplier: 2,            // 2=captain, 1=normal, 0=bench
      is_captain: true,
      is_vice_captain: false
    },
    {
      element: 123,
      position: 2,
      multiplier: 1,
      is_captain: false,
      is_vice_captain: true
    },
    // ... 13 more picks (15 total)
  ]
}
```

**Usage**:
```typescript
const teamData = await FPLService.getEntryPicks(4809216, 28);

// Get starting XI
const starters = teamData.picks
  .filter(p => p.position <= 11)
  .sort((a, b) => a.position - b.position);

// Get bench
const bench = teamData.picks
  .filter(p => p.position > 11)
  .sort((a, b) => a.position - b.position);

// Find captain
const captain = teamData.picks.find(p => p.is_captain);
```

---

## CORS Proxy System

### Implementation
**File**: `/src/app/utils/corsProxy.ts`

### Three-Tier Fallback
```typescript
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest='
];
```

### Retry Logic
- **Timeout**: 12 seconds per proxy
- **Strategy**: Try each proxy in sequence until one succeeds
- **Error Handling**: Accumulate errors, throw only if all fail

### Usage Pattern
```typescript
import { FPLService } from '../utils/corsProxy';

// ✅ Always use FPLService methods
const bootstrap = await FPLService.getBootstrap();
const fixtures = await FPLService.getFixtures();
const manager = await FPLService.getEntry(managerId);
const picks = await FPLService.getEntryPicks(managerId, gw);

// ❌ Never fetch directly
const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
```

### FPLService Methods
```typescript
interface FPLService {
  /**
   * Get all players, teams, and gameweeks
   * Response size: ~2MB
   */
  getBootstrap(): Promise<BootstrapData>;

  /**
   * Get all fixtures with FDR
   * Response size: ~400KB
   */
  getFixtures(): Promise<Fixture[]>;

  /**
   * Get manager profile and stats
   * @param managerId - FPL manager ID (e.g. 4809216)
   */
  getEntry(managerId: number): Promise<ManagerData>;

  /**
   * Get manager's team for specific gameweek
   * @param managerId - FPL manager ID
   * @param gameweek - Gameweek number (1-38)
   */
  getEntryPicks(managerId: number, gameweek: number): Promise<PicksData>;

  // Aliases
  getManager(managerId: number): Promise<ManagerData>;  // Same as getEntry
  getManagerTeam(managerId: number, gameweek: number): Promise<PicksData>;  // Same as getEntryPicks
}
```

---

## Error Handling

### Common Errors

#### 1. CORS Proxy Timeout
```typescript
Error: All CORS proxies failed
```
**Cause**: All three proxies timed out (>12s each)
**Solution**: 
- Show user-friendly message: "FPL API temporarily unavailable"
- Suggest trying again later
- May indicate FPL API itself is down

#### 2. 404 Manager Not Found
```typescript
Error: Manager not found (HTTP 404)
```
**Cause**: Invalid manager ID
**Solution**:
- Validate manager ID format (numeric)
- Show: "Manager ID not found. Please check and try again."

#### 3. 429 Rate Limited
```typescript
Error: Too Many Requests (HTTP 429)
```
**Cause**: FPL API rate limiting
**Solution**:
- Cache bootstrap data in Zustand store
- Don't refetch on every component mount
- Wait before retrying

#### 4. No Picks for Gameweek
```typescript
Error: Picks not available
```
**Cause**: Manager hasn't played that GW yet, or GW hasn't started
**Solution**:
- Implement GW fallback (try GW → GW-1 → GW-2)
- Show: "GW{X} picks not available. Showing GW{Y} instead."

### Error Handling Pattern
```typescript
try {
  setLoading(true);
  const data = await FPLService.getBootstrap();
  setBootstrapData(data);
  setError('');
} catch (error) {
  console.error('Failed to fetch:', error);
  
  // User-friendly error message
  if (error.message?.includes('CORS proxies failed')) {
    setError('⚠️ FPL API temporarily unavailable. Please try again later.');
  } else if (error.message?.includes('404')) {
    setError('❌ Manager ID not found. Please check the ID and try again.');
  } else if (error.message?.includes('429')) {
    setError('⚠️ Too many requests. Please wait a moment and try again.');
  } else {
    setError('❌ Failed to load data. Please refresh the page.');
  }
} finally {
  setLoading(false);
}
```

---

## Data Transformation Examples

### Get Player by ID
```typescript
const getPlayerById = (id: number): Player | undefined => {
  return bootstrap?.elements.find(p => p.id === id);
};
```

### Get Team by ID
```typescript
const getTeamById = (id: number): Team | undefined => {
  return bootstrap?.teams.find(t => t.id === id);
};
```

### Convert Element Type to Position
```typescript
const getPosition = (elementType: number): 'GKP' | 'DEF' | 'MID' | 'FWD' => {
  const posMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
  return posMap[elementType as keyof typeof posMap];
};
```

### Get Player's Next Fixtures
```typescript
const getPlayerFixtures = (player: Player, count: number = 5): Fixture[] => {
  return fixtures
    .filter(f => !f.finished && (f.team_h === player.team || f.team_a === player.team))
    .slice(0, count);
};
```

### Calculate FDR for Player
```typescript
const getPlayerFDR = (player: Player, fixture: Fixture): number => {
  if (fixture.team_h === player.team) {
    return fixture.team_h_difficulty;
  } else {
    return fixture.team_a_difficulty;
  }
};
```

### Format Price
```typescript
const formatPrice = (nowCost: number): string => {
  return `£${(nowCost / 10).toFixed(1)}m`;
};

// Example: 130 → "£13.0m"
```

### Calculate Ownership
```typescript
const formatOwnership = (selectedByPercent: string): string => {
  return `${parseFloat(selectedByPercent).toFixed(1)}%`;
};

// Example: "45.632" → "45.6%"
```

---

## Rate Limiting & Caching

### FPL API Limits
- **Documented limit**: None officially published
- **Observed behavior**: ~100 requests/minute per IP
- **Recommendation**: Cache heavily, avoid unnecessary refetches

### Caching Strategy
```typescript
// 1. Store bootstrap data in Zustand (global state)
const { bootstrap, fetchBootstrapData } = useFPLStore();

// 2. Only fetch if not already loaded
useEffect(() => {
  if (!bootstrap) {
    fetchBootstrapData();
  }
}, [bootstrap, fetchBootstrapData]);

// 3. Don't refetch on every render
```

### Cache Invalidation
- **Bootstrap data**: Refresh when new GW starts (weekly)
- **Fixtures**: Refresh when GW finishes (weekly)
- **Manager picks**: Refresh per GW or on user request
- **Future enhancement**: Add timestamps + TTL

---

## Testing with Mock Data

### Mock Manager IDs
```typescript
// Popular FPL managers (public profiles)
const TEST_MANAGERS = {
  fpldave: 4809216,
  fplgeneral: 76862,    // FPL General (YouTuber)
  fplmate: 211862,      // FPL Mate
  letsgochamp: 2523,    // Let's Go Champ
};
```

### Mock Player IDs
```typescript
const POPULAR_PLAYERS = {
  salah: 284,
  haaland: 490,
  palmer: 361,
  saka: 277,
  trent: 114,
  areola: 123,
};
```

---

## Image CDN URLs

### Player Photos
```
https://resources.premierleague.com/premierleague/photos/players/{size}/p{code}.png

Sizes: 110x140, 250x250
Code: player.code field
Example: p223094.png (Salah)
```

### Team Badges
```
https://resources.premierleague.com/premierleague/badges/{size}/t{code}.png

Sizes: 70, 250
Code: team.code or player.team_code
Example: t14.png (Liverpool)
```

### Team Kits
```
https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_{code}_{type}-220.webp

Code: team.code or player.team_code
Type: 1 (outfield), 5 (goalkeeper)
Example: shirt_14_1-220.webp (Liverpool outfield kit)
```

### CORS Handling for Images
**Issue**: `resources.premierleague.com` doesn't always send CORS headers
**Solution**: Use three-tier fallback
```tsx
<img
  src={playerPhotoUrl}
  onError={(e) => {
    e.currentTarget.src = teamBadgeUrl;  // Fallback 1
    e.currentTarget.onerror = () => {
      e.currentTarget.style.display = 'none';  // Fallback 2
    };
  }}
/>
```

---

## API Response Times

### Typical Response Times (with CORS proxy)
- Bootstrap Static: 1-3 seconds (~2MB)
- Fixtures: 0.5-1.5 seconds (~400KB)
- Manager Entry: 0.3-1 second (~10KB)
- Manager Picks: 0.3-1 second (~5KB)

### Timeout Configuration
```typescript
const TIMEOUT = 12000; // 12 seconds per proxy
```

---

## Future API Enhancements

### Potential Endpoints (not currently used)
- `/element-summary/{player_id}/` - Detailed player history
- `/leagues-classic/{league_id}/standings/` - League standings
- `/leagues-h2h/{league_id}/standings/` - H2H league standings
- `/entry/{manager_id}/history/` - Manager's full season history
- `/entry/{manager_id}/transfers/` - Transfer history
- `/dream-team/{gameweek}/` - Dream Team for GW
- `/entry/{manager_id}/cup/` - Cup status

---

**Last Updated**: February 26, 2026
**Maintained By**: @FPL_Dave_
