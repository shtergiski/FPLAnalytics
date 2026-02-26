# FPL Analytics Dashboard

A comprehensive Fantasy Premier League analytics and content creation platform.

**Creator**: @FPL_Dave_

---

## 🚀 Quick Start for Claude Development

### Option 1: Fast Setup (5 minutes)
1. Read **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)**
2. Follow the steps to set up Claude Project
3. Start building!

### Option 2: Full Context (10 minutes)
1. Read **[FILES_SUMMARY.md](./FILES_SUMMARY.md)** for overview
2. Read **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** for setup
3. Skim through the knowledge files to understand the project
4. Set up Claude Project with all files
5. Start building with full AI assistance!

---

## 📚 Documentation Files

### For Setup
- **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** - How to set up Claude Project
- **[FILES_SUMMARY.md](./FILES_SUMMARY.md)** - Overview of all documentation files

### For Claude Project (Add These)
- **[CLAUDE_INSTRUCTIONS.md](./CLAUDE_INSTRUCTIONS.md)** - Custom instructions (paste in Project Settings)
- **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** - Project overview, features, architecture
- **[TECH_STACK.md](./TECH_STACK.md)** - Technologies, libraries, patterns
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - FPL API integration
- **[CODING_RULES.md](./CODING_RULES.md)** - Coding standards and patterns

---

## 🎯 What This Project Does

A web application for Fantasy Premier League managers to:
- 📊 Analyze player statistics and performance
- 🎮 Plan teams with official FPL rules validation
- 📈 Compare players and fixtures
- 🎨 Create shareable graphics for social media
- 📱 Export team lineups and player cards
- 🔄 Track transfers and budget

**Tech Stack**: React 18 + TypeScript + Tailwind CSS v4 + Zustand

---

## 🛠️ Development

### Install Dependencies
```bash
pnpm install
```

### Run Development Server
```bash
pnpm dev
```

### Build for Production
```bash
pnpm build
```

---

## 🤖 Developing with Claude

Once you've set up the Claude Project (see [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)):

### Adding Features
```
"Add a price change prediction page"
"Create a player comparison radar chart"
"Build a chip strategy analyzer"
```

### Fixing Bugs
```
"The export is failing with CORS errors"
"Formation dropdown not locking after FPL team load"
"Player photos not loading with fallback"
```

### Refactoring
```
"Extract player card into reusable component"
"Optimize the fixture difficulty calculation"
"Add TypeScript types to manager data"
```

Claude will have full context of your codebase, patterns, and standards!

---

## 📋 Current Features

### Pages
1. **Dashboard** - Player overview and search
2. **Team Planner Studio** - Visual team builder with pitch view
3. **Creator Hub** - Graphics builders
   - Player Cards Gallery
   - Gameweek Review Builder
   - Team Lineup Builder (Advanced)
   - Head-to-Head Builder
   - FDR Fixture Builder
4. **Transfer Tips** - Player comparison for transfers
5. **Fixtures Comparison** - Compare fixtures for multiple players
6. **Head-to-Head** - Detailed 1v1 player comparison
7. **FDR Fixtures** - Fixture difficulty matrix
8. **Player Stats** - Comprehensive statistics table

### Key Systems
- ✅ CORS proxy with 3-tier fallback
- ✅ Zustand state management
- ✅ React Router v7 (Data mode)
- ✅ Export to PNG with image conversion
- ✅ Official FPL API integration
- ✅ Player photos with fallback system
- ✅ FPL rules validation (formations, transfers, budget)

---

## 🔗 Important Links

- **FPL Official API**: https://fantasy.premierleague.com/api/
- **Player Photos**: https://resources.premierleague.com/premierleague/photos/players/
- **Team Badges**: https://resources.premierleague.com/premierleague/badges/

---

## 📝 Project Status

**Version**: 1.0.0
**Status**: Production-ready
**Last Updated**: February 26, 2026
**Maintained By**: @FPL_Dave_

### Completed
- ✅ All 8 major pages
- ✅ CORS proxy system
- ✅ Export functionality
- ✅ Official player photos integration
- ✅ FPL rules validation
- ✅ Team loading by manager ID
- ✅ Formation auto-detection

### Known Issues
- ⚠️ CORS proxy (api.allorigins.win) sometimes returns 520/522 errors
- ⚠️ Canvas extraction works as fallback for exports

---

## 🤝 Contributing

When making changes:
1. Follow patterns in **[CODING_RULES.md](./CODING_RULES.md)**
2. Use **FPLService** for all API calls
3. Match existing UI/UX patterns
4. Test with official FPL data
5. Update documentation files if needed

---

## 📄 License

Private project for @FPL_Dave_

---

## 🙋 Questions?

- Check **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** for project overview
- Check **[TECH_STACK.md](./TECH_STACK.md)** for technical details
- Check **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** for API info
- Check **[CODING_RULES.md](./CODING_RULES.md)** for standards

Or ask Claude in your project! 🤖
