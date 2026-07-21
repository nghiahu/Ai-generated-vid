# Intro Radar Signal Mode Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Create a dedicated `IntroRadarSignalMode` component for `Intro Radar Signal Image` featuring a 360° rotating radar sweep, sonar target blips, glowing leader lines, and glassmorphic signal info cards.

**Architecture:** Create `IntroRadarSignalMode.tsx` in `my-video/src/compositions/layouts/modes/`, update `intro_radar_signal_image.json` to use `"layoutMode": "intro_radar_signal"`, register the mode in `TemplateLayout.tsx`, and add top-padding rules.

**Tech Stack:** React, Remotion, TypeScript, Inline SVG, CSS-in-JS.

---

### Task 1: Create `IntroRadarSignalMode` Component

**Files:**
- Create: `my-video/src/compositions/layouts/modes/IntroRadarSignalMode.tsx`

**Step 1: Write implementation code**

Create `my-video/src/compositions/layouts/modes/IntroRadarSignalMode.tsx` with:
- Remotion `useCurrentFrame` for continuous 360° radar sweep rotation (`(frame * 3) % 360`).
- Sonar background grid with 3-4 glowing concentric SVG circles and crosshairs.
- Dynamic radar blips with glowing pulse animation when passed by sweep beam.
- 1, 2, or 3 glassmorphic info cards with leader lines pointing to the blips.
- Full theme adaptability using `accentColor`, `isLight`, and `rgb`.

**Step 2: Commit file**

```bash
git add my-video/src/compositions/layouts/modes/IntroRadarSignalMode.tsx
git commit -m "feat: add IntroRadarSignalMode component"
```

---

### Task 2: Register Layout Mode in `TemplateLayout.tsx` and Update `intro_radar_signal_image.json`

**Files:**
- Modify: `my-video/src/compositions/layouts/templates/Opening-Headline/intro_radar_signal_image.json`
- Modify: `my-video/src/compositions/layouts/TemplateLayout.tsx`

**Step 1: Update `intro_radar_signal_image.json`**
Change `"layoutMode"` from `"absolute_cards"` to `"intro_radar_signal"`.

**Step 2: Update `TemplateLayout.tsx`**
- Import `IntroRadarSignalMode`.
- Add `case "intro_radar_signal": return <IntroRadarSignalMode {...modeProps} />;` inside `renderLayoutContent()`.
- Add `layoutMode === "intro_radar_signal"` to top-padding calculations.

**Step 3: Commit changes**

```bash
git add my-video/src/compositions/layouts/templates/Opening-Headline/intro_radar_signal_image.json my-video/src/compositions/layouts/TemplateLayout.tsx
git commit -m "feat: register intro_radar_signal layout mode"
```

---

### Task 3: Verification & Build Check

**Step 1: Run Remotion bundle/typecheck**
Run build or typecheck to verify no TypeScript compilation errors.

**Step 2: Commit final changes**

```bash
git commit --allow-empty -m "fix(layout): verify Intro Radar Signal Mode implementation"
```
