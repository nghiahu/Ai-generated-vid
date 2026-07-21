# Custom Video Download Filename & Location Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement native file save dialog with default title-based filename on video download.

**Architecture:** File System Access API + Blob fallback in `MasterPlayer.jsx`.

**Tech Stack:** React, Web APIs.

---

### Task 1: Update `MasterPlayer.jsx` Download Handler

**Files:**
- Modify: `frontend/src/components/MasterPlayer.jsx`
- Modify: `frontend/src/App.jsx`

**Steps:**
1. Pass `projectTitle` to `MasterPlayer`.
2. Replace static link with `handleDownloadVideo` using `showSaveFilePicker`.
3. Sanitize title and save video file cleanly.

---

### Task 2: Verification

- Verify clicking download opens save dialog with title-based filename.
