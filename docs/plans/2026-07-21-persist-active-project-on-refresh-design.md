# Design Document: Persist Active Project on Page Refresh (F5)

**Date:** 2026-07-21  
**Status:** Approved  
**Target File:** `frontend/src/App.jsx`

---

## 1. Overview & Problem Statement
Currently, when a user is editing a video storyboard in `WORKSPACE_EDITOR` and presses F5 (page refresh), all React state in memory (`selectedProjectId`, `currentProject`, `view`) resets to `null` and `"PROJECTS"`, causing the app to return to the Projects Dashboard page.

---

## 2. Solution Architecture

### 2.1 Dual Persistence Strategy (URL Query Params + `localStorage`)
1. **Initial Mount Recovery**:
   - Check `URLSearchParams` for `?projectId=xyz`.
   - Fallback to `localStorage.getItem("activeProjectId")`.
   - If a saved `projectId` is found, initialize `selectedProjectId` state with this ID on load.
2. **State Synchronization**:
   - Whenever `selectedProjectId` is set to a valid ID, write it to `localStorage.setItem("activeProjectId", id)` and sync browser URL `window.history.replaceState({}, "", "?projectId=" + id)`.
   - When exiting back to Dashboard ("PROJECTS"), clear `localStorage.removeItem("activeProjectId")` and restore URL to `/`.

---

## 3. Verification Plan
- Select a project to enter `WORKSPACE_EDITOR`.
- Press F5 (refresh).
- Verify the app automatically restores `WORKSPACE_EDITOR` with the exact active project and scene details intact.
