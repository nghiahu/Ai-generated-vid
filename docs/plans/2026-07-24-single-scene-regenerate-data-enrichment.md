# Single Scene Regeneration Data Enrichment Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Ensure 100% complete data payload (voiceoverTtsJson, structured points, alertText, script context) during single scene regeneration.

**Architecture:** Update `generateSingleSceneCode` in `aiGen.js`, pass `script` in `studioAiGenRoute.js`, and update `handleRegenerateSingleScene` in `StudioAIGen.jsx`.

**Tech Stack:** Node.js, Express, React, Gemini API.

---

### Task 1: Update Backend `generateSingleSceneCode` in `aiGen.js` & `studioAiGenRoute.js`

**Files:**
- Modify: `backend/services/aiGen.js`
- Modify: `backend/routes/studioAiGenRoute.js`

**Steps:**
1. In `aiGen.js`, update `generateSingleSceneCode`: set `scene.subtitlesJson = subtitlesJson;` AND `scene.voiceoverTtsJson = subtitlesJson;`.
2. Ensure `points` and `alertText` backfill logic runs cleanly if `scene.points` is empty.
3. Pass `script` from `req.body` into `generateSingleSceneCode` in `studioAiGenRoute.js`.

---

### Task 2: Update Frontend Request in `StudioAIGen.jsx` & `api.js`

**Files:**
- Modify: `frontend/src/services/api.js`
- Modify: `frontend/src/components/StudioAIGen.jsx`

**Steps:**
1. Update `api.generateStudioAiGenScene` in `api.js` to accept and pass `script` parameter.
2. In `StudioAIGen.jsx`, pass `script` when calling `api.generateStudioAiGenScene`.

---

### Task 3: Verification

**Files:**
- Run production build `npm run build` in `frontend` to verify 0 errors.
