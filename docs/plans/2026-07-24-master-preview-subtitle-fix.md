# Master Preview Subtitle Fix Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Ensure Master Preview (`MainComposition.tsx`) renders synchronized Karaoke subtitles for AI-generated TSX scene components.

**Architecture:** Wrap AI component and `<DynamicSubtitle />` in React Fragment in `MainComposition.tsx` and pass `subtitlesJson` in `StudioAIGen.jsx`.

**Tech Stack:** React (TSX), Remotion.

---

### Task 1: Update `MainComposition.tsx` & `StudioAIGen.jsx`

**Files:**
- Modify: `my-video/src/compositions/MainComposition.tsx`
- Modify: `frontend/src/components/StudioAIGen.jsx`

**Steps:**
1. In `my-video/src/compositions/MainComposition.tsx`, update `if ((scene as any).Component)` to render `<DynamicSubtitle />` alongside `<Comp />`.
2. In `frontend/src/components/StudioAIGen.jsx`, map `subtitlesJson: sc.subtitlesJson || sc.voiceoverTtsJson` for `MainComposition` inputProps.

---

### Task 2: Verification

**Files:**
- Run production build `npm run build` in `frontend` to verify 0 errors.
