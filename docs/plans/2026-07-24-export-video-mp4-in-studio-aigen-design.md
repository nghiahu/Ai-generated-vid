# Design: Export Video MP4 Button & Render Progress Modal in Studio AI Gen

**Date:** 2026-07-24  
**Status:** Approved  
**Topic:** Add a prominent "Export Video MP4" button, Remotion backend rendering integration, real-time render progress polling modal, and direct MP4 file download link in Studio AI Gen (`StudioAIGen.jsx`).

---

## 1. Problem Statement

In `StudioAIGen.jsx`, users could preview videos live in the Remotion Player component, but there was no explicit button to render and export the final MP4 video file to their local computer.

---

## 2. Proposed Architecture & System Design

### Component A: Export Video MP4 Button (`StudioAIGen.jsx`)
- Position a high-impact gradient button below the Player preview panel in `StudioAIGen.jsx`:
  `🎬 Xuất Video MP4 (1080x1920 FHD)`
- Clicking the button triggers `handleRenderVideo`:
  - Saves the latest project configuration (scenes, script, theme, voice, watermark) to database.
  - Calls `api.triggerRender(activeProjectId)` to start Remotion backend rendering.
  - Sets `rendering = true` to display the Render Progress Modal.

### Component B: Render Progress & Polling Modal (`StudioAIGen.jsx`)
- Render a modal overlay displaying real-time rendering progress:
  - Polls `api.getRenderStatus(projectId, renderId)` every 1.5 seconds.
  - Updates progress bar (`renderProgress` %, rendered frames / total frames).
  - Displays status: `🚀 Đang kết xuất Video MP4 (1080x1920)... 45% (Frame 135/300)`.

### Component C: Direct MP4 Download & Download Modal
- Upon 100% completion (`renderStatus.status === "completed"`):
  - Display green success badge: `✅ KẾT XUẤT VIDEO THÀNH CÔNG!`.
  - Provide prominent **`⬇️ Tải Video MP4 Về Máy`** download button linking to `http://localhost:5000${videoUrl}` with `download` attribute.

---

## 3. Verification Plan
1. **Render Trigger Test**:
   - Click "Xuất Video MP4" in Studio AI Gen and verify backend receives render request.
2. **Progress Polling & Download Test**:
   - Verify modal shows rendering progress bar from 0% to 100% and displays download link upon completion.
