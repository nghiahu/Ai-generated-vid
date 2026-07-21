# Seamless Conic Radar Trail Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Refactor `IntroRadarSignalMode.tsx` radar sweep to use CSS `conic-gradient` hardware-accelerated smooth fade with radial mask clipping, eliminating all discrete path banding lines and providing fluid, natural radar sweep ghosting.

**Architecture:** Replace discrete SVG sector paths inside `my-video/src/compositions/layouts/modes/IntroRadarSignalMode.tsx` with a masked `conic-gradient` layer aligned with the leading scanner line.

**Tech Stack:** React, Remotion, CSS `conic-gradient`, SVG mask/layer.

---

### Task 1: Refactor Sweep Trail in `IntroRadarSignalMode.tsx`

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/IntroRadarSignalMode.tsx`

**Step 1: Write implementation code**
- Replace discrete SVG `<path>` elements with a smooth CSS `conic-gradient` div element centered at radar origin `(centerX, centerY)`.
- Use `maskImage` radial-gradient to clip conic gradient exactly at 310px radar radius.
- Align leading line with gradient start angle for 100% seamless transition.

**Step 2: Commit file**

```bash
git add src/compositions/layouts/modes/IntroRadarSignalMode.tsx
git commit -m "feat: refactor radar sweep trail to seamless conic gradient in IntroRadarSignalMode"
```

---

### Task 2: Build & Verification Check

**Step 1: Run Remotion bundle**
Run `npm run build` inside `my-video` to confirm bundle builds cleanly.

**Step 2: Commit final changes**

```bash
git commit --allow-empty -m "fix(layout): verify seamless conic radar trail implementation"
```
