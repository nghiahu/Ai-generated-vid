# Redesign Timeline Layouts Implementation Plan (Scale Fix)

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Fix the timeline scaling/ratio issue on 9:16 vertical previews so they are readable and visually balanced:
1. **Timeline Chapters (`TimelineChapters`)**: Center left/right cards safely at 32%/68% and scale card width up to `360px` for optimal readability.
2. **Timeline Beam Rail (`TimelineBeamRail`)**:
   - Make the scrolling line static and scroll/translate the cards.
   - During the final zoom-out phase, instead of scaling down a wide row to a tiny line, animate each card's coordinates to arrange them into a centered **vertical stack** (for 9:16 portrait) or **horizontal row** (for 16:9 landscape) at a very readable `0.85`/`0.9` scale.

---

### Task 1: Update Timeline Chapters coordinates

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/TimelineShiftMode.tsx` (adjust coordinates and card width)

---

### Task 2: Implement vertical stack translation zoom-out in Timeline Beam Rail

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/IntroEvidenceTimelineMode.tsx`

---

### Task 3: Verify compiling and rendering

**Files:**
- Run `npm run build` inside `my-video` folder to ensure it bundles with no errors.
- Test in the browser.
