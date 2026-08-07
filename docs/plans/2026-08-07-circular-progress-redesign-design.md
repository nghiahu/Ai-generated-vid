# Circular Progress Layout Redesign Design

## Overview
This design document specifies a redesign of the `circular_progress` layout mode in Remotion. The goals are to hide the default layout title, enlarge the main circular progress indicator, move it to the top of the viewport, and organize the key metric cards below it in a clean 2x2 grid layout.

## Goals
- Hide the default title header for `circular_progress` layout in `TemplateLayout.tsx`.
- Enlarge the circular progress track to `480px` size in `CircularProgressMode.tsx`.
- Implement dynamic font-size adjustment for the progress percentage text inside the circle to prevent characters like "100%" from overlapping the border.
- Layout the cards below the circle in a 2x2 grid (supporting up to 4 cards).

## Detailed Changes

### 1. Title Exclusion in `TemplateLayout.tsx`
Exclude `circular_progress` layout mode from the standard title rendering block:
```typescript
{titleComp && layoutMode !== "intro_briefing_card" && ... && layoutMode !== "circular_progress" && (
  // Title rendering block
)}
```

### 2. Large Circle with Dynamic Font Size
In `CircularProgressMode.tsx`:
- Change circle container size to `480px` width/height.
- Derive a `dynamicFontSize` based on the length of the string `Math.round(progress) + "%"`:
  - Length >= 4 (e.g. `100%`): `105px`
  - Length == 3 (e.g. `58%`): `120px`
  - Length == 2 (e.g. `5%`): `135px`

### 3. Grid-based Cards Layout
In `CircularProgressMode.tsx`:
- Slice `otherComps` using `slice(1, 5)` to support up to 4 card items.
- Change `cardsContainerStyle` to use CSS Grid:
```typescript
const cardsContainerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: gap !== undefined ? `${gap}px` : (t.container?.gap || "20px"),
  width: "100%",
  marginTop: "20px",
  boxSizing: "border-box",
  padding: "0 20px"
};
```
- Update cards flex styling to fit correctly inside the grid column.

## Verification Plan
We will verify that:
- The title is omitted when rendering the Circular Progress template.
- The progress circle displays as `480px` diameter.
- The inner text does not overflow the border for `100%`.
- 2, 3, or 4 cards are rendered as a 2x2 grid.
