# Intro Map Pins Mode Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Create a dedicated `IntroMapPinsMode` component for `MAP Pins Hook` and `Intro MAP Pins Image` featuring a Location Path window frame, SVG grid background, animated curved dashed route line, 3 glowing teardrop pins (`PIN-1`, `PIN-2`, `PIN-3`), and 3 bottom `LOCATION 1-2-3` cards.

**Architecture:** Create `IntroMapPinsMode.tsx` in `my-video/src/compositions/layouts/modes/`, update `map_pins_hook.json` and `intro_map_pins_image.json` to use `"layoutMode": "intro_map_pins"`, register the mode in `TemplateLayout.tsx`, and set padding rules.

**Tech Stack:** React, Remotion, TypeScript, Inline SVG.

---

### Task 1: Create `IntroMapPinsMode` Component

**Files:**
- Create: `my-video/src/compositions/layouts/modes/IntroMapPinsMode.tsx`

**Step 1: Write implementation code**
Create `my-video/src/compositions/layouts/modes/IntroMapPinsMode.tsx` with:
- Main dark Location Path frame with `● LOCATION PATH` red status indicator and `pins` badge.
- SVG grid background and animated curved dashed bezier route path.
- 3 glowing teardrop location pin markers with `PIN-1`, `PIN-2`, `PIN-3` cards and path anchor dots.
- Bottom summary bar with 3 `LOCATION 1`, `LOCATION 2`, `LOCATION 3` cards.
- Theme adaptability (`accentColor`, `isLight`, `rgb`).

**Step 2: Commit file**

```bash
git add src/compositions/layouts/modes/IntroMapPinsMode.tsx
git commit -m "feat: add IntroMapPinsMode component"
```

---

### Task 2: Register Layout Mode in `TemplateLayout.tsx` and Update `map_pins_hook.json` & `intro_map_pins_image.json`

**Files:**
- Modify: `my-video/src/compositions/layouts/templates/Opening-Headline/map_pins_hook.json`
- Modify: `my-video/src/compositions/layouts/templates/Opening-Headline/intro_map_pins_image.json`
- Modify: `my-video/src/compositions/layouts/TemplateLayout.tsx`

**Step 1: Update JSON templates**
- Change `"layoutMode"` in `map_pins_hook.json` from `"centered_text"` to `"intro_map_pins"`.
- Change `"layoutMode"` in `intro_map_pins_image.json` from `"absolute_cards"` to `"intro_map_pins"`.

**Step 2: Update `TemplateLayout.tsx`**
- Import `IntroMapPinsMode`.
- Add `case "intro_map_pins": return <IntroMapPinsMode {...modeProps} />;` inside `renderLayoutContent()`.
- Add `layoutMode === "intro_map_pins"` to top-padding calculations.

**Step 3: Commit changes**

```bash
git add src/compositions/layouts/templates/Opening-Headline/map_pins_hook.json src/compositions/layouts/templates/Opening-Headline/intro_map_pins_image.json src/compositions/layouts/TemplateLayout.tsx
git commit -m "feat: register intro_map_pins layout mode for map pins templates"
```

---

### Task 3: Build & Verification Check

**Step 1: Run Remotion bundle**
Run `npm run build` inside `my-video` to verify clean build.

**Step 2: Commit final changes**

```bash
git commit --allow-empty -m "fix(layout): verify Intro MAP Pins Mode implementation"
```
