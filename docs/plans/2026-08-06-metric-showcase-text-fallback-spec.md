# Design Specification: Text Fallback with Character Pop-in for Metric Showcase Hook

## Background
The `MetricShowcaseHook` layout displays a large number in the center with a count-up animation. When a scene has no numbers (such as when using purely text points or highlights), this center area remains blank and looks incomplete. The typewriter ticking sound effect also crashes if the points structure is parsed incorrectly.

This spec introduces:
1. Dynamic detection of numeric vs non-numeric metrics.
2. A text fallback utilizing the first highlight keyword when no numeric values are present.
3. A premium, staggered, letter-by-letter zoom/fade animation (Sequential Pop-in) for the fallback word.
4. Absolute safety checks on all array iteration (`.some()`) calls on scene points to avoid Player blank-screen crashes.

---

## Detailed Specification

### 1. Robust Safety Guards
In `my-video/src/compositions/MainComposition.tsx`, wrap all `.some` calls on `scene.points` with `Array.isArray(scene.points)`:
```typescript
const hasMetrics = Array.isArray(scene.points) && scene.points.some(p => p && p.type === "metric");
const hasTerminal = Array.isArray(scene.points) && scene.points.some(p => p && p.type === "terminal");
```

### 2. Metric Showcase Hook Mode Fallback Resolution
In `my-video/src/compositions/layouts/modes/MetricShowcaseHookMode.tsx`:
- Parse `metricValue`. If no numeric metric is parsed, and `highlightWords` has items, fall back to `highlightWords[0]`.
- Define `hasDigits = /\d+/.test(metricValue)`.

### 3. Rendering & Animation
- **If `hasDigits` is true**:
  Render the standard count-up running number interpolation (`animN1`, `animN2`) and suffixes.
- **If `hasDigits` is false**:
  - Split `metricValue` into characters.
  - Map over characters with a staggered delay of 3 frames per letter.
  - For each character at index `charIdx`, calculate `charFrame = frame - countStart - (charIdx * 3)`.
  - Interpolate opacity from `0` to `1` over `[0, 10]` frames.
  - Interpolate scale from `0.7` to `1.0` over `[0, 10]` frames.
  - Render each character inside an `<span style={{ display: "inline-block" }}>`.

---

## Verification Plan
1. Compile the project: `npx tsc --noEmit --skipLibCheck --types react`.
2. Bundle check: `npm run build` inside `my-video`.
3. Open a scene using `MetricShowcaseHook` layout with no numeric inputs in the editor, and verify the text keyword nabs the center stage and pops in letter-by-letter without any crashes.
