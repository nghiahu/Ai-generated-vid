# Dynamic Voiceover Audio Duration Synchronization Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Eliminate hardcoded 10-second scene durations and synchronize scene duration to actual TTS audio length.

**Architecture:** Update `studioAiGenRoute.js` to calculate estimated word-count frames, update `aiGen.js` to lock `durationFrames` to TTS audio duration + 0.3s, and update `StudioAIGen.jsx` player props.

**Tech Stack:** Node.js, Express, React, JavaScript.

---

### Task 1: Update `studioAiGenRoute.js`, `aiGen.js`, and `StudioAIGen.jsx`

**Files:**
- Modify: `backend/routes/studioAiGenRoute.js`
- Modify: `backend/services/aiGen.js`
- Modify: `frontend/src/components/StudioAIGen.jsx`

**Steps:**
1. In `studioAiGenRoute.js`, replace hardcoded `durationFrames: 300` with dynamic word count estimation.
2. In `aiGen.js`, update `scene.durationFrames = Math.round((audioDuration + 0.3) * 30)` and `scene.duration = (scene.durationFrames / 30).toFixed(2)`.
3. In `StudioAIGen.jsx`, ensure `sc.durationFrames` is passed into `scenes` array mapping for Master Player.

---

### Task 2: Verification

**Files:**
- Run production build `npm run build` in `frontend` to verify 0 errors.
