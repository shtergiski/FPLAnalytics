# ⚡ Quick Reference - Claude Project for FPL Dashboard

## 🎯 TL;DR - 30 Second Version

1. **Create Claude Project** named "FPL Analytics Dashboard"
2. **Copy** `CLAUDE_INSTRUCTIONS.md` → Project Settings → Custom Instructions
3. **Upload** 4 files to Project Knowledge:
   - PROJECT_CONTEXT.md
   - TECH_STACK.md  
   - API_DOCUMENTATION.md
   - CODING_RULES.md
4. **Done!** Start building with full context

---

## 📁 Files at a Glance

| File | Size | Purpose | Where It Goes |
|------|------|---------|---------------|
| **SETUP_INSTRUCTIONS.md** | 8KB | You read this | Your computer |
| **FILES_SUMMARY.md** | 4KB | Overview | Your computer |
| **VISUAL_GUIDE.md** | 5KB | Visual diagrams | Your computer |
| **README.md** | 3KB | Project intro | Your computer |
| **CLAUDE_INSTRUCTIONS.md** | 8KB | Claude's role | Custom Instructions |
| **PROJECT_CONTEXT.md** | 25KB | Features & architecture | Project Knowledge |
| **TECH_STACK.md** | 18KB | Technologies | Project Knowledge |
| **API_DOCUMENTATION.md** | 22KB | FPL API | Project Knowledge |
| **CODING_RULES.md** | 20KB | Standards | Project Knowledge |

**Total**: ~113KB of documentation
**Setup time**: 5-10 minutes
**Value**: ∞ hours saved

---

## 🎨 What Each File Teaches Claude

```
CLAUDE_INSTRUCTIONS.md
├─ Your role: Expert FPL dev
├─ Core principles: FPL rules, code quality, UI consistency
├─ CORS proxy: Always use FPLService
├─ DO's: TypeScript, error handling, fallbacks
└─ DON'Ts: Direct API calls, 'any' types, wrong libraries

PROJECT_CONTEXT.md
├─ 8 pages explained (Dashboard, Team Planner, etc.)
├─ Key features & how they work
├─ Architecture (Zustand, Router, Export system)
├─ Data structures (Player, Team, Fixture)
└─ Development patterns

TECH_STACK.md
├─ React 18 + TypeScript + Tailwind v4
├─ Zustand state management
├─ React Router v7 (Data mode)
├─ html-to-image export
└─ Package management (pnpm)

API_DOCUMENTATION.md
├─ FPL API endpoints (bootstrap, fixtures, manager)
├─ CORS proxy system (3-tier fallback)
├─ Request/response structures
├─ Error handling patterns
└─ Image CDN URLs

CODING_RULES.md
├─ File organization standards
├─ TypeScript typing rules
├─ React component patterns
├─ Tailwind CSS conventions
├─ FPL validation logic
└─ Error handling best practices
```

---

## 💬 Example Prompts After Setup

### Building Features
```
✅ "Add a player comparison radar chart"
✅ "Create a chip strategy analyzer"
✅ "Build a differential players finder"
✅ "Add price change prediction tracking"
```

### Fixing Issues
```
✅ "Fix CORS error in team loading"
✅ "Export not working, debug it"
✅ "Formation not locking after FPL load"
✅ "Player photos not showing fallback"
```

### Refactoring
```
✅ "Extract player card to reusable component"
✅ "Optimize fixture difficulty calculation"
✅ "Add loading skeleton to all pages"
✅ "Improve error messages"
```

### Questions
```
✅ "How does the CORS proxy work?"
✅ "Explain transfer validation logic"
✅ "What are the FPL formation rules?"
✅ "Where are player photos loaded from?"
```

---

## 🎯 What Claude Knows After Setup

```
✅ Tech Stack
   React 18, TypeScript, Tailwind v4, Zustand, React Router v7

✅ Project Structure  
   /components, /store, /utils, /types, routes.ts

✅ FPL Domain
   Formations, transfers, squad rules, FDR, pricing

✅ API Integration
   FPLService methods, CORS proxy, error handling

✅ Component Patterns
   Button, Card, PlayerCombobox, loading states

✅ Styling System
   Cyan-to-purple gradients, FDR colors, Tailwind utilities

✅ Export System
   Canvas extraction → proxy fetch, image conversion

✅ Coding Standards
   TypeScript strict, hooks patterns, error handling
```

---

## ⚠️ Critical Rules (Claude Follows These)

```
✅ ALWAYS
- Use FPLService for API calls (never direct fetch)
- Use TypeScript strict types (no 'any')
- Use Tailwind CSS (no custom CSS classes)
- Use Lucide React icons (no other libraries)
- Add @FPL_Dave_ footer on all pages
- Handle loading/error states
- Validate FPL rules (formations, transfers, budget)

❌ NEVER
- Direct fetch to FPL API (will fail CORS)
- Use 'react-router-dom' (use 'react-router')
- Use 'any' type in TypeScript
- Create tailwind.config.js (v4 doesn't need it)
- Break FPL rules validation
- Skip error handling
```

---

## 🚀 Setup Checklist (Copy & Paste)

```
[ ] Read SETUP_INSTRUCTIONS.md
[ ] Go to claude.ai
[ ] Click "Projects" → "Create Project"
[ ] Name it "FPL Analytics Dashboard"
[ ] Click Settings ⚙️ in project
[ ] Open CLAUDE_INSTRUCTIONS.md
[ ] Copy entire contents
[ ] Paste into Custom Instructions field
[ ] Click Save
[ ] Click "Add content" in project
[ ] Upload PROJECT_CONTEXT.md
[ ] Upload TECH_STACK.md
[ ] Upload API_DOCUMENTATION.md
[ ] Upload CODING_RULES.md
[ ] Wait for processing (1-2 min)
[ ] Test: Ask "What do you know about this project?"
[ ] Test: Ask "Add a new analytics feature"
[ ] Celebrate! 🎉 You're ready to build
```

---

## 💡 Pro Tips

### Get Better Results
```
✅ Be specific: "Update TeamPlannerStudio.tsx to add..."
✅ Reference patterns: "Use same pattern as PlayerCombobox"
✅ Mention files: "In the FDRFixturesPage component..."
✅ Ask for explanations: "Explain how this works"
```

### When Context Seems Lost
```
✅ Start new chat in same project
✅ Reference specific files: "Look at corsProxy.ts"
✅ Remind about rules: "Remember to use FPLService"
✅ Re-upload recently modified files
```

### Keep Context Fresh
```
✅ Update PROJECT_CONTEXT.md when adding major features
✅ Update CODING_RULES.md when establishing new patterns
✅ Re-upload updated files to project
```

---

## 🎯 ROI Calculation

### Without Claude Project
```
Feature request → 10 min explaining context
                → 5 min waiting for code  
                → 15 min fixing to match patterns
                → 5 min adding missing pieces
                ────────────────────────────
                  35 minutes per feature
```

### With Claude Project  
```
Feature request → Code generated instantly
                → Already matches patterns
                → Already handles errors
                → Already validates FPL rules
                ────────────────────────────
                  5 minutes per feature (85% faster!)
```

**10 features = 5 hours saved**
**50 features = 25 hours saved**
**100 features = 50 hours saved**

---

## 📞 Help & Resources

### For Setup Help
- Read: **SETUP_INSTRUCTIONS.md** (detailed guide)
- Read: **VISUAL_GUIDE.md** (visual diagrams)
- Read: **FILES_SUMMARY.md** (file overview)

### For Project Understanding
- Read: **PROJECT_CONTEXT.md** (features & architecture)
- Read: **TECH_STACK.md** (technologies)
- Read: **API_DOCUMENTATION.md** (FPL API)
- Read: **CODING_RULES.md** (standards)

### For Using Claude
- Ask: "What do you know about this project?"
- Ask: "How does [feature] work?"
- Ask: "Show me an example of [pattern]"

---

## ✅ Success Indicators

You'll know setup worked when Claude:

```
✅ Uses FPLService automatically (no reminding)
✅ Matches your styling (gradients, colors, spacing)
✅ Follows your component patterns (Button, Card)
✅ Validates FPL rules correctly
✅ Handles errors with proper messages
✅ Adds @FPL_Dave_ footer without being asked
✅ Uses correct imports (react-router not react-router-dom)
✅ Includes loading states automatically
✅ Never uses 'any' type
✅ References specific files when explaining
```

---

## 🎉 You're Ready!

Start building amazing FPL features with Claude as your expert development partner!

**Example first prompt**:
```
"Add a page that shows the best captaincy options based on 
fixture difficulty and form. Include player photos, stats, 
and upcoming fixtures."
```

Watch Claude build it perfectly! 🚀✨

---

**Quick Links**:
- [Setup Instructions](./SETUP_INSTRUCTIONS.md)
- [Visual Guide](./VISUAL_GUIDE.md)
- [Files Summary](./FILES_SUMMARY.md)
- [Project README](./README.md)

**Created for**: @FPL_Dave_
**Setup time**: 5-10 minutes
**Productivity boost**: 🚀🚀🚀
