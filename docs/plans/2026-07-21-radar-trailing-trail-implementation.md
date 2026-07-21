# Radar Trailing Trail Effect Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Enhance `IntroRadarSignalMode.tsx` with a realistic trailing sweep trail (leading edge bright neon scanline with glow, and a 50° trailing sector arc that fades smoothly from 50% opacity down to 0%).

**Architecture:** Update SVG definition inside `my-video/src/compositions/layouts/modes/IntroRadarSignalMode.tsx` with multi-stop conic sweep sector paths and intense leading edge glow stroke.

**Tech Stack:** React, Remotion, Inline SVG paths & gradients.

---

### Task 1: Update SVG Radar Sweep Trailing Sector in `IntroRadarSignalMode.tsx`

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/IntroRadarSignalMode.tsx`

**Step 1: Write implementation code**
- Create multi-layered trailing sector arcs behind leading sweep line (covering 50° angle back from `sweepAngle`).
- Set opacity stops (0.50 -> 0.30 -> 0.15 -> 0.05 -> 0) across the 50° arc.
- Add extra high-intensity glow stroke on the leading edge scanline.

**Step 2: Commit file**

```bash
git add src/compositions/layouts/modes/IntroRadarSignalMode.tsx
git commit -m "feat: implement radar sweep trailing trail effect in IntroRadarSignalMode"
```

---

### Task 2: Build & Verification Check

**Step 1: Run Remotion bundle**
Run `npm run build` inside `my-video` to confirm bundle builds cleanly.

**Step 2: Commit final changes**

```bash
git commit --allow-empty -m "fix(layout): verify radar sweep trailing trail implementation"
```
