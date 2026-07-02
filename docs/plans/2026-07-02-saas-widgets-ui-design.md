# Design Doc: SaaS Widgets UI Overhaul for Remotion Layouts

**Date**: 2026-07-02  
**Goal**: Upgrade Remotion UI components into premium, automatically styled "SaaS widgets" and device mockups. This ensures the output video always looks professional and highly polished without forcing the AI to design or modify CSS/JSX layouts.

---

## 🎨 Proposed Component Designs

### 1. TerminalBlock (VS Code Editor Style Mockup)
- **Header**: Adds window chrome simulating MacOS (Red, Yellow, Green dots) and a mock tab bar displaying a file tab (e.g., `install.sh`).
- **Layout**: Left column with muted gray line numbers (`1`, `2`, `3`); main code container displaying monospace code (`JetBrains Mono`).
- **Highlighting**: Custom lightweight regex parser to color keywords (`npm install`, `git clone`, flags like `-y`, URLs) in distinct terminal colors.
- **Cursor**: Subtle blinking neon indicator block at the end of the command.

### 2. FeatureCardBlock (Smart SVG Icons)
- **Layout**: Horizontally oriented flex container. Left side contains a stylized square/circular icon container with a semi-transparent background (`${accentColor}20`). Right side contains text.
- **Icon Resolver**: A `getSmartIcon(text)` utility mapping keyword subsets to beautiful custom SVG icons:
  - `"speed" / "performance" / "nhanh" / "tốc độ"` -> Bolt icon.
  - `"secure" / "lock" / "bảo mật" / "an toàn"` -> Shield/Lock icon.
  - `"cloud" / "deploy" / "đám mây"` -> Cloud icon.
  - `"db" / "database" / "dữ liệu"` -> Database icon.
  - `"code" / "dev" / "lập trình"` -> Code brackets icon.
  - *Fallback* -> Checkmark icon.

### 3. HeroMetricBlock (Animated SVG Sparkline)
- **Layout**: Left aligned large metric text. Next to it or below it, an SVG sparkline wave chart is rendered.
- **Animation**: The chart stroke draws itself from left to right using Remotion's `strokeDashoffset` coupled with the scene frame.
- **Gradient Fill**: A smooth linear gradient starts from the chart path and fades down to the card's bottom border.

### 4. Device Mockups (Browser Wrapper for Images)
- In `SplitScreen` and `Gallery` layout renderers inside `DynamicLayout.tsx`, images are wrapped in a CSS-based **Browser Frame**:
  - Top bar with chrome controls and a dummy search bar showing `https://app.io`.
  - Card borders with slight radius (`12px`), thin border lines, and deep smooth drop shadows.

---

## 🎬 Animation & Background Design

### 1. Spring-Based Entrances
- Use Remotion's native `spring` physics instead of standard CSS transitions.
- Apply a custom hook using Remotion's `spring` API (using parameters like `stiffness: 100`, `damping: 15`) to create a fluid overshoot bounce effect when cards slide in.
- Stagger element entrances by delaying the frame offset (e.g. `delaySeconds * fps`).

### 2. Ken Burns Image Zooms
- Apply scale interpolation to all image/screenshot mockups. Scale values start at `1.0` and interpolate slowly to `1.08` over the scene duration to keep images dynamically alive.

### 3. Dynamic Background Overlays
- Update `AccentGlowBackground.tsx` to slowly animate the radial glow coordinates over time using trigonometric functions (`Math.sin`, `Math.cos`).
- Layer a subtle background grid overlay that slowly scrolls downwards to provide parallax texture.

### 4. Scene Transitions (Blur-Sweep)
- Add a 15-frame transition buffer in `MainComposition.tsx` between scenes:
  - Outgoing scene: opacity `1 -> 0`, blur `0px -> 20px`, scale `1.0 -> 1.03`.
  - Incoming scene: opacity `0 -> 1`, blur `20px -> 0px`, scale `0.97 -> 1.0`.

---

## 📂 Key Files to Modify
- [my-video/src/components/layout/UIBlocks.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/components/layout/UIBlocks.tsx) — Redesign blocks.
- [my-video/src/compositions/DynamicLayout.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/DynamicLayout.tsx) — Implement image mockup wrappers, Ken Burns scale transitions, and spring animations.
- [my-video/src/components/overlays/AccentGlowBackground.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/components/overlays/AccentGlowBackground.tsx) — Add dynamic glow coordinates and background grid scrolling.
- [my-video/src/compositions/MainComposition.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/MainComposition.tsx) — Implement the 15-frame Blur-Sweep transition.
