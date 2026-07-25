# Design: Watermark Controls UI & Duplicate Project Elimination for Studio AI Gen

**Date:** 2026-07-25  
**Status:** Approved  
**Topic:** Provide full UI controls for customizing video watermarks (text, position, toggle, logo) and eliminate the creation of duplicate 6-second ghost draft projects when generating AI Gen videos.

---

## 1. Problem Statement

### Problem A — Duplicate 6-Second Ghost Draft Project
When a user creates a new video in Studio AI Gen, two project entries are saved into the database:
1. An initial blank project created by `App.jsx` (`api.createProject(...)`) which defaults to a 1-scene, 6-second placeholder composition.
2. The actual AI-generated project saved by `studioAiGenRoute.js` (`proj_aigen_xxx`).

When browsing the Projects list, the user sees two projects. Clicking the 6-second project loads a broken/empty 6s video.

### Problem B — Missing Watermark Customization Controls
The Remotion renderer supports watermark overlays (`yupclip.com`), but Studio AI Gen lacks any UI control for:
- Toggling watermark ON/OFF
- Editing custom watermark text
- Selecting watermark position (`top-right`, `top-left`, `bottom-right`, `bottom-left`, `bottom-center`)
- Uploading custom logo image

---

## 2. System Design & Architecture

### Component 1 — Watermark Control Panel UI (`StudioAIGen.jsx`)
Add a dedicated **Watermark Settings Accordion / Modal Section** in the Studio AI Gen control toolbar:
- **Enable / Disable Toggle**: Switch to turn watermark overlay on or off.
- **Text Input**: Input field to customize text (defaults to `"yupclip.com"`).
- **Position Selector**: Dropdown to select placement (`Top Right`, `Top Left`, `Bottom Right`, `Bottom Left`, `Bottom Center`).
- **State Persistence**: Pass `watermarkConfig` into `config` object saved with project to backend (`saveStudioAiGenConfig`) and save to `localStorage`.
- **Live Preview Integration**: Pass `watermark` object in player props so Remotion Player updates watermark overlay live during preview and export.

### Component 2 — Single Project ID Flow (Duplicate Elimination)
- In `App.jsx`, when transitioning to or generating in Studio AI Gen, do **NOT** invoke `api.createProject()`.
- Let `StudioAIGen` manage `projectId`. If `projectId` is missing, generate a single consistent `proj_aigen_timestamp` ID upfront and reuse it across `/plan`, `/generate-scene`, and `/save-config`.
- In `studioAiGenRoute.js`: Ensure `/plan` and `/generate` update the SAME project row in PostgreSQL (`ON CONFLICT (id) DO UPDATE`), preventing duplicate ghost project records.

---

## 3. Verification Plan

1. **Watermark Customization Test**:
   - Change watermark text to `@mybrand`, set position to `bottom-left`, toggle off/on.
   - Verify live Remotion Player preview updates watermark immediately.
   - Trigger MP4 export and verify rendered MP4 contains the customized watermark.

2. **Single Project Record Test**:
   - Click "Tạo Video mới với Studio AI Gen", enter script, click Generate.
   - Navigate to "Dự án" list view.
   - Verify ONLY ONE project record exists in the project list (zero 6-second ghost projects).

---

## 4. Files Touched

- `frontend/src/components/StudioAIGen.jsx` — Add Watermark UI controls & props
- `frontend/src/App.jsx` — Remove duplicate `createProject` call on AI Gen launch
- `backend/routes/studioAiGenRoute.js` — Ensure unified project ID handling
