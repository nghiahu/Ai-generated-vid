# Design: Dashboard Project Routing & Legacy AI Gen Detection Fix

**Date:** 2026-07-25  
**Status:** Approved  
**Topic:** Fix project selection navigation from Dashboard so clicking an AI Gen project card immediately switches the view to `STUDIO_AI_GEN` and loads all saved project data.

---

## 1. Problem Statement

1. **Dashboard View State Trap**: On the home/dashboard page, `view` state is `"DASHBOARD"`. When selecting a project card, `fetchProjectDetail` checked `if (view === "PROJECTS") setView("WORKSPACE_EDITOR")`. Because `view` was `"DASHBOARD"`, `setView` was skipped and navigation did not occur.
2. **Legacy AI Gen Recognition**: Older AI Gen projects saved prior to adding the `type='AIGEN'` database column lacked `type='AIGEN'`. As a result, `fetchProjectDetail` fell back to non-AIGEN handling and failed to route to `STUDIO_AI_GEN`.

---

## 2. System Design & Architecture

### Component 1 — Smart Project Routing & Type Detection (`App.jsx`)
In `fetchProjectDetail(id)` inside `App.jsx`:
- Update AI Gen detection logic:
  - Project is AI Gen if `project.type === "AIGEN"` **OR** `(project.config && Array.isArray(project.config.scenes) && project.config.scenes.length > 0 && project.config.scenes[0].visualPattern)`.
- When AI Gen project is selected: Always invoke `setView("STUDIO_AI_GEN")` regardless of current `view` (`DASHBOARD`, `PROJECTS`, or `STUDIO`).
- When standard project is selected: Always invoke `setView("WORKSPACE_EDITOR")` (if scenes exist) or `setView("WORKSPACE_SETUP")`.

---

## 3. Verification Plan

1. **AI Gen Project Click Test**:
   - On the Projects/Dashboard page under tag "AI GEN", click any AI Gen project.
   - Verify view instantly switches to `STUDIO_AI_GEN` and loads the project preview + watermark settings.

2. **Legacy Project Click Test**:
   - Click an older AI Gen project (without explicit `type='AIGEN'`).
   - Verify smart detector detects `config.scenes[0].visualPattern` and routes to `STUDIO_AI_GEN` cleanly.

---

## 4. Files Touched

- `frontend/src/App.jsx` — Update `fetchProjectDetail` routing & AI Gen type detection
