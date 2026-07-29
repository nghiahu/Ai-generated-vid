# Design Document: CircularProgress Layout for Metrics Visualization

**Date:** 2026-07-29  
**Status:** Approved  
**Target Template:** `Circular Progress` (`CircularProgress`)

---

## 1. Overview & Problem Statement
Currently, we want to design a new layout representing data/metrics, specifically displaying a large circular progress/percentage display with a gradual counting-up/draw-in animation, a heading above it, and a set of square cards arranged side-by-side underneath.

This layout will be called `CircularProgress` (with `layoutMode: "circular_progress"`). The first point's value serves as the percentage value (parsed into a number like 70). The first point's text serves as the description label below the circle. The subsequent points serve as square cards placed horizontally.

---

## 2. Architecture & File Changes

### 2.1 File Changes
- **`my-video/src/compositions/layouts/templates/Opening-Headline/circular_progress.json`** *(NEW)*:
  - Definition of the template JSON. Set `layoutMode` to `"circular_progress"`.
- **`my-video/src/compositions/layouts/modes/CircularProgressMode.tsx`** *(NEW)*:
  - Dedicated renderer for `circular_progress` layout mode.
- **`my-video/src/compositions/layouts/TemplateLayout.tsx`**:
  - Import `CircularProgressMode`.
  - Add `case "circular_progress": return <CircularProgressMode {...modeProps} />;` to `renderLayoutContent()`.
- **`frontend/src/components/StoryboardEditor.jsx`**:
  - Add `CircularProgress` to `"Data / Metrics"` category.
- **`backend/services/contractLoader.js`**:
  - Add `CircularProgress` layout contract under the `LAYOUT_CONTRACTS` registry.
- **`backend/services/ai.js`**:
  - Add `CircularProgress` to prompt guidelines under "Metrics / Statistics / Numbers".

---

## 3. Visual & Motion Specification

### 3.1 Layout Structure
- **Main Container**: Flex column, centered layout, zIndex: 5.
- **Top Area**: Heading (rendered by parent TemplateLayout) + category pill.
- **Middle Area**: Animated SVG Circular Progress.
  - Sized at ~200px diameter.
  - A subtle background track circle.
  - A glowing, gradient progress circle on top.
  - Inside the circle: A large percentage text (e.g., `70%`) counting up.
  - Directly under the circle: A clean, small description text (e.g., "nhân viên dùng AI lén") from Point #1.
- **Bottom Area**: Horizontal stack of Square Cards.
  - Fits up to 2-3 remaining points.
  - Card style: Dark glassmorphic background (`rgba(255, 255, 255, 0.05)` or theme-adaptive) with subtle borders, rounded corners, and shadow.
  - Contains index badge (e.g., `01`, `02`) + text description.

### 3.2 Motion and Timeline
- **Circle path draw-in**:
  - Animates from full `strokeDashoffset` (circumference ≈ 440) to target offset: `Circumference * (1 - targetValue / 100)`.
  - Easing: `Easing.bezier(0.25, 1, 0.5, 1)` (ease-out-quint).
  - Starts at 0.3s (`0.3 * fps`), completes at 1.3s (`1.3 * fps`).
- **Percentage text counter**:
  - Animates from `0` to `targetValue` in sync with the circle path.
- **Square cards transition**:
  - Sequential slide-up/scale-in animations using `AnimatedBlock`.
  - Point #2 card: delay 1.4s.
  - Point #3 card: delay 1.8s.

---

## 4. Verification Plan
- Build `my-video` project bundle cleanly.
- Verify `CircularProgress` renders properly inside Remotion preview.
- Ensure the editor displays `CircularProgress` and backend successfully handles it.
