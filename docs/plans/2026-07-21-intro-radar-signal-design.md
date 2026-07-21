# Design Document: Dedicated IntroRadarSignalMode for Intro Radar Signal Image

**Date:** 2026-07-21  
**Status:** Approved  
**Target Template:** `Intro Radar Signal Image` (`IntroRadarSignalImage`)

---

## 1. Overview & Problem Statement
Currently, `IntroRadarSignalImage` uses `layoutMode: "absolute_cards"` which falls back to generic bottom-stacked rectangular cards. This does not represent a "Radar Signal" visual ("Tín hiệu rada quét phát hiện thông tin").

This design introduces a dedicated mode renderer **`IntroRadarSignalMode`** with a 360° rotating radar sweep beam, sonar target blips, glowing leader lines, and glassmorphic info cards.

---

## 2. Architecture & File Changes

### 2.1 File Changes
- **`my-video/src/compositions/layouts/templates/Opening-Headline/intro_radar_signal_image.json`**:
  - Change `"layoutMode"` from `"absolute_cards"` to `"intro_radar_signal"`.
- **`my-video/src/compositions/layouts/modes/IntroRadarSignalMode.tsx`** *(NEW)*:
  - Dedicated renderer for `intro_radar_signal` layout mode.
- **`my-video/src/compositions/layouts/TemplateLayout.tsx`**:
  - Import `IntroRadarSignalMode`.
  - Add `case "intro_radar_signal": return <IntroRadarSignalMode {...modeProps} />;` to `renderLayoutContent()`.
  - Add `layoutMode === "intro_radar_signal"` to top-padding calculations (380px default for vertical headline layouts).

---

## 3. Visual & Motion Specification

### 3.1 Layout Structure
- **Header Area**: Top title (`HeadlineText`) and category pill (`CategoryPill`).
- **Center Radar Display**:
  - SVG radar matrix with 3 concentric sonar rings, crosshair axes, and degree tick marks.
  - Rotating 360° radar sweep cone driven by `frame` animation.
  - Dynamic radar blip nodes with pulsing rings.
- **Signal Cards**:
  - Glassmorphic info cards positioned cleanly around the radar with leader lines connecting to the target blips.
  - Smooth delayed reveal (`scale-in` / `fade-in`).

### 3.2 Theme Adaptability
- Uses `accentColor`, `darkAccentColor`, `isLight`, and `rgb` tokens to ensure flawless contrast in dark, light, and stylized themes (Rikkei, Claude, Anime).

---

## 4. Verification Plan
- Render and test `IntroRadarSignalImage` in Remotion player / Storyboard Editor.
- Verify 1, 2, and 3 content points display properly.
- Verify no TypeScript or runtime layout errors.
