# Circular Progress Equal Height Cards Design

## Overview
This design document specifies modifications to the card grid inside `CircularProgressMode.tsx` to ensure all cards have the exact same height and that text automatically shrinks to fit the layout without causing misalignment.

## Goals
- Enforce equal height across all 4 cards in the 2x2 grid using a fixed height of `240px` and vertical centering.
- Dynamically scale down the font size of the card title and subtext if the strings are long (preventing text from wrapping onto too many lines and overflowing the card).
- Use a CSS Grid layout with `gridTemplateColumns: "1fr 1fr"` to ensure grid tracks align correctly even if there are fewer than 4 cards.

## Detailed Changes

### 1. Card Styles in `CircularProgressMode.tsx`
Change the static `cardStyle` to have a fixed height and vertical centering:
```typescript
  const cardStyle: React.CSSProperties = {
    width: "100%",
    height: "240px", // Fixed height to guarantee all cards are equal
    borderRadius: "28px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center", // Vertically center contents
    textAlign: "center",
    boxSizing: "border-box",
    backdropFilter: "blur(8px)",
  };
```

### 2. Dynamic Font Sizing for Title and Subtext
Inside the `cardComps.map` block:
```typescript
            // Scale font size based on text length to fit the fixed height
            const titleFontSize = title.length > 25 ? "15px" : title.length > 15 ? "18px" : "21px";
            const subtextFontSize = subtext.length > 30 ? "13px" : "15px";
```

Apply these font sizes to the title and subtext divs in the JSX return.

## Verification Plan
We will verify that:
- All cards have exactly `240px` height.
- Card title texts wrap cleanly and use smaller fonts if they are long.
- Cards are centered vertically and align in a neat grid.
- The layout is stable and passes ESLint rules.
