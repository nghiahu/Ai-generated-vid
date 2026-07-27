# Export Video MP4 Button & Render Modal Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement the "Export Video MP4" button, Remotion backend rendering trigger, progress polling modal, and direct MP4 download in Studio AI Gen (`StudioAIGen.jsx`).

**Architecture:** Add `rendering` and `renderProgress` state in `StudioAIGen.jsx`, add Export Video button below Player, integrate `api.triggerRender` and `api.getRenderStatus`, and display Render Progress Modal.

**Tech Stack:** React, Remotion, Express, Axios.

---

### Task 1: Add Render State & Export Button to `StudioAIGen.jsx`

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx`

**Steps:**
1. Add `rendering`, `renderProgress`, `renderedFrames`, `renderTotalFrames`, and `downloadUrl` state in `StudioAIGen.jsx`.
2. Add `handleExportVideo` function to save project config, call `api.triggerRender`, and start polling `api.getRenderStatus`.
3. Add prominent `🎬 Xuất Video MP4` button below the Player preview panel.
4. Render the Render Progress Modal overlay when `rendering === true`.

---

### Task 2: Verification

**Files:**
- Run production build `npm run build` in `frontend` to verify 0 errors.
