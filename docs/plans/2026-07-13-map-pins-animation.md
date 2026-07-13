# Map Pins Animation Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Animate sequential path lines between absolute map pins, popping in the location markers and cards as the path reaches them.

**Architecture:** Use Remotion's `useCurrentFrame` and `interpolate` in `AbsoluteCardsMode.tsx` to render an animated SVG layer with sequential `<line>` elements and location dots, while syncing the card animation entrance delays.

**Tech Stack:** React, Remotion, CSS inline styles.

---

### Task 1: Update AbsoluteCardsMode.tsx with Map Pins Animation

**Files:**
- Modify: [AbsoluteCardsMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/AbsoluteCardsMode.tsx)

**Step 1: Import Remotion hooks, calculate current frame progress, render SVGs and override card delays**

Update imports:
```tsx
import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
```

Implement the animation calculations and SVG layer inside `AbsoluteCardsMode`:
```tsx
export const AbsoluteCardsMode: React.FC<ModeRendererProps> = ({
  otherComps,
  resolvedPositions,
  t,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale,
  activeCardTextColor,
  activeCardBadgeColor,
  inactiveCardTextColor
}) => {
  const frame = useCurrentFrame();
  const visibleComps = otherComps.slice(0, 3);
  const titleComp = otherComps.find(c => c.type === "title");

  const isMapPins = t.id === "IntroMapPinsImage" || t.id === "MapPinsHook";

  // Pin points coordinates
  const pin1 = { x: 80, y: 176 };
  const pin2 = { x: 610, y: 266 };
  const pin3 = { x: 330, y: 488 };

  // Calculate distances for strokeDashoffset
  const dist1 = 538;
  const dist2 = 357;

  // Path drawing progress
  const progress1 = interpolate(frame, [15, 30], [dist1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const progress2 = interpolate(frame, [30, 45], [dist2, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Location marker scales
  const scalePin1 = interpolate(frame, [5, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scalePin2 = interpolate(frame, [30, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scalePin3 = interpolate(frame, [45, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
```

Override card config delays:
```tsx
        // Determine animations and delays
        let animConfig = getAnimationConfig(comp, idx, "scale-in", 0.5, t);
        if (isMapPins) {
          const delays = [0.2, 1.0, 1.5]; // synced with path arrivals
          animConfig = { animation: "scale-in" as const, delay: delays[idx] || 0.5 };
        }
```

Render SVG Layer inside the wrapper div:
```tsx
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "visible" }}>
      {isMapPins && (
        <svg style={{ position: "absolute", left: 0, top: 0, width: "1080px", height: "1920px", pointerEvents: "none", zIndex: 0, overflow: "visible" }}>
          {/* Connection Line 1 */}
          <line
            x1={pin1.x}
            y1={pin1.y}
            x2={pin2.x}
            y2={pin2.y}
            stroke={accentColor}
            strokeWidth={4}
            strokeDasharray={dist1}
            strokeDashoffset={progress1}
            strokeLinecap="round"
            style={{ opacity: frame >= 15 ? 0.75 : 0 }}
          />
          {/* Connection Line 2 */}
          <line
            x1={pin2.x}
            y1={pin2.y}
            x2={pin3.x}
            y2={pin3.y}
            stroke={accentColor}
            strokeWidth={4}
            strokeDasharray={dist2}
            strokeDashoffset={progress2}
            strokeLinecap="round"
            style={{ opacity: frame >= 30 ? 0.75 : 0 }}
          />

          {/* Location Dot 1 */}
          <g transform={`translate(${pin1.x}, ${pin1.y}) scale(${scalePin1})`} style={{ transformOrigin: "center" }}>
            <circle r={14} fill={accentColor} opacity={0.3} />
            <circle r={7} fill={accentColor} />
          </g>
          {/* Location Dot 2 */}
          <g transform={`translate(${pin2.x}, ${pin2.y}) scale(${scalePin2})`} style={{ transformOrigin: "center" }}>
            <circle r={14} fill={accentColor} opacity={0.3} />
            <circle r={7} fill={accentColor} />
          </g>
          {/* Location Dot 3 */}
          <g transform={`translate(${pin3.x}, ${pin3.y}) scale(${scalePin3})`} style={{ transformOrigin: "center" }}>
            <circle r={14} fill={accentColor} opacity={0.3} />
            <circle r={7} fill={accentColor} />
          </g>
        </svg>
      )}
```

**Step 2: Commit changes**

Run:
```bash
git add my-video/src/compositions/layouts/modes/AbsoluteCardsMode.tsx
git commit -m "feat: animate connection path lines and location markers sequentially in Map Pins layout"
```

## Verification Plan

### Manual Verification
- Check the Remotion preview page to verify:
  1. Sequential lines are drawn connecting Pin 01 -> Pin 02 -> Pin 03.
  2. The glowing location dots scale in exactly at the time the paths reach them.
  3. The cards scale in sync with the location pins' arrival.
