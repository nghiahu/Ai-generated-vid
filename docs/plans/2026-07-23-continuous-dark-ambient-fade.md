# Continuous Dark Ambient Fade Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Eliminate transition brightness flashes in Remotion scene transitions by rendering a persistent root dark ambient backdrop while animating UI elements in `SceneContainer`.

**Architecture:** Add a permanent background gradient and ambient orb layer to `MainComposition.tsx` at root `<AbsoluteFill>`, then update `SceneContainer` to only fade UI cards/content smoothly over the persistent background layer.

**Tech Stack:** React, Remotion (`AbsoluteFill`, `useCurrentFrame`, `useVideoConfig`).

---

### Task 1: Update MainComposition Root Layer & SceneContainer

**Files:**
- Modify: `my-video/src/compositions/MainComposition.tsx`

**Step 1: Implement Persistent Dark Ambient Background in MainComposition**
Add persistent background styling and glowing ambient orbs at root `<AbsoluteFill>` level.

**Step 2: Refactor SceneContainer for Content-Only Transitions**
Update `SceneContainer` to smoothly animate UI card opacity and scale while preserving continuous background visibility underneath.

**Step 3: Verification & Compilation Check**
Run TypeScript check `npx tsc --noEmit` in `my-video/` to verify zero build or component syntax errors.
