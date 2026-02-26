# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FPL Analytics Dashboard - a React + TypeScript web application for Fantasy Premier League (FPL) managers to analyze players, plan teams, and create shareable social media graphics. Created by @FPL_Dave_.

## Commands

```bash
pnpm install       # Install dependencies (pnpm required — not npm or yarn)
pnpm dev           # Start development server with HMR
pnpm build         # Production build
pnpm preview       # Preview production build locally
```

No test runner or linter is configured. TypeScript strict mode is the primary code quality check. Do not modify `pnpm-lock.yaml`.

## Architecture

```
src/app/
├── App.tsx              # Root component + navigation shell
├── routes.ts            # React Router v7 lazy route definitions
├── components/
│   ├── ui/              # Radix UI-based reusable primitives (Button, Card, etc.)
│   ├── builders/        # Creator Hub social media graphic builders
│   ├── studio/          # Team Planner Studio feature
│   └── [PageComponents] # Dashboard, PlayerStats, FDRFixturesPage, etc.
├── store/
│   └── fpl-store.ts     # Single Zustand store for all global state (bootstrap, fixtures, team)
├── utils/
│   ├── corsProxy.ts     # FPLService wrapper + 3-tier CORS proxy + 10-min cache
│   └── exportService.ts # PNG export: canvas extraction → proxy fetch fallback
└── types/
    └── fpl.ts           # Player, Team, Fixture, Event TypeScript interfaces
src/styles/
├── theme.css            # Design tokens — DO NOT MODIFY unless explicitly asked
└── tailwind.css         # Tailwind v4 directives
```

**Data Flow**: FPL API → `FPLService` (CORS proxy) → Zustand store → components

**Routing**: React Router v7 in Data mode with lazy-loaded routes. Import from `react-router`, not `react-router-dom`.

**Styling**: Tailwind CSS v4 — no `tailwind.config.js` needed; configured via `@tailwindcss/vite` plugin. Path alias: `@` → `src/`.

## Critical Rules

### FPL API — Always Use FPLService

All FPL API calls **must** go through `FPLService` from `src/app/utils/corsProxy.ts`. Direct `fetch()` to `fantasy.premierleague.com` will fail due to CORS.

```typescript
// ✅ Correct
import { FPLService } from '../utils/corsProxy';
const bootstrap = await FPLService.getBootstrap();

// ❌ Wrong — CORS blocked
const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
```

The proxy uses a 3-tier fallback chain (corsproxy.io → allorigins.win → codetabs.com) with 12s timeout per attempt and 10-minute response caching.

### Image CDN URLs

```
Player photos: https://resources.premierleague.com/premierleague/photos/players/250x250/p{code}.png
Team badges:   https://resources.premierleague.com/premierleague/badges/70/t{code}.png
Team kits:     https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_{code}_{type}-220.webp
```

Always implement a three-tier fallback for player photos: player photo → team badge → hide element.

### State Management

Use the Zustand store (`useFPLStore`) for: bootstrap data, fixtures, team selection, budget state. Use local `useState` for: UI state (modals, dropdowns), form inputs, component-specific temporary data.

### TypeScript

- Strict mode — no `any` types
- Use union types over enums: `type Position = 'GKP' | 'DEF' | 'MID' | 'FWD'`
- Create named interfaces for all component props

### Component Structure Order

```typescript
export function MyComponent() {
  // 1. Store hooks
  // 2. Router hooks
  // 3. Refs
  // 4. State hooks
  // 5. Derived state (useMemo)
  // 6. Effects
  // 7. Event handlers
  // 8. Return JSX
}
```

### UI Conventions

- Icons: Lucide React only
- Theme gradient: `from-cyan-400 to-purple-600`
- FDR colors are fixed: 1=emerald-600, 2=green-500, 3=yellow-500, 4=orange-500, 5=red-600
- All pages must include `@FPL_Dave_` attribution in footer

## FPL Business Logic

**Squad rules** (15 players total): 2 GKP, 5 DEF, 5 MID, 3 FWD. Max 3 players from same club. £100m budget.

**Starting XI**: 1 GK + 3–5 DEF + 2–5 MID + 1–3 FWD = 11 players.

**Team Planner Studio**: Formation is auto-detected and becomes **read-only** after an official FPL team is loaded. Do not remove this behavior.

## When Adding New Features

1. Check `src/app/components/ui/` for existing primitives before creating new ones
2. Add route to `src/app/routes.ts` using lazy import pattern
3. Add Sidebar navigation entry if creating a new page
4. Always implement loading and error states for async operations
5. Test with Manager ID `4809216` (real FPL team for testing)
