# Intro Signal Steps Mode Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Create a dedicated `IntroSignalStepsMode` component for `Intro Signal Steps Images` featuring 3 staggered step cards with numbered badges (`01`, `02`, `03`) and a vertical connecting SVG signal rail.

**Architecture:** Create `IntroSignalStepsMode.tsx` in `my-video/src/compositions/layouts/modes/`, update `intro_signal_steps_images.json` to use `"layoutMode": "intro_signal_steps"`, register the mode in `TemplateLayout.tsx`, and set padding rules.

**Tech Stack:** React, Remotion, TypeScript, Inline SVG.

---

### Task 1: Create `IntroSignalStepsMode` Component

**Files:**
- Create: `my-video/src/compositions/layouts/modes/IntroSignalStepsMode.tsx`

**Step 1: Write implementation code**
Create `my-video/src/compositions/layouts/modes/IntroSignalStepsMode.tsx` with:
- Staggered step card layout: Step 1 (accent highlight, aligned left), Step 2 (dark card, indented right by 60px), Step 3 (glowing border card, aligned left).
- Numbered circular badges (`01`, `02`, `03`).
- Vertical SVG Signal Rail connecting badge centers with progressive stroke drawing animation.
- Theme adaptability (`accentColor`, `isLight`, `rgb`).

**Step 2: Commit file**

```bash
git add src/compositions/layouts/modes/IntroSignalStepsMode.tsx
git commit -m "feat: add IntroSignalStepsMode component"
```

---

### Task 2: Register Layout Mode in `TemplateLayout.tsx` and Update `intro_signal_steps_images.json`

**Files:**
- Modify: `my-video/src/compositions/layouts/templates/Opening-Headline/intro_signal_steps_images.json`
- Modify: `my-video/src/compositions/layouts/TemplateLayout.tsx`

**Step 1: Update `intro_signal_steps_images.json`**
Change `"layoutMode"` from `"vertical_list"` to `"intro_signal_steps"`.

**Step 2: Update `TemplateLayout.tsx`**
- Import `IntroSignalStepsMode`.
- Add `case "intro_signal_steps": return <IntroSignalStepsMode {...modeProps} />;` inside `renderLayoutContent()`.
- Add `layoutMode === "intro_signal_steps"` to top-padding calculations.

**Step 3: Commit changes**

```bash
git add src/compositions/layouts/templates/Opening-Headline/intro_signal_steps_images.json src/compositions/layouts/TemplateLayout.tsx
git commit -m "feat: register intro_signal_steps layout mode"
```

---

### Task 3: Build & Verification Check

**Step 1: Run Remotion bundle**
Run `npm run build` inside `my-video` to verify clean build.

**Step 2: Commit final changes**

```bash
git commit --allow-empty -m "fix(layout): verify Intro Signal Steps Mode implementation"
```
