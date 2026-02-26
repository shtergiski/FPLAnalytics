# 🚀 How to Set Up This Project in Claude

## Step-by-Step Guide

### 1. Create a Claude Project
1. Go to **claude.ai**
2. Click **"Projects"** in the left sidebar
3. Click **"Create Project"**
4. Name it: **"FPL Analytics Dashboard"**

---

### 2. Add Custom Instructions
1. In your new project, click the **⚙️ Settings** icon (top right)
2. Scroll to **"Custom Instructions"**
3. **Copy the ENTIRE contents** of `/CLAUDE_INSTRUCTIONS.md`
4. **Paste** into the Custom Instructions field
5. Click **Save**

This tells Claude exactly how to behave on this project.

---

### 3. Add Project Knowledge Files
1. Click **"Add content"** in the project
2. Upload these 4 files **(IN THIS ORDER)**:

   📄 **PROJECT_CONTEXT.md** - Overview, features, architecture
   📄 **TECH_STACK.md** - Technologies, libraries, patterns
   📄 **API_DOCUMENTATION.md** - FPL API integration details
   📄 **CODING_RULES.md** - Project-specific coding standards

3. Wait for files to process (1-2 minutes)

---

### 4. Add Your Codebase (Optional but Recommended)
**Option A - Upload Entire Folder**:
- Zip your `/src` folder
- Upload to the project

**Option B - Add Key Files**:
Upload these critical files:
- `/src/app/App.tsx`
- `/src/app/routes.ts`
- `/src/app/store/fpl-store.ts`
- `/src/app/utils/corsProxy.ts`
- `/src/app/utils/exportService.ts`
- `/src/app/types/fpl.ts`
- `/src/app/components/ui/button.tsx`
- `/src/app/components/ui/player-combobox.tsx`

---

### 5. Test It Out!
Start a new chat in your project and try:

```
"Add a feature to show player injury status on the dashboard"
```

Claude will now have full context of:
- ✅ Your project structure
- ✅ FPL API integration
- ✅ CORS proxy system
- ✅ Coding standards
- ✅ Component patterns
- ✅ All features and pages

---

## 💬 How to Use Your Claude Project

### Starting Fresh
Just describe what you want:
```
"Create a new page that shows captain picks analysis"
```

### Fixing Bugs
Provide error context:
```
"The export is failing with CORS errors in TeamPlannerStudio"
```

### Continuing Work
Reference existing features:
```
"Update the FDR Fixtures page to highlight double gameweeks"
```

### Asking Questions
```
"How does the transfer validation work?"
"Where are player photos loaded from?"
```

---

## 📊 What Claude Now Knows

### ✅ Project-Specific Knowledge
- FPL rules (squad composition, formations, transfers)
- CORS proxy system with 3-tier fallback
- Export system with image conversion
- Official FPL API endpoints and data structures
- Your component library and patterns
- Styling system (Tailwind CSS v4, gradients, FDR colors)

### ✅ Technical Context
- React 18 + TypeScript patterns
- Zustand state management
- React Router v7 (Data mode)
- html-to-image export system
- Lucide React icons
- Official FPL image CDNs

### ✅ Business Logic
- Formation validation (3-4-3, 3-5-2, etc.)
- Transfer rules (budget, squad composition, team limits)
- FDR color system (1-5 scale)
- Captain/vice-captain selection
- Automatic formation detection

---

## 🎯 Example Conversations

### Example 1: New Feature
**You**: "Add a price change tracker page"

**Claude will**:
1. Create `/src/app/components/PriceChangeTracker.tsx`
2. Add route to `/src/app/routes.ts`
3. Add sidebar link to `/src/app/App.tsx`
4. Use FPLService for data fetching
5. Match existing UI patterns (Cards, Buttons, gradients)
6. Handle loading/error states
7. Add @FPL_Dave_ footer

### Example 2: Bug Fix
**You**: "Formation dropdown not working after loading FPL team"

**Claude will**:
1. Check `isFPLTeamLoaded` state flag
2. Verify formation is locked when true
3. Fix the conditional rendering
4. Test with FPL API integration
5. Explain the fix

### Example 3: Refactoring
**You**: "Extract player card into reusable component"

**Claude will**:
1. Create `/src/app/components/ui/player-card.tsx`
2. Use existing patterns (Button, Card)
3. Add proper TypeScript types
4. Include player photo with fallback
5. Update all pages that use player cards

---

## 🔄 Keeping Context Updated

### When You Make Major Changes
Update these files and re-upload to the project:

1. **PROJECT_CONTEXT.md** - New features, pages, components
2. **API_DOCUMENTATION.md** - New API endpoints, data structures
3. **CODING_RULES.md** - New patterns or standards

### When to Update
- ✅ After adding new pages/features
- ✅ After major refactoring
- ✅ After changing API integration
- ✅ After establishing new patterns

---

## 💡 Pro Tips

### 1. Reference Existing Components
```
"Use the same pattern as PlayerCombobox for team selection"
```

### 2. Be Specific About Files
```
"Update the transfer validation in TeamPlannerStudio.tsx"
```

### 3. Ask for Explanations
```
"Explain how the CORS proxy fallback works"
```

### 4. Request Testing Guidance
```
"How can I test the FPL team loading with different manager IDs?"
```

### 5. Get Code Reviews
```
"Review my transfer validation logic for edge cases"
```

---

## 🐛 Troubleshooting

### "Claude doesn't seem to know my project"
- ✅ Make sure Custom Instructions are saved
- ✅ Verify all 4 knowledge files are uploaded
- ✅ Try asking: "What do you know about this FPL project?"

### "Claude suggests wrong patterns"
- ✅ Reference specific files: "Use the pattern from TeamPlannerStudio"
- ✅ Remind about rules: "Remember to use FPLService for API calls"

### "Claude forgets context mid-conversation"
- ✅ Long conversations can dilute context
- ✅ Start a new chat and reference previous work
- ✅ Re-upload recently modified files

---

## 📋 Quick Reference

### Must-Use Commands
```
✅ import { FPLService } from '../utils/corsProxy';
✅ const { bootstrap, fetchBootstrapData } = useFPLStore();
✅ <Button variant="default">Click</Button>
✅ <PlayerCombobox players={players} onSelect={setPlayer} />
✅ await ExportService.exportCard(ref.current, filename);
```

### Never Use
```
❌ fetch('https://fantasy.premierleague.com/api/...')
❌ import { ... } from 'react-router-dom'
❌ any type in TypeScript
❌ Custom CSS classes (use Tailwind)
❌ Other icon libraries (use Lucide React)
```

---

## 🎉 You're All Set!

Your Claude Project now has:
- ✅ Full project context
- ✅ Technical knowledge
- ✅ Coding standards
- ✅ API documentation
- ✅ FPL business logic
- ✅ Component patterns

**Start building and let Claude help you!** 🚀

---

**Created**: February 26, 2026
**For**: @FPL_Dave_
**Project**: FPL Analytics Dashboard
