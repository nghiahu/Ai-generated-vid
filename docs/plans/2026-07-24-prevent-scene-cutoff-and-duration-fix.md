# Prevent Scene Cutoff Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Eliminate scene truncation and audio cutoff in Remotion rendering by implementing the `getSceneDurationFrames` max-signal duration engine.

**Architecture:** Update `MainComposition.tsx` and `Root.tsx` to use `getSceneDurationFrames(scene, fps)` which computes max(subtitleEnd, durationFrames, secFrames) + 15 frames buffer.

**Tech Stack:** TypeScript, Remotion, React.

---

### Task 1: Update `MainComposition.tsx` & `Root.tsx` with `getSceneDurationFrames`

**Files:**
- Modify: `my-video/src/compositions/MainComposition.tsx`
- Modify: `my-video/src/Root.tsx`

**Steps:**
1. Export `getSceneDurationFrames(scene: any, fps: number)` in `MainComposition.tsx`.
2. Update `totalDurationFrames` calculation in `MainComposition.tsx` using `getSceneDurationFrames`.
3. Update scene sequence loop in `MainComposition.tsx` to use `getSceneDurationFrames`.
4. Update `calculateMetadata` in `Root.tsx` to sum `getSceneDurationFrames` for all scenes.

---

### Task 2: Verification

**Files:**
- Run production build `npm run build` in `frontend` to verify 0 errors.
