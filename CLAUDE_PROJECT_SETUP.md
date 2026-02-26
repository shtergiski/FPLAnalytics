# FPL Analytics Dashboard - Claude Project Setup Guide

## 🚀 Quick Setup Instructions

### 1. Create a New Claude Project
- Go to claude.ai
- Click "Projects" → "Create Project"
- Name it: "FPL Analytics Dashboard"

### 2. Add This Codebase
- Upload your entire project folder OR
- Use the "Add content" feature to add key files

### 3. Add Custom Instructions (Project Settings)
Copy the content from `CLAUDE_INSTRUCTIONS.md` into the Project's Custom Instructions field.

### 4. Add Project Knowledge
Add these files to the Project Knowledge base:
- `PROJECT_CONTEXT.md` - Core project understanding
- `TECH_STACK.md` - Technical details
- `API_DOCUMENTATION.md` - FPL API integration details
- `CODING_RULES.md` - Project-specific coding standards

---

## 📁 What Each File Does

### CLAUDE_INSTRUCTIONS.md
→ **Where**: Project Settings → Custom Instructions
→ **Purpose**: Tells Claude how to behave on this specific project

### PROJECT_CONTEXT.md
→ **Where**: Project Knowledge
→ **Purpose**: Comprehensive project overview, features, architecture

### TECH_STACK.md
→ **Where**: Project Knowledge
→ **Purpose**: Technical stack, dependencies, patterns used

### API_DOCUMENTATION.md
→ **Where**: Project Knowledge
→ **Purpose**: FPL API endpoints, CORS proxy system, data structures

### CODING_RULES.md
→ **Where**: Project Knowledge
→ **Purpose**: Project-specific coding standards and patterns

---

## 💡 Usage Tips

### Starting a New Chat
Just describe what you want to build/fix. Claude will have all context.

Example:
```
"Add a new feature to show player injury status on the team planner"
```

### Continuing Development
Reference specific features:
```
"Update the FDR Fixtures page to include double gameweeks"
```

### Debugging
Provide error context:
```
"The export is failing with CORS errors on Team Lineup Builder"
```

---

## 🔄 Keeping Context Updated

When you make major changes, update these files:
1. **PROJECT_CONTEXT.md** - New features, pages, components
2. **API_DOCUMENTATION.md** - New API endpoints, data structures
3. **CODING_RULES.md** - New patterns or standards you establish

---

## 📋 Current Project Status

**Last Updated**: February 26, 2026

**Completed Features**:
- ✅ Dashboard with key metrics
- ✅ Team Planner Studio with FPL rules validation
- ✅ Creator Hub (Team Lineup Builder, Player Cards, etc.)
- ✅ FDR Fixtures with sorting and best fixture highlighting
- ✅ Player comparison tools (Head-to-Head, Fixtures Comparison)
- ✅ Transfer Tips page
- ✅ CORS proxy system with multiple fallbacks
- ✅ Export functionality with image conversion
- ✅ Official player photos and team kits integration

**Known Issues**:
- Export CORS proxy (api.allorigins.win) sometimes returns 520/522 errors
- Canvas extraction fallback works for most cases

**Tech Stack**:
- React 18 + TypeScript
- React Router v7 (Data mode)
- Zustand (state management)
- Tailwind CSS v4
- Recharts (charts)
- html-to-image (exports)
- Lucide React (icons)

---

## 🎯 Project Goals

1. **Comprehensive FPL Analytics**: Provide deep insights for Fantasy Premier League managers
2. **Official Data Integration**: Use official FPL API with proper CORS handling
3. **Creator Tools**: Allow users to create shareable graphics and lineups
4. **Clean UI**: Cyan-to-purple gradient theme, professional design
5. **Mobile Responsive**: Works on all devices
6. **Performance**: Fast, efficient, proper state management

---

## 📞 Contact

Creator: @FPL_Dave_ (appears in footer across all pages)
