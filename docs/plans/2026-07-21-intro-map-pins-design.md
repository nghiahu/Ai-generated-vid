# Design Document: Dedicated IntroMapPinsMode for MAP Pins Hook & Intro MAP Pins Image

**Date:** 2026-07-21  
**Status:** Approved  
**Target Templates:** `MAP Pins Hook` (`MapPinsHook`), `Intro MAP Pins Image` (`IntroMapPinsImage`)

---

## 1. Overview & Problem Statement
Currently, `MapPinsHook` uses `layoutMode: "centered_text"` and `IntroMapPinsImage` uses `layoutMode: "absolute_cards"`, both failing to render the specified Location Path window frame layout with 3 location pins and 3 bottom summary cards.

This design introduces a dedicated mode renderer **`IntroMapPinsMode`** to display the complete Location Path UI (grid mesh background, animated curved dashed route path, 3 glowing teardrop location pins with `PIN-1`, `PIN-2`, `PIN-3` cards, and 3 bottom `LOCATION 1-2-3` cards).

---

## 2. Architecture & File Changes

### 2.1 File Changes
- **`my-video/src/compositions/layouts/templates/Opening-Headline/map_pins_hook.json`**:
  - Change `"layoutMode"` from `"centered_text"` to `"intro_map_pins"`.
- **`my-video/src/compositions/layouts/templates/Opening-Headline/intro_map_pins_image.json`**:
  - Change `"layoutMode"` from `"absolute_cards"` to `"intro_map_pins"`.
- **`my-video/src/compositions/layouts/modes/IntroMapPinsMode.tsx`** *(NEW)*:
  - Dedicated renderer for `intro_map_pins` layout mode.
- **`my-video/src/compositions/layouts/TemplateLayout.tsx`**:
  - Import `IntroMapPinsMode`.
  - Add `case "intro_map_pins": return <IntroMapPinsMode {...modeProps} />;` to `renderLayoutContent()`.
  - Add `layoutMode === "intro_map_pins"` to top-padding calculations (380px default).

---

## 3. Visual & Motion Specification

### 3.1 Layout & Component Mechanics
- **Header Area**: Title (`HeadlineText`) and category pill (`CategoryPill`).
- **Single Pin Set Location Path Window Frame**:
  - Dark glassmorphic container (~880px max width, 560px height).
  - Header bar: `● LOCATION PATH` red status indicator on left, `pins` badge on right.
  - Expanded grid mesh background canvas (480px height).
  - Curved dashed bezier route path (`strokeDasharray="14 10"`) drawn dynamically using Remotion `frame`.
  - **3 Enlarged Location Pins**:
    - **Pin 1 (Left)**: Glowing teardrop pin icon + red path anchor dot + enlarged `PIN-1` badge card.
    - **Pin 2 (Middle-Top)**: Glowing teardrop pin icon + enlarged `PIN-2` badge card.
    - **Pin 3 (Right-Bottom)**: Glowing teardrop pin icon + enlarged `PIN-3` badge card.
- **Clean Single Layout**: Duplicate bottom location summary cards are removed to eliminate repetitive text and maximize space for prominent map pin cards.

### 3.2 Theme Adaptability
- Uses `accentColor`, `darkAccentColor`, `isLight`, and `rgb` tokens for seamless dark/light/custom theme rendering.

---

## 4. Verification Plan
- Build `my-video` project bundle cleanly.
- Verify both `MapPinsHook` and `IntroMapPinsImage` render the Location Path frame, 3 location pins, and 3 bottom cards correctly.
