# Redesign Timeline Layouts Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Redesign `TimelineChapters` and `TimelineBeamRail` layouts from scratch in React/Remotion to implement the user's custom, cinematic design ideas:
1. **Timeline Chapters (`TimelineChapters`)**: Elements emerge from the center, move to the top left, shoot a glowing ball along a zig-zag path leaving a trail, and pop open the cards sequentially.
2. **Timeline Beam Rail (`TimelineBeamRail`)**: A horizontal timeline line draws itself while the screen/camera scrolls/pans horizontally. As it reaches each node, a card emerges. At the end, the camera zooms out (scales down) to display all cards side-by-side.

---

### Task 1: Implement Timeline Chapters Redesign

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/TimelineShiftMode.tsx`

**Implementation details:**
- Define the zig-zag path coordinates dynamically based on card count.
- Animate starting node at center (frame 0-12), then slide to top left (frame 12-25).
- Shoot the projectile ball along path segments:
  - Segment 0 (Start to Card 0): frame 25-50. Card 0 pops at frame 50.
  - Segment 1 (Card 0 to Card 1): frame 50-75. Card 1 pops at frame 75.
  - Segment 2 (Card 1 to Card 2): frame 75-100. Card 2 pops at frame 100.
- Render SVG lines drawing sequentially behind the ball.
- Render cards at coordinates using a bouncing spring pop animation.

---

### Task 2: Implement Timeline Beam Rail Redesign

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/IntroEvidenceTimelineMode.tsx`

**Implementation details:**
- Create a wide multi-section container (width `N * 100%` of viewport).
- Animate horizontal panning (`translateX` from `0%` to `-( (N-1) * 100 ) / N%`) and draw the line from left to right.
- Reveal cards sequentially as the line passes the center of the viewport.
- Animate Zoom Out (frame 125-155) by scaling the container down to `0.9 / N` and translating `translateX` to `0%`.

---

### Task 3: Verify compiling and rendering

**Files:**
- Run `npm run build` inside `my-video` folder to ensure it bundles with no errors.
- Test in the browser.
