# Design: Prevent Scene Audio & Visual Cutoff via Max-Signal Duration Engine

**Date:** 2026-07-24  
**Status:** Approved  
**Topic:** Ensure scenes in Remotion rendering (`MainComposition.tsx` & `Root.tsx`) never cut off speech or visuals by taking the maximum duration signal (subtitles max word end, TTS `durationFrames`, and `duration` seconds) plus a 15-frame (0.5s) buffer.

---

## 1. Problem Statement

When exporting videos from Studio AI Gen, scenes were prematurely cut off at 6.0 seconds (180 frames) because `MainComposition.tsx` and `Root.tsx` evaluated `safeParseFloat(scene.duration)` which defaulted to 6.0s. 

Even when TTS audio and subtitles lasted 10-12 seconds (`300-360 frames`), `<Sequence durationInFrames={180}>` forced a hard exit at 6.0 seconds, truncating the last 4-6 seconds of audio and visual content for every scene and shortening a 50s video down to 30s.

---

## 2. Proposed Architecture & System Design

### Component A: `getSceneDurationFrames` Engine (`MainComposition.tsx`)
- Implement `getSceneDurationFrames(scene: any, fps: number = 30): number`:
  1. Calculate max word end timestamp from `subtitlesJson` / `voiceoverTtsJson` (e.g. 10.5s -> 315 frames).
  2. Read backend `durationFrames` (e.g. 330 frames).
  3. Read `scene.duration` in seconds (e.g. 6.0s -> 180 frames).
  4. Compute `maxFrames = Math.max(backendFrames, secFrames, subtitleFrames)`.
  5. Add 15 frames (0.5 seconds buffer) so speech is cleanly finished without truncation.
  6. Return `Math.max(120, maxFrames + 15)`.

### Component B: Synchronization in `Root.tsx` & `MainComposition.tsx`
- Update `calculateMetadata` in `my-video/src/Root.tsx`:
  - Calculate total video duration in frames using `getSceneDurationFrames` for every scene.
  - Ensures Remotion CLI renders the full length of the video (50-52s).
- Update `MainComposition.tsx`:
  - Use `getSceneDurationFrames(scene, fps)` for calculating total duration and sequence durations.

---

## 3. Verification Plan
1. **Render Test**:
   - Verify Remotion CLI renders the complete video without truncating audio or visuals.
2. **Audio & Subtitle Inspection**:
   - Inspect rendered MP4 file to confirm every scene plays completely to the final word.
