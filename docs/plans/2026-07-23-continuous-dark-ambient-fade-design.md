# Design Document: Continuous Dark Ambient Fade Transitions

## Overview
Replaces scene transition brightness flashes with a continuous root ambient background layer. During transitions, only UI content (cards, text, badges) fades in and out smoothly while the dark ambient backdrop remains 100% persistent and static underneath.

## Problem Statement
When transitioning between Remotion scene `<Sequence>` components, fading down scene opacity revealed blank frames or contrast jumps when the next scene appeared with bright background cards. This caused perceived brightness flashing ("nháy sáng").

## Solution Architecture
1. **Persistent Root Ambient Background Layer (`my-video/src/compositions/MainComposition.tsx`)**:
   - Render a permanent, non-resetting ambient background at the top-level `<AbsoluteFill>`:
     - `background`: `radial-gradient(circle at 50% 35%, #0f172a 0%, #090d1a 65%, #030712 100%)`.
     - Ambient Glowing Orbs: 2 floating blurred glowing blobs (`filter: "blur(100px)"`, `opacity: 0.18`) at z-index 0.
2. **UI-Only Transition in `SceneContainer`**:
   - `SceneContainer` wraps scene contents only, without rendering any background box.
   - Entrance: UI content opacity `0.0` -> `1.0`, scale `0.96` -> `1.00`.
   - Exit: UI content opacity `1.0` -> `0.0`, scale `1.00` -> `1.02`.
   - Result: Background stays steady; only UI elements fade smoothly over the persistent dark layer.

## Verification Plan
- Verify Remotion composition TypeScript syntax.
- Confirm zero flash behavior on scene sequence boundaries.
