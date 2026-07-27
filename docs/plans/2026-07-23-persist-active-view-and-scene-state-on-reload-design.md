# Design: Persist Active View and Scene State Across Page Reloads

**Date:** 2026-07-23  
**Status:** Approved  
**Topic:** Eliminate page resets to Dashboard / Project List on browser reload (`F5`) and preserve active view, active project ID, and selected scene state in Studio AI Gen and Workspace Editor.

---

## 1. Problem Statement

When the user reloads the browser (`F5`), `App.jsx` initializes `view` state to `"PROJECTS"` by default. If the user was editing a video in `Studio AI Gen` (`view = "STUDIO_AI_GEN"`) or editing a storyboard in `Workspace Editor` (`view = "WORKSPACE_EDITOR"`), the application resets back to the Dashboard (Projects List) page.

---

## 2. Proposed Architecture & System Design

### Component A: App View & Project Persistence (`App.jsx`)
- **State Initialization**:
  - Read initial `view` state from URL parameter (`?view=...`) or `localStorage.getItem("activeView")`. Fall back to `"PROJECTS"` only if none is found.
  - Read initial `selectedProjectId` from URL parameter (`?projectId=...`) or `localStorage.getItem("activeProjectId")`.
- **URL & Storage Synchronization**:
  - Update `localStorage.setItem("activeView", view)` whenever `view` state changes.
  - Sync URL search parameters (`?view=...&projectId=...`) using `window.history.replaceState` without causing page re-renders.

### Component B: Studio AI Gen Scene & Mode Persistence (`StudioAIGen.jsx`)
- **State Preservation**:
  - Store `editorMode` (`"setup"` vs `"preview"`) and `activeSceneIndex` in `localStorage` (`studio_aigen_editor_mode`, `studio_aigen_active_scene`).
  - Upon page reload, if `projectId` or raw scenes exist, restore `editorMode` to `"preview"` and jump directly to the exact scene the user was inspecting.

### Component C: Flickering Prevention During Fetch
- Maintain the restored `view` state during `api.getProjectById(id)` async fetching on initial mount instead of temporarily displaying the Dashboard list.

---

## 3. Verification Plan
1. **URL & Storage Sync Test**:
   - Open `Studio AI Gen`, verify URL updates to `?view=STUDIO_AI_GEN` and `localStorage` stores `activeView`.
2. **Reload Test (`F5`)**:
   - Press reload on `Studio AI Gen` preview screen. Verify app stays on `Studio AI Gen` at exact same scene index.
