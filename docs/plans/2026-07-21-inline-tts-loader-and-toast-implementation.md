# Inline TTS Loader & Corner Toast Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement inline spinner button for scene TTS regeneration and corner toast notification system.

**Architecture:** React state for `regeneratingSceneId` & `toast`, CSS keyframe animations for spinner and toast.

**Tech Stack:** React, CSS.

---

### Task 1: Add Toast Notification & `regeneratingSceneId` in `App.jsx`

**Files:**
- Modify: `frontend/src/App.jsx`

**Steps:**
1. Add `toast` and `regeneratingSceneId` states.
2. Helper `showToast(message, type)`.
3. Update `handleRegenerateSceneTts` & `confirmRegenerateTts` to use `showToast` instead of `alert()`.
4. Render floating bottom-right `ToastNotification` component.

---

### Task 2: Implement Inline Spinner in `StoryboardEditor.jsx`

**Files:**
- Modify: `frontend/src/components/StoryboardEditor.jsx`

**Steps:**
1. Pass `regeneratingSceneId` to `StoryboardEditor`.
2. Update "Tái tạo giọng đọc" button to display inline CSS spinner when active.

---

### Task 3: Verification

- Verify clicking TTS regeneration displays inline spinner and pops up corner toast upon completion.
