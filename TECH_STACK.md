# FPL Analytics Dashboard - Technical Stack

## Core Technologies

### Frontend Framework
- **React 18.3.1**
  - Functional components only
  - Hooks-based architecture
  - Strict mode enabled
  - No class components

### Language
- **TypeScript 5.x**
  - Strict mode enabled
  - No `any` types (use `unknown` if needed)
  - Proper interface definitions for all data structures
  - Type inference where possible

### Styling
- **Tailwind CSS v4.0**
  - Utility-first approach
  - Custom theme in `/src/styles/theme.css`
  - NO `tailwind.config.js` file (v4 doesn't need it)
  - Responsive design with mobile-first approach
  - Custom gradient utilities

### Routing
- **React Router v7** (react-router package)
  - Data mode pattern with `createBrowserRouter`
  - Lazy-loaded routes with `React.lazy()`
  - Nested routes with `<Outlet />`
  - RouterProvider in App.tsx
  - **Important**: Do NOT use `react-router-dom` (incompatible with this environment)

### State Management
- **Zustand 5.x**
  - Minimal boilerplate
  - Single global store in `/src/app/store/fpl-store.ts`
  - No Redux, Context API, or other state libs
  - Persist middleware for caching (future enhancement)

---

## Key Libraries

### UI & Components
- **Lucide React 0.x** - Icons ONLY (no other icon libraries)
- **Radix UI** - Headless UI primitives
  - `@radix-ui/react-popover` - For PlayerCombobox
  - `@radix-ui/react-slot` - For Button composition
- **cmdk** - Command palette for searchable dropdowns

### Data Visualization
- **Recharts 2.x**
  - Line charts, bar charts, radar charts
  - Responsive container pattern
  - Custom tooltips and legends
  - Used in player comparison, stats pages

### Image Export
- **html-to-image 1.x**
  - `toPng()` function for high-res exports
  - Canvas-based rendering
  - 3x pixel ratio for quality
  - CORS image handling via export service

### Utilities
- **clsx / tailwind-merge**
  - Conditional className management
  - `cn()` utility function in utils
- **date-fns** (if date formatting needed)

---

## Package Management

### Package Manager
- **pnpm** (REQUIRED - don't use npm or yarn)
- Lockfile: `pnpm-lock.yaml` (protected file, don't modify)

### Package.json Scripts
```json
{
  "dev": "Start development server",
  "build": "Production build",
  "preview": "Preview production build",
  "type-check": "TypeScript validation"
}
```

---

## Project Structure

```
/src
├── app/
│   ├── components/
│   │   ├── ui/              # Reusable UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   └── player-combobox.tsx
│   │   ├── builders/        # Creator Hub builders
│   │   │   ├── TeamLineupBuilderAdvanced.tsx
│   │   │   ├── GameweekReviewBuilder.tsx
│   │   │   ├── HeadToHeadBuilder.tsx
│   │   │   └── FDRFixtureBuilder.tsx
│   │   ├── studio/          # Team Planner Studio
│   │   │   └── TeamPlannerStudio.tsx
│   │   ├── Dashboard.tsx    # Home page
│   │   ├── CreatorHub.tsx
│   │   ├── TransferTips.tsx
│   │   ├── FixturesComparison.tsx
│   │   ├── HeadToHead.tsx
│   │   ├── FDRFixturesPage.tsx
│   │   └── PlayerStats.tsx
│   ├── store/
│   │   └── fpl-store.ts     # Zustand store
│   ├── utils/
│   │   ├── corsProxy.ts     # CORS proxy + FPLService
│   │   └── exportService.ts # Image export logic
│   ├── types/
│   │   └── fpl.ts           # TypeScript interfaces
│   ├── routes.ts            # React Router config
│   └── App.tsx              # Root component + layout
├── styles/
│   ├── theme.css            # Design tokens (protected)
│   └── fonts.css            # Font imports ONLY
└── index.tsx                # Entry point

/public
└── (static assets if any)
```

---

## TypeScript Configuration

### tsconfig.json Highlights
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleResolution": "bundler"
  }
}
```

### Type Definitions
All types in `/src/app/types/fpl.ts`:
- `Player` - Individual player data (50+ fields)
- `Team` - Premier League team data
- `Fixture` - Match fixture with FDR
- `BootstrapData` - Full API response structure
- `Event` - Gameweek information

---

## Build & Development

### Development Server
- Vite-based dev server
- Hot Module Replacement (HMR)
- Fast refresh for React
- TypeScript checking in background

### Production Build
- Vite production build
- Code splitting by route
- Tree shaking
- Minification
- CSS optimization

### Environment
- Deployed on Figma Make preview
- No environment variables needed (public API)
- No backend server required
- Client-side only

---

## API Integration

### Official FPL API
**Base URL**: `https://fantasy.premierleague.com/api/`

**Endpoints Used**:
- `/bootstrap-static/` - All players, teams, GWs (2MB response)
- `/fixtures/` - All fixtures with FDR
- `/entry/{manager_id}/` - Manager profile
- `/entry/{manager_id}/event/{gw}/picks/` - Manager's team for GW

**No Authentication Required** - Public API

### CORS Proxy System
**File**: `/src/app/utils/corsProxy.ts`

**Three Proxies in Sequence**:
```typescript
1. corsproxy.io/?{url}
2. api.allorigins.win/raw?url={url}
3. api.codetabs.com/v1/proxy?quest={url}
```

**Retry Logic**:
- 12 second timeout per proxy
- Automatic fallback to next proxy
- Error accumulation for debugging
- User-friendly error messages

**Usage Pattern**:
```typescript
import { FPLService } from '../utils/corsProxy';

// ✅ Always use FPLService methods
const bootstrap = await FPLService.getBootstrap();
const fixtures = await FPLService.getFixtures();
const manager = await FPLService.getEntry(managerId);
const picks = await FPLService.getEntryPicks(managerId, gw);

// ❌ Never fetch directly
// const data = await fetch('https://fantasy.premierleague.com/api/...');
```

---

## Image Assets

### Official FPL CDN Resources

#### Player Photos
- **URL Pattern**: `https://resources.premierleague.com/premierleague/photos/players/{size}/p{code}.png`
- **Sizes**: `110x140`, `250x250`
- **Code**: From `player.code` field
- **Example**: `p223094.png` (Mohamed Salah)
- **CORS**: Inconsistent - use fallback strategy

#### Team Badges
- **URL Pattern**: `https://resources.premierleague.com/premierleague/badges/{size}/t{code}.png`
- **Sizes**: `70` (small), `250` (large)
- **Code**: From `team.code` or `player.team_code` field
- **Example**: `t3.png` (Arsenal)

#### Team Kits
- **URL Pattern**: `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_{code}_{type}-220.webp`
- **Type**: `1` (outfield), `5` (goalkeeper)
- **Code**: From `team.code` or `player.team_code` field
- **Example**: `shirt_3_1-220.webp` (Arsenal outfield kit)

### Fallback Strategy
```tsx
<img
  src={playerPhotoUrl}
  onError={(e) => {
    // First fallback: team badge
    e.currentTarget.src = teamBadgeUrl;
    e.currentTarget.onerror = () => {
      // Second fallback: initials or placeholder
      e.currentTarget.style.display = 'none';
    };
  }}
/>
```

---

## Export System Architecture

### html-to-image Integration
**File**: `/src/app/utils/exportService.ts`

**Process Flow**:
```
1. Clone DOM element
2. Find all <img> and SVG <image> elements
3. For each image:
   a. Try canvas extraction (if CORS-safe)
   b. If fails → Proxy fetch → Blob → Base64
4. Replace all src/href with data URLs
5. Call toPng() with 3x pixel ratio
6. Download PNG file
```

**Canvas Extraction** (Strategy 1):
- Fast, synchronous
- Works if image has `crossorigin="anonymous"` attribute
- Works if CDN sends `Access-Control-Allow-Origin: *`
- Preferred method

**Proxy Fetch** (Strategy 2):
- Slow, asynchronous
- Fetches image through CORS proxy
- Converts to blob → data URL via FileReader
- Fallback when canvas extraction fails

**Error Handling**:
- Individual image failures don't break entire export
- Console warnings for debugging
- User-friendly error messages
- Graceful degradation (missing images show as broken but export completes)

---

## Coding Patterns

### Component Structure
```tsx
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useFPLStore } from '../store/fpl-store';

interface MyComponentProps {
  // Props with proper TypeScript types
}

export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // 1. Store hooks
  const { bootstrap, fetchBootstrapData } = useFPLStore();
  
  // 2. Local state
  const [localState, setLocalState] = useState<Type>(initial);
  
  // 3. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // 4. Handlers
  const handleClick = () => {
    // Logic
  };
  
  // 5. Render
  return (
    <div className="space-y-6">
      {/* JSX */}
    </div>
  );
}
```

### Zustand Store Pattern
```typescript
import { create } from 'zustand';

interface StoreState {
  data: DataType | null;
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

export const useMyStore = create<StoreState>((set) => ({
  data: null,
  loading: false,
  error: null,
  
  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchFromAPI();
      set({ data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

### API Call Pattern
```typescript
import { FPLService } from '../utils/corsProxy';

// Always wrap in try-catch
try {
  const data = await FPLService.getBootstrap();
  // Process data
} catch (error) {
  console.error('Failed to fetch:', error);
  // Show user-friendly message
  setError('Failed to load data. Please try again.');
}
```

---

## Performance Best Practices

### 1. Lazy Loading
```typescript
const MyPage = React.lazy(() => 
  import('./components/MyPage').then(m => ({ default: m.MyPage }))
);
```

### 2. Memoization
```typescript
const sortedPlayers = useMemo(() => {
  return players.sort((a, b) => b.total_points - a.total_points);
}, [players]);
```

### 3. Debouncing (Future)
```typescript
const debouncedSearch = useMemo(
  () => debounce((value) => setSearchQuery(value), 300),
  []
);
```

### 4. Conditional Rendering
```typescript
{loading && <LoadingSpinner />}
{error && <ErrorMessage message={error} />}
{data && <DataDisplay data={data} />}
```

---

## Security Considerations

### CORS Proxy Security
- **Risk**: Using third-party CORS proxies
- **Mitigation**: Multiple fallbacks, timeout protection
- **Note**: Only public FPL API data (no sensitive info)

### XSS Prevention
- React's built-in XSS protection (auto-escaping)
- No `dangerouslySetInnerHTML` used
- User input sanitized via React

### API Keys
- No API keys needed (public FPL API)
- No sensitive data stored
- Client-side only (no backend)

---

## Testing (Future Enhancement)

### Unit Testing - Vitest
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Testing - Playwright
```typescript
test('loads FPL team', async ({ page }) => {
  await page.goto('/team-planner');
  await page.fill('input[placeholder="Enter FPL ID..."]', '4809216');
  await page.click('button:has-text("Load Team")');
  await expect(page.locator('.player-name')).toBeVisible();
});
```

---

## Browser Compatibility

**Targets**:
- Chrome/Edge 100+
- Firefox 100+
- Safari 15+
- Mobile browsers (iOS Safari, Chrome Android)

**Modern Features Used**:
- ES2020 syntax (optional chaining, nullish coalescing)
- CSS Grid & Flexbox
- Fetch API
- Canvas API
- FileReader API

**No Support For**:
- Internet Explorer
- Legacy browsers (<2 years old)

---

## Deployment

### Build Output
- Static HTML/CSS/JS files
- Vite generates optimized bundles
- Code splitting by route
- Asset fingerprinting for cache busting

### Hosting
- Currently: Figma Make preview environment
- Compatible with: Vercel, Netlify, GitHub Pages, Cloudflare Pages
- No server-side rendering needed
- No environment variables needed

---

**Last Updated**: February 26, 2026
**Maintained By**: @FPL_Dave_
