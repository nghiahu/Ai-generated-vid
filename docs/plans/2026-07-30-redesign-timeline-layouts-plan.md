# Redesign Timeline Layouts Implementation Plan (Grid Zoom Fix)

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Fix the timeline alignment and grid zoom-out structure for **Timeline Beam Rail**:
- Align node dots and cards perfectly on the vertical axis.
- Render cards directly above the center nodes during panning.
- During the final zoom-out phase, arrange cards into a grid: 2 columns on the top row (above the center line) and the 3rd card on the bottom row (centered below the line), with a highly legible card size of `300px` at `0.9` scale.

---

### Task 1: Rewrite IntroEvidenceTimelineMode.tsx with perfect grid alignment and 2-row zoom-out

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/IntroEvidenceTimelineMode.tsx`

---

### Task 2: Verify compiling and rendering

**Files:**
- Run `npm run build` inside `my-video` folder to ensure it bundles with no errors.
- Test in the browser.
