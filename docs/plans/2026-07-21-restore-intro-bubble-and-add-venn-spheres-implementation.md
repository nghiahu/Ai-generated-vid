# Restore Intro Bubble & Separate Venn Spheres Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Restore `IntroBubbleImage` (`OrbitalBubblesMode.tsx`) and separate `IntroMetricPillImage` (`VennSpheresMode.tsx`).

**Architecture:** Create 2 distinct mode components and template JSON files.

**Tech Stack:** React, Remotion, SVG, TypeScript.

---

### Task 1: Create `OrbitalBubblesMode.tsx` (`layoutMode: "orbital_bubbles"`)

**Files:**
- Create: `my-video/src/compositions/layouts/modes/OrbitalBubblesMode.tsx`
- Modify: `my-video/src/compositions/layouts/templates/Opening-Headline/intro_bubble_image.json`

---

### Task 2: Create `VennSpheresMode.tsx` (`layoutMode: "venn_spheres"`)

**Files:**
- Create: `my-video/src/compositions/layouts/modes/VennSpheresMode.tsx`
- Create: `my-video/src/compositions/layouts/templates/Opening-Headline/intro_metric_pill_image.json`

---

### Task 3: Register both in `TemplateLayout.tsx`, `index.ts`, and `StoryboardEditor.jsx`

**Files:**
- Modify: `my-video/src/compositions/layouts/TemplateLayout.tsx`
- Modify: `my-video/src/compositions/layouts/index.ts`
- Modify: `frontend/src/components/StoryboardEditor.jsx`

---

### Task 4: Verification

- Verify both layouts render correctly in preview player.
