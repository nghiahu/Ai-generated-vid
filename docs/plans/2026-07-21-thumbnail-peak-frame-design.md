# Design Document: Thumbnail Peak Frame Preview Optimization

**Date:** 2026-07-21  
**Status:** Approved  
**Target File:** `frontend/src/components/Dashboard.jsx`

---

## 1. Overview & Problem Statement
Currently, static video thumbnails in `Dashboard.jsx` render at `Frame 0` (0.0s). At 0.0s, layout elements (cards, icons, progress bars, radar sweeps) are mid-animation or opacity 0, causing video card previews in the gallery to appear dark and empty with only top headings visible.

---

## 2. Technical Solution

### 2.1 Setting `initialFrame` to Peak Frame (~2.0s)
- Add `initialFrame={Math.min(60, Math.round(durationInFrames * 0.45))}` to the static `<Player />` component in `Dashboard.jsx`.
- **Zero Impact on Video Playback**:
  - The static `<Player />` is only used when `playingProjectId !== project.id` (thumbnail preview mode).
  - When the user clicks the Play button, `playingProjectId` switches to `DashboardProjectPlayer`, which plays the video from Frame 0 (`current.play()`) smoothly.

---

## 3. Verification Plan
- Verify preview player in `Dashboard.jsx` renders at frame 60 (2.0s).
- Verify clicking Play starts video playback from the beginning cleanly.
