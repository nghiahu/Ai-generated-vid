# Versus Timeline Shift Layout Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Create `TimelineShiftMode.tsx` and `split_band_checklist.json` to implement the Versus Timeline Shift layout.

**Architecture:** Build a 2-staggered card layout inside a glass box connected by a dashed SVG line.

**Tech Stack:** React, Remotion, SVG, TypeScript.

---

### Task 1: Create `split_band_checklist.json` template

**Files:**
- Create: `my-video/src/compositions/layouts/templates/Opening-Headline/split_band_checklist.json`

---

### Task 2: Create `TimelineShiftMode.tsx`

**Files:**
- Create: `my-video/src/compositions/layouts/modes/TimelineShiftMode.tsx`

---

### Task 3: Register `TimelineShiftMode` in `TemplateLayout.tsx` and `index.ts`

**Files:**
- Modify: `my-video/src/compositions/layouts/TemplateLayout.tsx`
- Modify: `my-video/src/compositions/layouts/index.ts`

---

### Task 4: Verification

- Verify `SplitBandChecklist` preview player matches reference image.
