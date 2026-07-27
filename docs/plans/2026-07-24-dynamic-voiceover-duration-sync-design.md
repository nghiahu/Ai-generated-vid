# Design: Dynamic Voiceover Audio Duration Synchronization

**Date:** 2026-07-24  
**Status:** Approved  
**Topic:** Eliminate hardcoded 10-second (300 frames) scene duration in `studioAiGenRoute.js` and strictly synchronize scene duration frames to the actual generated TTS audio file duration + 0.3s padding.

---

## 1. Problem Statement

In Studio AI Gen, every scene was fixed at roughly 10 seconds (300 frames) because `studioAiGenRoute.js` hardcoded `durationFrames: 300` during initial scene planning. 

When TTS audio was generated (e.g. 4.2 seconds audio duration), the scene remained locked to 300 frames (10 seconds), causing a 5.8-second frozen pause after the voiceover finished.

---

## 2. Proposed Architecture & System Design

### Component A: Dynamic Word-Count Duration Calculation in `studioAiGenRoute.js`
- In `backend/routes/studioAiGenRoute.js`:
  - Remove hardcoded `durationFrames: 300`.
  - Dynamically calculate estimated initial duration: `wordCount = voiceover.trim().split(/\s+/).length`.
  - Set initial estimated `durationFrames = Math.round(Math.max(3.5, wordCount / 2.7) * 30)`.

### Component B: Strict Audio Duration Lock in `aiGen.js` (`generateSingleSceneCode`)
- In `backend/services/aiGen.js`:
  - When TTS audio generates the `.wav` file, update `scene.durationFrames`:
    `scene.durationFrames = Math.round((audioDuration + 0.3) * 30);`
  - Update `scene.duration = (scene.durationFrames / 30).toFixed(2)` so both `duration` seconds and `durationFrames` reflect exact audio length.

### Component C: Player Input Synchronization in `StudioAIGen.jsx`
- In `frontend/src/components/StudioAIGen.jsx`:
  - Calculate `duration: sc.durationFrames ? sc.durationFrames / 30 : Math.max(3.5, (sc.voiceover || "").split(" ").length / 2.7)` when mapping loaded scenes for player preview.

---

## 3. Verification Plan
1. **Audio Sync Test**:
   - Generate TTS audio for a short 4-second voiceover and verify `durationFrames` is set to ~135 frames (~4.5s) instead of 300 frames.
2. **Build Verification**:
   - Run production build `npm run build` in `frontend` to verify zero errors.
