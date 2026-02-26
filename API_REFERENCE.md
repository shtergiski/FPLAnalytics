# FPL API Reference

Complete documentation for the official Fantasy Premier League API endpoints used in this dashboard.

## Base URL

```
https://fantasy.premierleague.com/api
```

⚠️ **CORS Note**: The FPL API does not set CORS headers. Direct browser requests may fail. This dashboard includes fallback mock data.

---

## Endpoints

### 1. Bootstrap Static

**GET** `/bootstrap-static/`

Returns all static game data including players, teams, gameweeks, and element types.

**Response Structure**:
```json
{
  "events": [...],          // Gameweeks
  "teams": [...],          // Premier League teams
  "elements": [...],       // All players
  "element_types": [...]   // Position types (GK, DEF, MID, FWD)
}
```

**Example Request**:
```typescript
const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
const data = await response.json();
```

#### Events (Gameweeks)

```typescript
interface Event {
  id: number;                    // Gameweek number
  name: string;                  // "Gameweek 1"
  deadline_time: string;         // ISO timestamp
  finished: boolean;             // Has GW finished?
  is_current: boolean;          // Is this the current GW?
  is_next: boolean;             // Is this the next GW?
  average_entry_score: number;   // Average points this GW
  highest_score: number;         // Highest points this GW
}
```

**Example**:
```json
{
  "id": 1,
  "name": "Gameweek 1",
  "deadline_time": "2024-08-16T17:30:00Z",
  "finished": true,
  "is_current": false,
  "is_next": false,
  "average_entry_score": 62,
  "highest_score": 128
}
```

#### Teams

```typescript
interface Team {
  id: number;                    // Team ID (1-20)
  name: string;                  // "Manchester City"
  short_name: string;            // "MCI"
  strength: number;              // Overall strength (1-5)
  strength_overall_home: number; // Home strength
  strength_overall_away: number; // Away strength
  strength_attack_home: number;  // Attack rating (home)
  strength_attack_away: number;  // Attack rating (away)
  strength_defence_home: number; // Defence rating (home)
  strength_defence_away: number; // Defence rating (away)
}
```

**Example**:
```json
{
  "id": 1,
  "name": "Arsenal",
  "short_name": "ARS",
  "strength": 5,
  "strength_overall_home": 1350,
  "strength_overall_away": 1320,
  "strength_attack_home": 1340,
  "strength_attack_away": 1310,
  "strength_defence_home": 1360,
  "strength_defence_away": 1330
}
```

#### Elements (Players)

```typescript
interface Player {
  id: number;                    // Unique player ID
  web_name: string;              // Display name ("Haaland")
  first_name: string;
  second_name: string;
  team: number;                  // Team ID (1-20)
  element_type: number;          // Position (1=GK, 2=DEF, 3=MID, 4=FWD)
  
  // Pricing
  now_cost: number;              // Current price (in 0.1m, e.g., 150 = £15.0m)
  cost_change_start: number;     // Price change since start (0.1m)
  cost_change_event: number;     // Price change this GW (0.1m)
  
  // Performance
  form: string;                  // Points per game (last 5)
  points_per_game: string;       // Season average PPG
  total_points: number;          // Total points this season
  event_points: number;          // Points in last GW
  
  // Stats
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;                   // Bonus Points System score
  
  // Advanced Metrics
  influence: string;             // ICT Index component
  creativity: string;            // ICT Index component
  threat: string;                // ICT Index component
  ict_index: string;             // Combined ICT score
  
  // Expected Stats (xG/xA)
  expected_goals: string;        // xG
  expected_assists: string;      // xA
  expected_goal_involvements: string; // xGI
  expected_goals_conceded: string;    // xGC
  
  // Availability
  status: string;                // "a" = available, "d" = doubtful, "i" = injured, "u" = unavailable
  news: string;                  // Injury/suspension news
  news_added: string;            // Timestamp of news
  chance_of_playing_next_round: number | null; // 0-100%
  chance_of_playing_this_round: number | null;
  
  // Ownership
  selected_by_percent: string;   // "25.4" = 25.4% ownership
  transfers_in_event: number;    // Transfers in this GW
  transfers_out_event: number;   // Transfers out this GW
  
  // Other
  minutes: number;               // Total minutes played
  in_dreamteam: boolean;         // In this GW's dream team?
  dreamteam_count: number;       // Times in dream team
  special: boolean;              // Special player?
  squad_number: number | null;   // Squad number
}
```

**Example**:
```json
{
  "id": 354,
  "web_name": "Haaland",
  "first_name": "Erling",
  "second_name": "Haaland",
  "team": 11,
  "element_type": 4,
  "now_cost": 150,
  "form": "8.5",
  "points_per_game": "7.2",
  "total_points": 252,
  "goals_scored": 27,
  "assists": 5,
  "ict_index": "312.8",
  "expected_goals": "24.56",
  "expected_assists": "4.89",
  "selected_by_percent": "58.3",
  "status": "a"
}
```

#### Element Types (Positions)

```typescript
interface ElementType {
  id: number;                    // 1=GK, 2=DEF, 3=MID, 4=FWD
  singular_name: string;         // "Goalkeeper"
  singular_name_short: string;   // "GKP"
  plural_name: string;           // "Goalkeepers"
  plural_name_short: string;     // "GKP"
  squad_select: number;          // Max in squad
  squad_min_select: number;      // Min in squad
  squad_max_select: number;      // Max in squad
}
```

**Example**:
```json
{
  "id": 4,
  "singular_name": "Forward",
  "singular_name_short": "FWD",
  "plural_name": "Forwards",
  "plural_name_short": "FWD",
  "squad_select": 3,
  "squad_min_select": 1,
  "squad_max_select": 3
}
```

---

### 2. Fixtures

**GET** `/fixtures/`

Returns all fixtures for the season.

**GET** `/fixtures/?event={gameweek}`

Returns fixtures for a specific gameweek.

**Response Structure**:
```typescript
interface Fixture {
  id: number;                    // Unique fixture ID
  event: number;                 // Gameweek number
  finished: boolean;             // Has match finished?
  kickoff_time: string;          // ISO timestamp
  started: boolean;              // Has match started?
  
  // Teams
  team_h: number;                // Home team ID
  team_a: number;                // Away team ID
  
  // Scores
  team_h_score: number | null;   // Home score
  team_a_score: number | null;   // Away score
  
  // Difficulty (1-5, 1=easiest)
  team_h_difficulty: number;     // Difficulty for home team
  team_a_difficulty: number;     // Difficulty for away team
  
  // Stats
  stats: FixtureStat[];          // Detailed match stats
}

interface FixtureStat {
  identifier: string;            // "goals_scored", "assists", etc.
  h: FixtureStatValue[];        // Home team stats
  a: FixtureStatValue[];        // Away team stats
}

interface FixtureStatValue {
  value: number;
  element: number;               // Player ID
}
```

**Example Request**:
```typescript
// Get all fixtures
const allFixtures = await fetch('https://fantasy.premierleague.com/api/fixtures/');

// Get GW1 fixtures
const gw1 = await fetch('https://fantasy.premierleague.com/api/fixtures/?event=1');
```

**Example Response**:
```json
{
  "id": 1,
  "event": 1,
  "finished": true,
  "kickoff_time": "2024-08-16T19:00:00Z",
  "team_h": 1,
  "team_a": 14,
  "team_h_score": 2,
  "team_a_score": 1,
  "team_h_difficulty": 3,
  "team_a_difficulty": 4,
  "stats": [
    {
      "identifier": "goals_scored",
      "h": [
        { "value": 1, "element": 354 },
        { "value": 1, "element": 355 }
      ],
      "a": [
        { "value": 1, "element": 123 }
      ]
    }
  ]
}
```

---

### 3. Player Details

**GET** `/element-summary/{player_id}/`

Returns detailed information for a specific player.

**Response Structure**:
```typescript
interface PlayerSummary {
  fixtures: PlayerFixture[];     // Upcoming fixtures
  history: PlayerHistory[];      // Historical gameweek performance
  history_past: PlayerSeasonHistory[]; // Past seasons
}

interface PlayerFixture {
  id: number;                    // Fixture ID
  event: number;                 // Gameweek
  kickoff_time: string;
  team_h: number;
  team_a: number;
  is_home: boolean;
  difficulty: number;            // FDR (1-5)
}

interface PlayerHistory {
  element: number;               // Player ID
  fixture: number;               // Fixture ID
  opponent_team: number;
  total_points: number;          // Points scored this GW
  was_home: boolean;
  kickoff_time: string;
  round: number;                 // Gameweek
  
  // Performance
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  
  // Advanced
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  value: number;                 // Price at that GW (0.1m)
  transfers_balance: number;     // Net transfers
  selected: number;              // Times selected
  transfers_in: number;
  transfers_out: number;
}

interface PlayerSeasonHistory {
  season_name: string;           // "2023/24"
  element_code: number;
  start_cost: number;            // Starting price
  end_cost: number;              // Ending price
  total_points: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
}
```

**Example Request**:
```typescript
// Get Haaland's (ID 354) details
const response = await fetch('https://fantasy.premierleague.com/api/element-summary/354/');
const data = await response.json();

// Upcoming fixtures
console.log(data.fixtures);

// Last 5 gameweeks
console.log(data.history.slice(-5));
```

---

### 4. User Team

**GET** `/entry/{team_id}/`

Returns information about a specific user's team.

**Response Structure**:
```typescript
interface UserTeam {
  id: number;                    // Team ID
  player_first_name: string;
  player_last_name: string;
  name: string;                  // Team name
  
  // Rankings
  summary_overall_rank: number;
  summary_overall_points: number;
  summary_event_rank: number;
  summary_event_points: number;
  
  // Gameweek
  current_event: number;
  
  // Squad
  leagues: {
    classic: League[];
    h2h: League[];
  };
}

interface League {
  id: number;
  name: string;
  short_name: string;
  created: string;
  rank: number;
  entry_rank: number;
  entry_last_rank: number;
}
```

**GET** `/entry/{team_id}/event/{gameweek}/picks/`

Returns the user's team selection for a specific gameweek.

**Response Structure**:
```typescript
interface TeamPicks {
  active_chip: string | null;    // "wildcard", "freehit", etc.
  automatic_subs: AutoSub[];
  entry_history: {
    event: number;
    points: number;
    total_points: number;
    rank: number;
    rank_sort: number;
    overall_rank: number;
    bank: number;                // Remaining budget (0.1m)
    value: number;               // Team value (0.1m)
    event_transfers: number;
    event_transfers_cost: number;
    points_on_bench: number;
  };
  picks: Pick[];
}

interface Pick {
  element: number;               // Player ID
  position: number;              // Position in team (1-15)
  is_captain: boolean;
  is_vice_captain: boolean;
  multiplier: number;            // Points multiplier (2 for captain)
}

interface AutoSub {
  entry: number;
  element_in: number;            // Player subbed in
  element_out: number;           // Player subbed out
  event: number;
}
```

**Example Request**:
```typescript
// Get team 123456's GW1 picks
const response = await fetch('https://fantasy.premierleague.com/api/entry/123456/event/1/picks/');
const data = await response.json();

console.log(data.picks); // Starting 11 + bench
console.log(data.entry_history.total_points); // Total points
```

---

### 5. Live Gameweek Data

**GET** `/event/{gameweek}/live/`

Returns live data for all players in a specific gameweek.

**Response Structure**:
```typescript
interface LiveGameweek {
  elements: {
    [playerId: string]: LivePlayerData;
  };
}

interface LivePlayerData {
  id: number;
  stats: {
    minutes: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    goals_conceded: number;
    own_goals: number;
    penalties_saved: number;
    penalties_missed: number;
    yellow_cards: number;
    red_cards: number;
    saves: number;
    bonus: number;
    bps: number;
    influence: string;
    creativity: string;
    threat: string;
    ict_index: string;
    total_points: number;
    in_dreamteam: boolean;
  };
  explain: {
    fixture: number;
    stats: ExplainStat[];
  }[];
}

interface ExplainStat {
  identifier: string;            // "minutes", "goals_scored", etc.
  points: number;                // Points from this stat
  value: number;                 // Stat value
}
```

**Example Request**:
```typescript
// Get live data for GW1
const response = await fetch('https://fantasy.premierleague.com/api/event/1/live/');
const data = await response.json();

// Get Haaland's live stats
const haalandLive = data.elements['354'];
console.log(haalandLive.stats.total_points);
```

---

## Data Calculations

### Fixture Difficulty Rating (FDR)

FDR is calculated based on opponent strength:

```typescript
function calculateFDR(opponentStrength: number): number {
  // FPL uses strength ratings (800-1400)
  // We normalize to 1-5 scale
  
  if (opponentStrength >= 1350) return 5; // Very Hard
  if (opponentStrength >= 1300) return 4; // Hard
  if (opponentStrength >= 1200) return 3; // Medium
  if (opponentStrength >= 1100) return 2; // Easy
  return 1; // Very Easy
}
```

### ICT Index

ICT combines three metrics:
- **Influence**: Impact on match result
- **Creativity**: Chance creation
- **Threat**: Goal threat

```typescript
function calculateICT(player: Player): number {
  const influence = parseFloat(player.influence);
  const creativity = parseFloat(player.creativity);
  const threat = parseFloat(player.threat);
  
  return influence + creativity + threat;
}
```

### Expected Points (xP)

Simplified xP calculation:

```typescript
function calculateExpectedPoints(player: Player, fixtures: Fixture[]): number {
  const xG = parseFloat(player.expected_goals);
  const xA = parseFloat(player.expected_assists);
  const avgMinutes = player.minutes / fixtures.length;
  
  // Points per goal/assist vary by position
  const pointsPerGoal = player.element_type === 2 ? 6 : player.element_type === 3 ? 5 : 4;
  const pointsPerAssist = 3;
  
  const xPoints = (xG * pointsPerGoal) + (xA * pointsPerAssist);
  
  // Factor in fixture difficulty
  const avgFDR = fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length;
  const fdrMultiplier = 1 + ((3 - avgFDR) * 0.2); // Easier fixtures = higher multiplier
  
  return xPoints * fdrMultiplier * (avgMinutes / 90);
}
```

---

## Rate Limits

The FPL API has no official rate limits, but be respectful:

- **Recommended**: Cache bootstrap-static (updates once per day)
- **Live data**: Fetch every 5+ minutes during active gameweeks
- **Fixtures**: Cache until deadline

```typescript
// Simple cache implementation
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const cache = new Map<string, { data: any; timestamp: number }>();

async function fetchWithCache<T>(endpoint: string): Promise<T> {
  const cached = cache.get(endpoint);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await fetchFPL<T>(endpoint);
  cache.set(endpoint, { data, timestamp: Date.now() });
  return data;
}
```

---

## Error Handling

```typescript
async function safeFetch<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${FPL_API_BASE}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    return fallback;
  }
}
```

---

## CORS Workaround

### Option 1: Use a Proxy

```typescript
const PROXY = 'https://corsproxy.io/?';
const url = `${PROXY}${FPL_API_BASE}/bootstrap-static/`;
```

### Option 2: Backend Proxy

Create a simple Node.js proxy:

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

app.get('/api/*', async (req, res) => {
  const fplUrl = `https://fantasy.premierleague.com${req.path}`;
  const response = await fetch(fplUrl);
  const data = await response.json();
  res.json(data);
});

app.listen(3001);
```

### Option 3: Mock Data (Dashboard Default)

The dashboard falls back to realistic mock data when API requests fail.

---

## Example: Complete Bootstrap Flow

```typescript
// Load all initial data
async function initializeFPLData() {
  try {
    // 1. Fetch bootstrap data
    const bootstrap = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
    const data = await bootstrap.json();
    
    // 2. Store in Zustand
    useFPLStore.getState().setPlayers(data.elements);
    useFPLStore.getState().setTeams(data.teams);
    
    // 3. Find current gameweek
    const currentGW = data.events.find(e => e.is_current);
    useFPLStore.getState().setCurrentGW(currentGW.id);
    
    // 4. Fetch fixtures for next 5 GWs
    const fixtures = await Promise.all(
      [currentGW.id, currentGW.id + 1, currentGW.id + 2, currentGW.id + 3, currentGW.id + 4]
        .map(gw => fetch(`https://fantasy.premierleague.com/api/fixtures/?event=${gw}`))
    );
    
    console.log('FPL data loaded successfully');
  } catch (error) {
    console.error('Failed to load FPL data, using mocks');
    loadMockData();
  }
}
```

---

## Resources

- **Official FPL**: https://fantasy.premierleague.com
- **API Docs**: No official docs, reverse-engineered by community
- **Community**: r/FantasyPL on Reddit
- **Tools**: https://www.livefpl.net, https://fplreview.com

---

**Last Updated**: February 2026  
**Maintained by**: @FPL_Dave_
