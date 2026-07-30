# Timeline Layouts Missing Templates Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Create the missing template files for `TimelineBeamRail` and `TimelineChapters`, fix registry overrides, and implement custom timeline special effects (growing line, traveling beam particle, flowing dashed connector, and bobbing cards) to resolve the blank screens and make them premium.

**Architecture:**
- Remove the legacy override key `timelinechapters: "Timeline"` from `my-video/src/compositions/layouts/index.ts`.
- Create two new JSON templates under `my-video/src/compositions/layouts/templates/Timeline/`:
  1. `timeline_beam_rail.json` (ID: `TimelineBeamRail`, layoutMode: `evidence_timeline`)
  2. `timeline_chapters.json` (ID: `TimelineChapters`, layoutMode: `timeline_shift`)
- Upgrade `IntroEvidenceTimelineMode.tsx` to animate the vertical rail height and draw a traveling light beam particle.
- Upgrade `TimelineShiftMode.tsx` to animate the SVG dash offset and bob the comparison cards.

---

### Task 1: Fix registry overrides and create templates

**Files:**
- Modify: `my-video/src/compositions/layouts/index.ts` (remove `timelinechapters: "Timeline"`)
- Create: `my-video/src/compositions/layouts/templates/Timeline/timeline_beam_rail.json`
- Create: `my-video/src/compositions/layouts/templates/Timeline/timeline_chapters.json`

*(Templates JSON contents are specified in implementation_plan.md)*

---

### Task 2: Implement dynamic animations in mode renderers

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/IntroEvidenceTimelineMode.tsx` (growing line & traveling beam)
- Modify: `my-video/src/compositions/layouts/modes/TimelineShiftMode.tsx` (flowing SVG dash & bobbing cards)

---

### Task 3: Verify compiling and rendering

**Files:**
- Run `npm run build` inside `my-video` folder to ensure it bundles with no errors.
- Test in the browser.
