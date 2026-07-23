# Design Document: Smooth Scene Transitions (Cross-Blur & Depth Scale Zoom)

## Overview
Replaces the white flash / frame gap during Remotion scene transitions with a premium, seamless Cross-Blur & Depth Scale Zoom animation.

## Problem Statement
When transitioning between scenes in `MainComposition.tsx`, `SceneContainer` faded `opacity` down to `0` over `0.33s`. This created an empty gap frame revealing the white or unstyled canvas background underneath, appearing as a harsh white flash.

## Solution Architecture
1. **SceneContainer Motion Curve (`my-video/src/compositions/MainComposition.tsx`)**:
   - `transitionFrames`: Math.round(fps * 0.35) (~10-11 frames at 30fps).
   - Entrance Curve: Cubic Ease-Out (`progress = 1 - (1 - t)^3`).
     - Scale: `0.95` -> `1.00`.
     - Blur: `12px` -> `0px`.
     - Opacity: `0.0` -> `1.0`.
   - Exit Curve: Cubic Ease-In (`progress = t^2.5`).
     - Scale: `1.00` -> `1.04` (camera zooms forward into scene).
     - Blur: `0px` -> `12px`.
     - Opacity: `1.0` -> `0.0`.
2. **Zero-Flash GPU Layer Optimization**:
   - Explicit solid dark background on `<AbsoluteFill>`: `backgroundColor: "#090d1a"`.
   - Hardware acceleration styles on `SceneContainer`: `willChange: "transform, opacity, filter"`, `backfaceVisibility: "hidden"`, `transformStyle: "preserve-3d"`.

## Verification Strategy
- Test Remotion composition rendering and component build.
- Confirm clean syntax and no TypeScript / React errors.
