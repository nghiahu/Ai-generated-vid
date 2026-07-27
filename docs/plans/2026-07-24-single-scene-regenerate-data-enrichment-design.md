# Design: Single Scene Regeneration Data Enrichment & Subtitle Synchronization

**Date:** 2026-07-24  
**Status:** Approved  
**Topic:** Ensure complete scene payload (points structure, alertText, script context, voiceoverTtsJson synchronization) during single scene regeneration in Studio AI Gen.

---

## 1. Problem Statement

When users triggered single scene regeneration ("Sinh lại phân cảnh này"), three data deficiencies occurred:
1. **Missing `voiceoverTtsJson` Alias**: `generateSingleSceneCode` in `aiGen.js` populated `scene.subtitlesJson` but did not assign `scene.voiceoverTtsJson`, causing Karaoke subtitle components to lose word timing data after single-scene regeneration.
2. **Loss of Structured Points & Alert Text**: If `scene.points` was empty or unstructured, Gemini received minimal descriptors, generating simplified or generic layouts.
3. **Lack of Global Script Context**: Single scene requests sent only the isolated scene voiceover without the full video script context or topic framing.

---

## 2. Proposed Architecture & System Design

### Component A: Backend Payload Enrichment in `generateSingleSceneCode` (`aiGen.js`)
- In `backend/services/aiGen.js`:
  - Automatically backfill structured `points` and `alertText` from `scene.voiceover` if `points` is missing or empty.
  - Set both `scene.subtitlesJson` and `scene.voiceoverTtsJson` to the generated alignment object.
  - Include global `script` context in `generateTSXCodeForScene` prompt if provided in `req.body`.

### Component B: Frontend Request & State Sync (`StudioAIGen.jsx` & `api.js`)
- In `frontend/src/components/StudioAIGen.jsx`:
  - Include `script` in the payload passed to `api.generateStudioAiGenScene`.
  - Preserve `voiceoverTtsJson` and structured `points` on the returned regenerated scene object.

---

## 3. Verification Plan
1. **Data Preservation Test**:
   - Regenerate a single scene and verify returned `scene` object contains `subtitlesJson`, `voiceoverTtsJson`, `points`, and `compiledJS`.
2. **Subtitle & Player Verification**:
   - Verify Karaoke subtitles render cleanly on regenerated scene in single scene preview and master preview.
