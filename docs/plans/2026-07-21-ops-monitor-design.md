# Design Document: Dedicated OpsMonitorMode for OPS Monitor Hook

**Date:** 2026-07-21  
**Status:** Approved  
**Target Template:** `OPS Monitor Hook` (`OpsMonitorHook`)

---

## 1. Overview & Problem Statement
Currently, `OpsMonitorHook` uses `layoutMode: "centered_text"`, which renders a plain large title with a simple text list — failing to match the designed OPS monitoring dashboard interface with metric cards and system progress bars.

This design introduces a dedicated mode renderer **`OpsMonitorMode`** to display a split-panel monitoring dashboard with 3 Metric Cards on the left and 8 SYS progress bars on the right, plus a `● MONITORING LIVE` footer status bar.

---

## 2. Architecture & File Changes

### 2.1 File Changes
- **`my-video/src/compositions/layouts/templates/Opening-Headline/ops_monitor_hook.json`**:
  - Change `"layoutMode"` from `"centered_text"` to `"ops_monitor"`.
- **`my-video/src/compositions/layouts/modes/OpsMonitorMode.tsx`** *(NEW)*:
  - Dedicated renderer for `ops_monitor` layout mode.
- **`my-video/src/compositions/layouts/TemplateLayout.tsx`**:
  - Import `OpsMonitorMode`.
  - Add `case "ops_monitor": return <OpsMonitorMode {...modeProps} />;` to `renderLayoutContent()`.
  - Add `layoutMode === "ops_monitor"` to top-padding calculations (380px).

---

## 3. Visual & Motion Specification

### 3.1 Layout Structure
- **Main Container**: Glassmorphic dark panel (~860px width) with border glow.
- **Split Layout (2 Columns)**:
  - **Left Column (38%)**: 3 Metric Cards (`METRIC-1`, `METRIC-2`, `METRIC-3`).
    - Each card: small accent label + large bold text content from `otherComps`.
    - Dark glassmorphic card with subtle left accent border.
  - **Right Column (62%)**: 8 SYS Progress Bars (`SYS-1` through `SYS-8`).
    - Each row: `SYS-N` label on left, animated gradient bar (red→orange→yellow), `XX%` value on right.
    - Values are a set of distinct realistic percentages (e.g., 46%, 77%, 84%, 63%, 32%, 32%, 80%, 82%).
    - Bar fill animates via Remotion `frame` interpolation (`strokeDashoffset` or width).
- **Footer Status Bar**:
  - `● MONITORING LIVE` — red glowing dot + label in accent red color, bottom of panel.

### 3.2 Animation
- Bars animate from 0% to target value via `interpolate(frame, [20, 80], [0, targetWidth])`.
- Metric Cards use staggered `scale-in` animation via `AnimatedBlock`.
- `MONITORING LIVE` dot pulses with a CSS `opacity` interpolation blink.

### 3.3 Theme Adaptability
- Uses `accentColor`, `rgb`, `isLight`, and `styles.fontFamily` for seamless theme support.

---

## 4. Verification Plan
- Build `my-video` project bundle cleanly.
- Verify `OpsMonitorHook` renders with 3 Metric Cards + 8 SYS bars + footer live status.
