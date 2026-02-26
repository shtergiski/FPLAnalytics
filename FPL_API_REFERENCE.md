# FPL API Reference Guide

## Official FPL API Endpoints

The Fantasy Premier League provides several public API endpoints for accessing game data. No authentication required.

---

## 1. Bootstrap-Static (Master Data)

**Endpoint**: `https://fantasy.premierleague.com/api/bootstrap-static/`

**Description**: The main endpoint containing all static game data.

**Response Structure**:
```json
{
  "events": [...],        // Gameweeks
  "teams": [...],         // Premier League teams
  "elements": [...],      // All players
  "element_stats": [...], // Player stat categories
  "element_types": [...]  // Position types (GK, DEF, MID, FWD)
}
```

### Key Data Objects

#### Events (Gameweeks)
```json
{
  "id": 27,
  "name": "Gameweek 27",
  "deadline_time": "2024-03-02T11:00:00Z",
  "finished": false,
  "is_current": true,
  "is_next": false
}
```

#### Teams
```json
{
  "id": 1,
  "name": "Arsenal",
  "short_name": "ARS",
  "strength": 5,
  "strength_overall_home": 1300,
  "strength_overall_away": 1290,
  "strength_attack_home": 1320,
  "strength_attack_away": 1280,
  "strength_defence_home": 1290,
  "strength_defence_away": 1310
}
```

#### Elements (Players)
```json
{
  "id": 302,
  "first_name": "Cole",
  "second_name": "Palmer",
  "web_name": "Palmer",
  "team": 8,
  "element_type": 3,          // 1=GK, 2=DEF, 3=MID, 4=FWD
  "now_cost": 112,            // Price in tenths (£11.2m)
  "cost_change_start": 22,    // Change since season start
  "selected_by_percent": "58.2",
  "form": "9.2",
  "points_per_game": "8.5",
  "total_points": 245,
  "goals_scored": 15,
  "assists": 12,
  "clean_sheets": 8,
  "bonus": 28,
  "bps": 845,                 // Bonus Points System score
  "influence": "1245.6",
  "creativity": "1568.2",
  "threat": "1789.4",
  "ict_index": "458.2",       // ICT Index
  "expected_goals": "14.5",
  "expected_assists": "11.8",
  "expected_goal_involvements": "26.3",
  "expected_goals_conceded": "0",
  "status": "a",              // a=available, i=injured, d=doubtful, s=suspended
  "news": "",
  "photo": "302.jpg"
}
```

---

## 2. Fixtures

**Endpoint**: `https://fantasy.premierleague.com/api/fixtures/`

**Description**: All fixtures with difficulty ratings.

**Response Structure**:
```json
[
  {
    "id": 234,
    "event": 27,                    // Gameweek number
    "team_h": 13,                   // Home team ID
    "team_a": 3,                    // Away team ID
    "team_h_score": null,           // Score (null if not played)
    "team_a_score": null,
    "team_h_difficulty": 2,         // Difficulty rating 1-5
    "team_a_difficulty": 4,
    "kickoff_time": "2024-03-02T12:30:00Z",
    "finished": false,
    "started": false
  }
]
```

### Fixture Difficulty Rating (FDR)
- **1**: Very Easy (Bright Green)
- **2**: Easy (Lime Green)
- **3**: Medium (Yellow)
- **4**: Hard (Coral Red)
- **5**: Very Hard (Bright Red)

---

## 3. Player Detailed Stats

**Endpoint**: `https://fantasy.premierleague.com/api/element-summary/{player_id}/`

**Description**: Detailed statistics for a specific player.

**Example**: `https://fantasy.premierleague.com/api/element-summary/302/`

**Response Structure**:
```json
{
  "fixtures": [
    {
      "event": 27,
      "opponent": 3,
      "difficulty": 2,
      "is_home": true
    }
  ],
  "history": [
    {
      "round": 26,
      "total_points": 12,
      "goals_scored": 2,
      "assists": 1,
      "bonus": 3
    }
  ],
  "history_past": [...]  // Previous seasons
}
```

---

## 4. Live Gameweek Data

**Endpoint**: `https://fantasy.premierleague.com/api/event/{gw}/live/`

**Description**: Live player performance for a specific gameweek.

**Example**: `https://fantasy.premierleague.com/api/event/27/live/`

**Response Structure**:
```json
{
  "elements": [
    {
      "id": 302,
      "stats": {
        "minutes": 90,
        "goals_scored": 2,
        "assists": 1,
        "clean_sheets": 0,
        "goals_conceded": 1,
        "bonus": 3,
        "bps": 56,
        "total_points": 16
      }
    }
  ]
}
```

---

## 5. User Team Data

**Endpoint**: `https://fantasy.premierleague.com/api/entry/{team_id}/`

**Description**: Information about a specific FPL team.

**Example**: `https://fantasy.premierleague.com/api/entry/123456/`

**Response Structure**:
```json
{
  "id": 123456,
  "player_first_name": "John",
  "player_last_name": "Doe",
  "name": "My FPL Team",
  "summary_overall_rank": 45782,
  "summary_overall_points": 1456,
  "current_event": 27,
  "favourite_team": 1
}
```

---

## 6. User's Gameweek Picks

**Endpoint**: `https://fantasy.premierleague.com/api/entry/{team_id}/event/{gw}/picks/`

**Description**: A team's picks for a specific gameweek.

**Example**: `https://fantasy.premierleague.com/api/entry/123456/event/27/picks/`

**Response Structure**:
```json
{
  "active_chip": null,
  "automatic_subs": [],
  "entry_history": {
    "event": 27,
    "points": 67,
    "total_points": 1523,
    "rank": 43521,
    "bank": 15,              // Money in bank (tenths)
    "value": 1020,           // Team value (tenths)
    "event_transfers": 1,
    "event_transfers_cost": 0
  },
  "picks": [
    {
      "element": 302,        // Player ID
      "position": 1,         // Position in formation (1-15)
      "multiplier": 2,       // Captain = 2, Vice = 1, Bench = 0
      "is_captain": true,
      "is_vice_captain": false
    }
  ]
}
```

---

## 7. Manager History

**Endpoint**: `https://fantasy.premierleague.com/api/entry/{team_id}/history/`

**Description**: Full season and past season history for a manager.

**Response Structure**:
```json
{
  "current": [
    {
      "event": 27,
      "points": 67,
      "total_points": 1523,
      "rank": 43521,
      "bank": 15,
      "value": 1020,
      "event_transfers": 1,
      "event_transfers_cost": 0
    }
  ],
  "past": [...]  // Previous seasons
}
```

---

## Usage in Your App

### Fetching Bootstrap Data
```typescript
async function fetchBootstrapData() {
  const response = await fetch(
    'https://fantasy.premierleague.com/api/bootstrap-static/'
  );
  const data = await response.json();
  
  return {
    players: data.elements,
    teams: data.teams,
    events: data.events,
    currentGW: data.events.find(e => e.is_current)?.id
  };
}
```

### Getting Player Fixtures
```typescript
async function getPlayerFixtures(playerId: number) {
  const response = await fetch(
    `https://fantasy.premierleague.com/api/element-summary/${playerId}/`
  );
  const data = await response.json();
  
  return data.fixtures.slice(0, 5); // Next 5 fixtures
}
```

### Calculating Average FDR
```typescript
function calculateAverageFDR(fixtures: Fixture[]) {
  if (fixtures.length === 0) return 0;
  
  const total = fixtures.reduce((sum, f) => sum + f.difficulty, 0);
  return total / fixtures.length;
}
```

---

## Rate Limits

- No official rate limit published
- Recommended: Cache data and refresh every 5-10 minutes
- Avoid hammering the API with rapid requests

---

## CORS Considerations

The FPL API allows CORS requests, so you can call it directly from the browser.

If you encounter CORS issues, you can:
1. Use a CORS proxy (not recommended for production)
2. Set up a backend server to proxy requests
3. Use serverless functions (Vercel, Netlify)

---

## Data Update Frequency

- **Bootstrap-Static**: Updates after every gameweek
- **Fixtures**: Updates as fixtures are added/changed
- **Live Data**: Updates every 30-60 seconds during matches
- **Player Stats**: Updates after each match is completed

---

## Tips & Best Practices

1. **Cache Everything**: Store bootstrap-static data locally
2. **Combine Data**: Join players + teams + fixtures for rich UX
3. **Handle Errors**: API can be slow during gameweek deadlines
4. **Mock Data**: Always have fallback data for development
5. **Optimize Requests**: Fetch once, compute locally

---

## Example: Complete Data Flow

```typescript
// 1. Fetch all base data on app load
const bootstrap = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
const fixtures = await fetch('https://fantasy.premierleague.com/api/fixtures/');

// 2. Store in state management (Zustand/Redux)
store.setPlayers(bootstrap.elements);
store.setTeams(bootstrap.teams);
store.setFixtures(fixtures);

// 3. Compute derived data locally
function getPlayerFixtures(playerId: number) {
  const player = store.players.find(p => p.id === playerId);
  const playerFixtures = store.fixtures.filter(f => 
    f.team_h === player.team || f.team_a === player.team
  );
  
  return playerFixtures.map(f => ({
    gameweek: f.event,
    opponent: getOpponent(f, player.team),
    difficulty: getDifficulty(f, player.team),
    isHome: f.team_h === player.team
  }));
}

// 4. Use in components
<FDRHeatmap fixtures={getPlayerFixtures(302)} />
```

---

## Additional Resources

- **FPL Website**: https://fantasy.premierleague.com
- **API Documentation**: No official docs (community-documented)
- **GitHub Repos**: Search for "fpl api" for community tools

---

## Legal Notice

The FPL API is provided by the Premier League for public use. Data should be used responsibly and in accordance with their terms of service. This app is for educational purposes.

---

**Happy Building!** 🚀

Created by @FPL_Dave_
