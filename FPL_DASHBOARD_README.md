# FPL Analytics Dashboard

A comprehensive Fantasy Premier League analytics platform built with React, featuring interactive visualizations, team management, and real-time player statistics.

![Dashboard Preview](./preview.png)

## 🎯 Features

### Core Analytics
- **Player Comparison** - Side-by-side radar charts comparing player statistics (xG, xA, Form, ICT Index, Minutes)
- **Fixture Difficulty Rating (FDR) Heatmaps** - Visual representation of upcoming fixtures for all teams
- **Form vs Fixture Analysis** - Scatter plots showing player form against fixture difficulty
- **Price Change Tracking** - Monitor player price movements and trends
- **Team Planner** - Drag-and-drop team builder with formation validation

### Interactive Components
- **Live Statistics** - Real-time data from official FPL API
- **Budget Tracker** - Automatic budget calculation with transfer costs
- **Transfer Management** - Plan transfers with visual feedback
- **Gameweek Navigation** - Browse historical and upcoming gameweeks
- **Responsive Design** - Fully functional on desktop, tablet, and mobile

## 🚀 Tech Stack

- **Framework**: React 18 + TypeScript
- **State Management**: Zustand
- **Routing**: React Router v6 (Data mode)
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Drag & Drop**: react-dnd
- **Icons**: Lucide React
- **API**: Official FPL API with CORS handling

## 🎨 Design System

### Color Palette
```css
/* Primary Gradients */
--gradient-primary: linear-gradient(135deg, #06b6d4 0%, #a855f7 100%);
--gradient-card: linear-gradient(to right, #06b6d4, #8b5cf6, #a855f7);

/* Core Colors */
--cyan: #06b6d4
--purple: #a855f7
--violet: #8b5cf6

/* Backgrounds */
--bg-primary: #f8fafc (slate-50)
--bg-card: #ffffff
--bg-hover: #f1f5f9 (slate-100)
```

### Typography
- **Headings**: System font stack with bold weights
- **Body**: Inter, sans-serif
- **Code**: Monospace

## 📁 Project Structure

```
/src
  /app
    App.tsx                      # Main router component
    routes.ts                    # Route configuration
    
    /components
      PlayerComparison.tsx       # Radar chart comparison
      FDRHeatmap.tsx            # Fixture difficulty matrix
      TeamPlanner.tsx           # Drag-and-drop pitch
      FixturesComparison.tsx    # Team fixtures view
      FormVsFixtures.tsx        # Scatter plot analysis
      PriceChanges.tsx          # Price movement tracker
      Dashboard.tsx             # Stats overview
      
    /store
      fpl-store.ts              # Zustand global state
      
  /styles
    theme.css                   # Design tokens
    fonts.css                   # Font imports
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/fpl-dashboard.git
cd fpl-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables
No API keys required! The FPL API is public, but CORS may require a proxy.

```env
# Optional: Custom API proxy
VITE_FPL_API_URL=https://fantasy.premierleague.com/api
```

## 📡 API Integration

### Endpoints Used
```typescript
// Bootstrap - All static game data
GET /api/bootstrap-static/

// Gameweek Fixtures
GET /api/fixtures/?event={gameweek}

// Player Details
GET /api/element-summary/{player_id}/

// Team Details
GET /api/entry/{team_id}/
```

### CORS Handling
The app includes graceful fallback to mock data when API requests fail:

```typescript
try {
  const response = await fetch(FPL_API_URL);
  const data = await response.json();
} catch (error) {
  console.warn('API fetch failed, using mock data');
  return mockData;
}
```

## 🎮 Usage Guide

### Player Comparison
1. Navigate to "Player Comparison"
2. Select two players from dropdowns
3. View radar chart comparison
4. Analyze stats: Goals, Assists, Form, ICT, Minutes

### FDR Heatmap
1. Go to "Fixtures" page
2. View color-coded difficulty matrix
3. Green = Easy, Red = Difficult
4. Plan transfers based on fixture swings

### Team Planner
1. Open "My Team"
2. Drag players from bench to pitch
3. Validate formation (min 1 GK, 3 DEF, 2 MID, 1 FWD)
4. Track budget and transfers

### Form vs Fixtures
1. Access "Form Analysis"
2. Scatter plot shows form (Y-axis) vs fixture difficulty (X-axis)
3. Top-right quadrant = High form + Easy fixtures (optimal picks)
4. Filter by position

## 🏗️ Key Components

### PlayerComparison.tsx
```tsx
// Renders dual radar charts with 5 key metrics
<RadarChart data={playerData}>
  <PolarGrid />
  <PolarAngleAxis dataKey="stat" />
  <Radar name="Player 1" dataKey="value" />
  <Radar name="Player 2" dataKey="value" />
</RadarChart>
```

### FDRHeatmap.tsx
```tsx
// 20 teams × 5 gameweeks grid
<div className="grid grid-cols-6">
  {teams.map(team => (
    <div className="fdr-row">
      {fixtures.map(gw => (
        <div className={getFDRColor(difficulty)} />
      ))}
    </div>
  ))}
</div>
```

### TeamPlanner.tsx
```tsx
// React DnD implementation
const [{ isDragging }, drag] = useDrag({
  type: 'player',
  item: { player }
});

const [, drop] = useDrop({
  accept: 'player',
  drop: (item) => handleDrop(item)
});
```

## 🎯 State Management

### Zustand Store Structure
```typescript
interface FPLStore {
  // Data
  players: Player[];
  teams: Team[];
  fixtures: Fixture[];
  
  // User State
  myTeam: Player[];
  budget: number;
  transfers: number;
  
  // Actions
  addPlayer: (player: Player) => void;
  removePlayer: (id: number) => void;
  makeTransfer: (out: Player, in: Player) => void;
}
```

## 🔄 Data Flow

```
FPL API → fetch() → Zustand Store → React Components → UI
                ↓ (on error)
           Mock Data → Zustand Store → React Components → UI
```

## 🎨 Styling Conventions

### Tailwind Classes
```tsx
// Card component
<div className="bg-white rounded-lg shadow-md p-6">

// Gradient header
<div className="bg-gradient-to-r from-cyan-500 via-violet-500 to-purple-500">

// Button
<button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded">
```

### Custom CSS (theme.css)
```css
.fdr-1 { background: #22c55e; } /* Easy */
.fdr-2 { background: #86efac; }
.fdr-3 { background: #fbbf24; } /* Medium */
.fdr-4 { background: #fb923c; }
.fdr-5 { background: #ef4444; } /* Hard */
```

## 📱 Responsive Breakpoints

- **Mobile**: < 640px (Stack components)
- **Tablet**: 640px - 1024px (2-column grid)
- **Desktop**: > 1024px (Full layout)

## 🧪 Testing

```bash
# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Drag /dist folder to Netlify
```

### Custom Server
```bash
npm run build
# Serve /dist folder with any static host
```

## 🐛 Known Issues & Solutions

### CORS Errors
**Problem**: Browser blocks FPL API requests  
**Solution**: App falls back to mock data automatically

### Slow Initial Load
**Problem**: Large bootstrap-static response  
**Solution**: Consider caching with Service Worker

### Mobile Drag Performance
**Problem**: Touch events may be laggy  
**Solution**: Using touch-action CSS and optimized re-renders

## 🛣️ Roadmap

- [ ] Historical gameweek comparison
- [ ] Export team to image
- [ ] Custom leagues leaderboard
- [ ] Player ownership % tracking
- [ ] Differential finder
- [ ] Wildcard optimizer
- [ ] Push notifications for deadlines
- [ ] Dark mode toggle

## 👤 Author

**@FPL_Dave_**  
Twitter/X: [@FPL_Dave_](https://twitter.com/FPL_Dave_)

## 📄 License

MIT License - Feel free to use for personal/commercial projects

## 🙏 Acknowledgments

- Official FPL API
- Fantasy Premier League community
- React + Tailwind ecosystem

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/fpl-dashboard/issues)
- **Twitter**: [@FPL_Dave_](https://twitter.com/FPL_Dave_)
- **Email**: your.email@example.com

---

Built with ⚽ by FPL enthusiasts, for FPL managers.
