# Design: AI Gen Project Restore & Dashboard Navigation Fix

**Date:** 2026-07-25  
**Status:** Approved  
**Topic:** Restore saved Watermark settings (text, position, toggle) and BGM/voice config when opening an AI Gen project from the Projects page, and improve Dashboard card click navigation to open Studio AI Gen directly.

---

## 1. Problem Statement

1. **Watermark & Settings Not Restored**: When opening an existing AI Gen project from the Projects page (`Dashboard.jsx`), `StudioAIGen.jsx` loaded the script and scenes, but failed to restore `watermarkEnabled`, `watermarkText`, `watermarkPosition`, `backgroundMusic`, and `backgroundMusicVolume` from `proj.config.watermark`. As a result, the watermark settings always reset to default (`yupclip.com`, `top-right`).
2. **Dashboard Card Navigation**: On the Projects page (`Dashboard.jsx`), the button for opening an AI Gen project was small ("Open in Studio"). Clicking the card thumbnail didn't intuitively navigate into `StudioAIGen` editor view.

---

## 2. System Design & Architecture

### Component 1 — Full Config Restoration in `StudioAIGen.jsx`
In `StudioAIGen.jsx`, inside `useEffect([projectId])`:
- When loading `proj = await api.getProjectById(projectId)`, extract and restore ALL watermark & audio properties from `proj.config`:
  - `watermarkEnabled` = `proj.config.watermark?.enabled ?? true`
  - `watermarkText` = `proj.config.watermark?.text || "yupclip.com"`
  - `watermarkPosition` = `proj.config.watermark?.position || "top-right"`
  - `bgm` = `proj.config.backgroundMusic || "Chill Lofi Beats"`
  - `bgmVolume` = `proj.config.backgroundMusicVolume ?? 0.025`
  - `voice` = `proj.config.voiceKey || "duythanh"`
- Ensure `saveStudioAiGenConfig` saves these updated watermark & audio settings whenever the user edits them in preview mode or renders.

### Component 2 — Enhanced Dashboard Card Navigation (`Dashboard.jsx`)
- Upgrade AI Gen project cards in `Dashboard.jsx`:
  - Add prominent **"🎬 Mở & Chỉnh sửa Video"** button.
  - Make clicking the project card title or container navigate directly to `StudioAIGen` editor workspace with `setSelectedProjectId(project.id)`.

---

## 3. Verification Plan

1. **Watermark Restoration Test**:
   - Open an AI Gen project, change watermark text to `@channel_test`, position to `bottom-left`.
   - Save or render video.
   - Go to Projects page (`Dashboard`), click on the project to re-open it.
   - Verify watermark text `@channel_test` and position `bottom-left` are correctly restored in the Watermark UI box.

2. **Dashboard Navigation Test**:
   - On Projects page under tag "AI GEN", click "🎬 Mở & Chỉnh sửa Video".
   - Confirm it opens `StudioAIGen` preview mode immediately with video player ready.

---

## 4. Files Touched

- `frontend/src/components/StudioAIGen.jsx` — Restore full watermark/BGM state on project load & save
- `frontend/src/components/Dashboard.jsx` — Enhance card click & button navigation for AI Gen projects
