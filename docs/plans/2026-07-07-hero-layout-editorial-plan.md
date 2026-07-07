# Implementation Plan: Hero Title Editorial Layout Upgrade

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Modify the `HeroLayout` in `my-video/src/compositions/layouts/opening/HeroLayout.tsx` to use a high-fidelity editorial layout in vertical mode.

---

### Task 1: Redesign HeroLayout in my-video

**Files:**
- Modify: `my-video/src/compositions/layouts/opening/HeroLayout.tsx`

**Step 1: Check isVertical and render editorial elements**
Update `HeroLayout.tsx` to handle vertical aspect ratios. Add a progress bar overlay, category tag, large title scaling, and an accent colored horizontal divider line.

---

### Task 2: Verification & End-to-End Testing

**Step 1: Run TypeScript check**
Run `npx tsc --noEmit` inside `my-video`.
