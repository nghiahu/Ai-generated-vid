# Persist Active View and Scene State Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Ensure reloading the page (`F5`) keeps the user on the exact same view, project, and scene without resetting to the Projects Dashboard.

**Architecture:** Sync `view` and `projectId` in `App.jsx` with `localStorage` and URL parameters (`replaceState`), and persist `editorMode` + `activeSceneIndex` in `StudioAIGen.jsx`.

**Tech Stack:** React (Hooks, State), localStorage, HTML5 History API (replaceState), Vite.

---

### Task 1: Persist `view` & `selectedProjectId` in `App.jsx`

**Files:**
- Modify: `frontend/src/App.jsx`

**Steps:**
1. Update `getInitialView` in `App.jsx` to read `?view=...` from URL or `localStorage.getItem("activeView")`. Default to `"PROJECTS"`.
2. Sync `view` and `selectedProjectId` in an `useEffect` hook to update `localStorage` and URL query params using `window.history.replaceState`.
3. Preserve active `view` state during `fetchProjectDetail` async loading so it doesn't flicker back to `"PROJECTS"`.

---

### Task 2: Persist `editorMode` & `activeSceneIndex` in `StudioAIGen.jsx`

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx`

**Steps:**
1. Save `activeSceneIndex` to `localStorage` when user switches scenes.
2. Read stored `activeSceneIndex` on mount so page reload returns to the exact same active scene.

---

### Task 3: Verification & Live Test

**Files:**
- Test page reload (`F5`) behavior and URL param persistence across `STUDIO_AI_GEN`, `WORKSPACE_EDITOR`, and `PROJECTS`.
