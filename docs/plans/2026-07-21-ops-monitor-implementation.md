# OPS Monitor Mode Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Create a dedicated `OpsMonitorMode` component for `OPS Monitor Hook` featuring a split-panel monitoring dashboard with 3 Metric Cards on the left and 8 SYS progress bars on the right, plus a `● MONITORING LIVE` footer status bar.

**Architecture:** Create `OpsMonitorMode.tsx` in `my-video/src/compositions/layouts/modes/`, update `ops_monitor_hook.json` to use `"layoutMode": "ops_monitor"`, register in `TemplateLayout.tsx`.

**Tech Stack:** React, Remotion, TypeScript, Inline SVG.

---

### Task 1: Create `OpsMonitorMode` Component

**Files:**
- Create: `my-video/src/compositions/layouts/modes/OpsMonitorMode.tsx`

**Step 1: Write implementation code**
Create `my-video/src/compositions/layouts/modes/OpsMonitorMode.tsx` with:
- Main dark glassmorphic container panel.
- **Left column (38%)**: 3 Metric Cards (`METRIC-1`, `METRIC-2`, `METRIC-3`) using text from `otherComps[0..2]`, each with small accent label + large bold text, staggered `scale-in` animation.
- **Right column (62%)**: 8 SYS progress bars (`SYS-1` through `SYS-8`) with fixed realistic % values `[46, 77, 84, 63, 32, 32, 80, 82]`, animated bar fill via `interpolate(frame, [20, 80], [0, targetPct])`, gradient red→orange fill.
- **Footer**: `● MONITORING LIVE` red dot + accent label at bottom of panel.
- Theme adaptability (`accentColor`, `rgb`, `isLight`, `styles.fontFamily`).

**Step 2: Commit file**

```bash
git add src/compositions/layouts/modes/OpsMonitorMode.tsx
git commit -m "feat: add OpsMonitorMode component"
```

---

### Task 2: Register Layout Mode in `TemplateLayout.tsx` and Update `ops_monitor_hook.json`

**Files:**
- Modify: `my-video/src/compositions/layouts/templates/Opening-Headline/ops_monitor_hook.json`
- Modify: `my-video/src/compositions/layouts/TemplateLayout.tsx`

**Step 1: Update `ops_monitor_hook.json`**
Change `"layoutMode"` from `"centered_text"` to `"ops_monitor"`.

**Step 2: Update `TemplateLayout.tsx`**
- Import `OpsMonitorMode`.
- Add `case "ops_monitor": return <OpsMonitorMode {...modeProps} />;` inside `renderLayoutContent()`.
- Add `layoutMode === "ops_monitor"` to top-padding calculations.

**Step 3: Commit changes**

```bash
git add src/compositions/layouts/templates/Opening-Headline/ops_monitor_hook.json src/compositions/layouts/TemplateLayout.tsx
git commit -m "feat: register ops_monitor layout mode"
```

---

### Task 3: Build & Verification Check

**Step 1: Run Remotion bundle**
Run `npm run build` inside `my-video` to verify clean build.

**Step 2: Commit final changes**

```bash
git commit --allow-empty -m "fix(layout): verify OPS Monitor Mode implementation"
```
