# Design Document: Dedicated IntroSignalStepsMode for Intro Signal Steps Images

**Date:** 2026-07-21  
**Status:** Approved  
**Target Template:** `Intro Signal Steps Images` (`IntroSignalStepsImages`)

---

## 1. Overview & Problem Statement
Currently, `IntroSignalStepsImages` uses `layoutMode: "vertical_list"`, which renders plain stacked list cards without the staggered step layout or vertical connecting signal rail shown in the design specification.

This design introduces a dedicated mode renderer **`IntroSignalStepsMode`** to display 3 staggered step cards with numbered badges (`01`, `02`, `03`) and an SVG vertical signal rail line linking them.

---

## 2. Architecture & File Changes

### 2.1 File Changes
- **`my-video/src/compositions/layouts/templates/Opening-Headline/intro_signal_steps_images.json`**:
  - Change `"layoutMode"` from `"vertical_list"` to `"intro_signal_steps"`.
- **`my-video/src/compositions/layouts/modes/IntroSignalStepsMode.tsx`** *(NEW)*:
  - Dedicated renderer for `intro_signal_steps` layout mode.
- **`my-video/src/compositions/layouts/TemplateLayout.tsx`**:
  - Import `IntroSignalStepsMode`.
  - Add `case "intro_signal_steps": return <IntroSignalStepsMode {...modeProps} />;` to `renderLayoutContent()`.
  - Add `layoutMode === "intro_signal_steps"` to top-padding calculations (380px default).

---

## 3. Visual & Motion Specification

### 3.1 Layout & Component Mechanics
- **Top Header**: Title (`HeadlineText`) and category pill (`CategoryPill`).
- **Enlarged Staggered Step Group**:
  - Container width ~840px, centered horizontally.
  - **Step 1**: Round badge `01` (56px size, 22px font) + Card 1 with accent gradient (`28px * fontScale` font size, `22px 32px` padding), aligned left.
  - **Step 2**: Round badge `02` + Card 2 indented right (`marginLeft: 60px`).
  - **Step 3**: Round badge `03` + Card 3 aligned left.
- **Vertical Signal Rail**:
  - SVG vertical beam linking badge centers (01 -> 02 -> 03).
  - Progressive strokeDashoffset animation based on Remotion `frame`.
- **Clean Bottom Area**: Voiceover text block inside step renderer is removed so step cards remain prominent and avoid overlapping with bottom subtitles.

### 3.2 Theme Adaptability
- Uses `accentColor`, `darkAccentColor`, `isLight`, and `rgb` tokens for seamless dark/light/custom theme rendering.

---

## 4. Verification Plan
- Build `my-video` project bundle cleanly.
- Verify 1, 2, and 3 step cards render with correct staggered offset and vertical signal rail line.
