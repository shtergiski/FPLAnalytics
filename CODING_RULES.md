# FPL Analytics Dashboard - Coding Rules & Standards

## File Organization

### Component Files
```
✅ CORRECT:
/src/app/components/MyComponent.tsx          # PascalCase, descriptive
/src/app/components/builders/TeamBuilder.tsx # Grouped by feature
/src/app/components/ui/button.tsx            # lowercase for primitives

❌ WRONG:
/src/app/components/my-component.tsx         # kebab-case (use PascalCase)
/src/app/components/MyComponent.js           # .js (always use .tsx)
/src/app/MyComponent.tsx                     # Wrong directory
```

### Import Order
```typescript
// 1. React & React ecosystem
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

// 2. Third-party libraries
import { Search, X, Download } from 'lucide-react';

// 3. Internal components (UI first, then features)
import { Button } from './ui/button';
import { Card } from './ui/card';
import { PlayerCombobox } from './ui/player-combobox';

// 4. Store & utils
import { useFPLStore } from '../store/fpl-store';
import { FPLService } from '../utils/corsProxy';

// 5. Types
import { Player, Team } from '../types/fpl';
```

---

## TypeScript Rules

### Strict Typing
```typescript
✅ CORRECT:
interface PlayerCardProps {
  player: Player;
  onSelect: (player: Player) => void;
  isSelected: boolean;
}

export function PlayerCard({ player, onSelect, isSelected }: PlayerCardProps) {
  // ...
}

❌ WRONG:
export function PlayerCard({ player, onSelect, isSelected }: any) {
  // Never use 'any'
}

export function PlayerCard(props: { player: any }) {
  // No inline types, create interface
}
```

### Type Inference
```typescript
✅ CORRECT - Let TypeScript infer:
const [count, setCount] = useState(0);  // Inferred as number
const players = bootstrap?.elements || [];  // Inferred as Player[]

✅ CORRECT - Explicit when needed:
const [player, setPlayer] = useState<Player | null>(null);
const [formData, setFormData] = useState<FormData>({ name: '', age: 0 });

❌ WRONG - Over-specifying:
const [count, setCount] = useState<number>(0);  // Unnecessary
```

### Enums vs Union Types
```typescript
✅ CORRECT - Use union types:
type Position = 'GKP' | 'DEF' | 'MID' | 'FWD';
type Formation = '3-4-3' | '3-5-2' | '4-3-3' | '4-4-2' | '4-5-1' | '5-3-2' | '5-4-1';

❌ WRONG - Avoid enums:
enum Position {
  GKP = 'GKP',
  DEF = 'DEF',
  // ...
}
```

---

## React Patterns

### Component Structure
```typescript
export function MyComponent() {
  // 1️⃣ Store hooks first
  const { bootstrap, fetchBootstrapData } = useFPLStore();
  
  // 2️⃣ Router hooks
  const navigate = useNavigate();
  
  // 3️⃣ Refs
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 4️⃣ State hooks (group by purpose)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  
  // 5️⃣ Derived state (useMemo)
  const sortedPlayers = useMemo(() => {
    return players.sort((a, b) => b.total_points - a.total_points);
  }, [players]);
  
  // 6️⃣ Effects
  useEffect(() => {
    if (!bootstrap) fetchBootstrapData();
  }, [bootstrap, fetchBootstrapData]);
  
  // 7️⃣ Event handlers
  const handleClick = () => {
    // ...
  };
  
  // 8️⃣ Render helpers (if needed)
  const renderPlayerCard = (player: Player) => {
    // ...
  };
  
  // 9️⃣ Return JSX
  return <div>...</div>;
}
```

### Functional Components Only
```typescript
✅ CORRECT:
export function MyComponent() {
  return <div>Content</div>;
}

❌ WRONG:
export class MyComponent extends React.Component {
  // No class components
}
```

### Props Destructuring
```typescript
✅ CORRECT:
export function PlayerCard({ player, onSelect }: PlayerCardProps) {
  return <div onClick={() => onSelect(player)}>...</div>;
}

❌ WRONG:
export function PlayerCard(props: PlayerCardProps) {
  return <div onClick={() => props.onSelect(props.player)}>...</div>;
}
```

---

## State Management

### When to Use Zustand Store
```typescript
✅ USE STORE FOR:
- API data (bootstrap, fixtures)
- Global app state
- Data shared across multiple pages
- Expensive-to-fetch data

✅ USE LOCAL STATE FOR:
- UI state (modals, dropdowns)
- Form inputs
- Component-specific data
- Temporary selections
```

### Store Pattern
```typescript
import { create } from 'zustand';

interface MyStoreState {
  data: DataType | null;
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

export const useMyStore = create<MyStoreState>((set) => ({
  data: null,
  loading: false,
  error: null,
  
  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const data = await FPLService.getBootstrap();
      set({ data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));
```

---

## API Calls

### CORS Proxy - ALWAYS
```typescript
✅ CORRECT:
import { FPLService } from '../utils/corsProxy';

const bootstrap = await FPLService.getBootstrap();
const fixtures = await FPLService.getFixtures();
const manager = await FPLService.getEntry(managerId);

❌ WRONG - Direct fetch will fail:
const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
```

### Error Handling
```typescript
✅ CORRECT:
try {
  setLoading(true);
  const data = await FPLService.getBootstrap();
  setPlayers(data.elements);
  setError('');
} catch (error) {
  console.error('Failed to fetch:', error);
  setError('⚠️ Failed to load data. Please try again later.');
} finally {
  setLoading(false);
}

❌ WRONG - No error handling:
const data = await FPLService.getBootstrap();
setPlayers(data.elements);
```

### Loading States
```typescript
✅ CORRECT:
{loading && (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
  </div>
)}

{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <p className="text-red-800">{error}</p>
  </div>
)}

{!loading && !error && (
  <div>{/* Actual content */}</div>
)}
```

---

## Styling (Tailwind CSS)

### Class Naming
```typescript
✅ CORRECT:
<div className="flex items-center justify-between gap-4">
  <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
    Click me
  </Button>
</div>

❌ WRONG - Custom CSS classes:
<div className="my-custom-flex-container">
  <Button className="purple-gradient-button">
    Click me
  </Button>
</div>
```

### Responsive Design
```typescript
✅ CORRECT:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
</div>

<div className="text-sm md:text-base lg:text-lg">
  {/* Responsive font size */}
</div>
```

### Color System
```typescript
✅ USE THEME COLORS:
- Primary gradient: from-cyan-400 to-purple-600
- Accent gradient: from-purple-600 to-pink-600
- Success: bg-green-500
- Warning: bg-yellow-500
- Error: bg-red-500

✅ FDR COLORS (never change):
- FDR 1: bg-emerald-600
- FDR 2: bg-green-500
- FDR 3: bg-yellow-500
- FDR 4: bg-orange-500
- FDR 5: bg-red-600

❌ DON'T USE:
- Random hex colors (#abcdef)
- Non-standard Tailwind colors
- Inline style colors
```

### Conditional Classes
```typescript
✅ CORRECT - Use template literals:
<div className={`
  rounded-lg p-4 
  ${isSelected ? 'bg-purple-100 border-purple-500' : 'bg-white border-gray-200'}
  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-400'}
`}>

✅ CORRECT - Use cn() utility:
import { cn } from '../utils/cn';

<div className={cn(
  "rounded-lg p-4",
  isSelected && "bg-purple-100 border-purple-500",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
```

---

## Component Patterns

### Button Usage
```typescript
✅ CORRECT:
import { Button } from './ui/button';
import { Download } from 'lucide-react';

<Button variant="default" onClick={handleClick}>
  <Download className="w-4 h-4 mr-2" />
  Download
</Button>

<Button variant="outline" size="sm">
  Cancel
</Button>

<Button variant="ghost" disabled={loading}>
  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
</Button>
```

### Card Usage
```typescript
✅ CORRECT:
import { Card } from './ui/card';

<Card className="p-6">
  <h3 className="text-lg font-bold mb-4">Title</h3>
  <p>Content</p>
</Card>

<Card className="p-6 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
  {/* Gradient card */}
</Card>
```

### Player Photo with Fallback
```typescript
✅ CORRECT - Three-tier fallback:
<img
  src={`https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.code}.png`}
  alt={player.web_name}
  className="w-20 h-20 rounded-full object-cover"
  onError={(e) => {
    // Fallback 1: Team badge
    e.currentTarget.src = `https://resources.premierleague.com/premierleague/badges/70/t${player.team_code}.png`;
    e.currentTarget.onerror = () => {
      // Fallback 2: Hide or show initials
      e.currentTarget.style.display = 'none';
    };
  }}
/>

❌ WRONG - No fallback:
<img src={playerPhotoUrl} alt={player.web_name} />
```

---

## FPL Business Logic

### Formation Validation
```typescript
✅ CORRECT - Official FPL rules:
const FPL_RULES = {
  GKP: { min: 1, max: 1 },  // Exactly 1 GK in starting XI
  DEF: { min: 3, max: 5 },
  MID: { min: 2, max: 5 },
  FWD: { min: 1, max: 3 },
};

const isValidFormation = (def: number, mid: number, fwd: number): boolean => {
  return (
    def >= 3 && def <= 5 &&
    mid >= 2 && mid <= 5 &&
    fwd >= 1 && fwd <= 3 &&
    def + mid + fwd === 10  // 10 outfield + 1 GK = 11
  );
};
```

### Squad Composition
```typescript
✅ CORRECT - Full squad rules:
const SQUAD_RULES = {
  total: 15,           // 15 players total
  starting: 11,        // 11 starters
  bench: 4,            // 4 subs
  GKP: 2,             // Exactly 2 GKP in squad
  DEF: 5,             // Exactly 5 DEF in squad
  MID: 5,             // Exactly 5 MID in squad
  FWD: 3,             // Exactly 3 FWD in squad
  maxPerTeam: 3,      // Max 3 from same team
  budget: 100,        // £100m total budget
};
```

### Transfer Validation
```typescript
✅ CORRECT - Comprehensive checks:
const validateTransfer = (playerIn: Player, playerOut: SquadPlayer) => {
  const errors: string[] = [];
  
  // 1. Budget check
  const priceDiff = (playerIn.now_cost - playerOut.now_cost) / 10;
  if (remainingBudget - priceDiff < 0) {
    errors.push(`Insufficient budget. Need £${Math.abs(remainingBudget - priceDiff).toFixed(1)}m more.`);
  }
  
  // 2. Squad composition check
  const newComposition = calculateNewComposition(playerIn, playerOut);
  if (newComposition.GKP !== 2) errors.push('Must have exactly 2 GKP');
  if (newComposition.DEF !== 5) errors.push('Must have exactly 5 DEF');
  if (newComposition.MID !== 5) errors.push('Must have exactly 5 MID');
  if (newComposition.FWD !== 3) errors.push('Must have exactly 3 FWD');
  
  // 3. Team limit check
  const newTeamCounts = calculateNewTeamCounts(playerIn, playerOut);
  if (newTeamCounts[playerIn.team] > 3) {
    errors.push(`Max 3 players from ${getTeamName(playerIn.team)}`);
  }
  
  return errors;
};
```

---

## Performance Rules

### Memoization
```typescript
✅ USE useMemo FOR:
- Expensive calculations
- Sorting/filtering large arrays
- Complex derivations

const sortedPlayers = useMemo(() => {
  return players
    .filter(p => p.total_points > 100)
    .sort((a, b) => b.total_points - a.total_points);
}, [players]);

❌ DON'T OVER-USE:
const name = useMemo(() => player.web_name, [player]);  // Unnecessary
```

### useCallback
```typescript
✅ USE useCallback FOR:
- Functions passed to child components
- Functions in dependency arrays

const handleSelect = useCallback((player: Player) => {
  setSelectedPlayer(player);
}, []);

❌ DON'T OVER-USE:
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);  // Simple functions don't need memoization
```

### List Rendering
```typescript
✅ CORRECT - Always use unique keys:
{players.map(player => (
  <PlayerCard key={player.id} player={player} />
))}

❌ WRONG - Index as key:
{players.map((player, index) => (
  <PlayerCard key={index} player={player} />
))}

❌ WRONG - No key:
{players.map(player => (
  <PlayerCard player={player} />
))}
```

---

## Error Handling

### User-Friendly Messages
```typescript
✅ CORRECT:
try {
  await FPLService.getBootstrap();
} catch (error) {
  if (error.message?.includes('CORS')) {
    setError('⚠️ FPL API temporarily unavailable. Please try again later.');
  } else if (error.message?.includes('404')) {
    setError('❌ Manager ID not found. Please check and try again.');
  } else {
    setError('❌ Failed to load data. Please refresh the page.');
  }
}

❌ WRONG:
try {
  await FPLService.getBootstrap();
} catch (error) {
  setError(error.message);  // Raw technical error
  alert('Error!');  // No context
}
```

### Console Logging
```typescript
✅ CORRECT - Structured logging:
console.log('✅ Successfully loaded FPL team:', {
  managerId,
  gameweek: actualGw,
  playerCount: picks.length
});

console.warn('⚠️ Canvas extraction failed, trying proxy fetch');

console.error('❌ Failed to export:', error);

❌ WRONG:
console.log('success');
console.log(data);
```

---

## Accessibility

### Semantic HTML
```typescript
✅ CORRECT:
<button onClick={handleClick}>Click me</button>
<nav>...</nav>
<main>...</main>
<footer>...</footer>

❌ WRONG:
<div onClick={handleClick}>Click me</div>
<div className="nav">...</div>
```

### Alt Text
```typescript
✅ CORRECT:
<img src={playerPhoto} alt={player.web_name} />
<img src={teamBadge} alt={`${team.name} badge`} />

❌ WRONG:
<img src={playerPhoto} alt="player" />
<img src={teamBadge} />
```

### Keyboard Navigation
```typescript
✅ CORRECT:
<button
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
>
  Click me
</button>

❌ WRONG:
<div onClick={handleClick}>Click me</div>  // Not keyboard accessible
```

---

## Comments & Documentation

### When to Comment
```typescript
✅ GOOD COMMENTS:
// FPL Rule: Must have exactly 1 GK in starting XI
if (starterGKCount !== 1) return false;

// Try current GW → GW-1 → GW-2 (fallback for unpublished GWs)
for (const gw of [targetGw, targetGw - 1, targetGw - 2]) {
  // ...
}

// Canvas extraction (Strategy 1): Fast but requires CORS headers
const dataUrl = await canvasExtraction(img);

❌ BAD COMMENTS:
// Set loading to true
setLoading(true);

// Loop through players
players.forEach(player => {
  // ...
});
```

### JSDoc for Complex Functions
```typescript
✅ CORRECT:
/**
 * Validates a proposed transfer against FPL rules
 * 
 * Checks:
 * - Budget constraints (£100m total)
 * - Squad composition (2-5-5-3)
 * - Team limits (max 3 per team)
 * 
 * @param playerIn - Player being transferred in
 * @param playerOut - Player being transferred out
 * @returns Array of error messages (empty if valid)
 */
const validateTransfer = (playerIn: Player, playerOut: SquadPlayer): string[] => {
  // ...
};
```

---

## Testing (Future)

### Testable Code
```typescript
✅ CORRECT - Pure functions:
export const calculateBudget = (players: Player[]): number => {
  return 100 - players.reduce((sum, p) => sum + p.now_cost / 10, 0);
};

// Easy to test:
expect(calculateBudget(mockPlayers)).toBe(15.5);

❌ WRONG - Side effects:
const calculateBudget = () => {
  const players = useFPLStore().players;  // Hard to test
  return 100 - players.reduce((sum, p) => sum + p.now_cost / 10, 0);
};
```

---

## Git Commit Messages (Future)

```
✅ GOOD:
feat: Add player comparison radar chart
fix: CORS proxy fallback for manager team load
refactor: Extract formation validation to utils
docs: Update API integration guide
style: Align player cards in grid layout

❌ BAD:
fixed bug
updates
wip
stuff
```

---

## Code Review Checklist

Before submitting code, verify:
- [ ] TypeScript compiles with no errors
- [ ] No `any` types used
- [ ] All API calls use FPLService
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Proper TypeScript types/interfaces
- [ ] Consistent styling with theme
- [ ] Player photos have fallbacks
- [ ] FPL rules validated correctly
- [ ] No console errors in browser
- [ ] Mobile responsive
- [ ] Existing features still work
- [ ] @FPL_Dave_ footer present
- [ ] Lucide icons used (not other libraries)

---

**Last Updated**: February 26, 2026
**Maintained By**: @FPL_Dave_
