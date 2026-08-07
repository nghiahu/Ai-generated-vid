# Dynamic Margins and Squish Prevention for Layouts Design

## Overview
This design document specifies layout fixes to prevent squishing and overflow of key card/metric contents in vertical 9:16 video templates (like `EarningsSnapshotHook` and `CircularProgress`) when scene headings are long (taking up 3+ lines). The fix dynamically scales down container paddings and header margins based on text length and disables flex-shrinking on the main mode container views.

## Goals
- Dynamically reduce `paddingTop` and `marginBottom` in `TemplateLayout.tsx` for titles longer than 25 and 40 characters.
- Add `flexShrink: 0` to layout mode root container styles to prevent the flex container from squishing cards and text.

## Detailed Changes

### 1. Sizing Adjustments in `TemplateLayout.tsx`
Modify `paddingTop` calculation:
```typescript
  const calculatedPaddingTop = (() => {
    if (isFlywheel || isCenteredLayout || isBottomAligned) return 0;
    const basePadding = parseInt(String(t.container?.paddingTop || "380"));
    if (!titleText) return basePadding;
    if (titleText.length > 40) return Math.max(100, basePadding - 180);
    if (titleText.length > 25) return Math.max(150, basePadding - 100);
    return basePadding;
  })();
```

Modify outer container style:
```typescript
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: isCenteredLayout ? "center" : (isBottomAligned || layoutMode === "metric_showcase_hook" || layoutMode === "metric_focus_showcase" || layoutMode === "web_mockup_hero" ? "flex-start" : "center"),
    padding: isFlywheel ? "0px" : (isCenteredLayout ? "0 64px" : "86px"),
    justifyContent: isCenteredLayout ? "center" : (isBottomAligned ? "flex-end" : "flex-start"),
    paddingTop: `${calculatedPaddingTop}px`,  // Use dynamic padding top
    paddingBottom: isFlywheel ? "0px" : (isCenteredLayout ? "0px" : (isBottomAligned ? "480px" : "86px")),
    boxSizing: "border-box",
    position: "relative",
    width: "100%",
    height: "100%"
  };
```

Modify `marginBottom` calculation for the title rendering block:
```typescript
  const calculatedMarginBottom = (() => {
    const baseMargin = parseInt(String(t.title?.marginBottom || "100"));
    if (!titleText) return baseMargin;
    if (titleText.length > 40) return Math.max(30, baseMargin - 60);
    if (titleText.length > 25) return Math.max(40, baseMargin - 40);
    return baseMargin;
  })();
```

Update title margin style:
```typescript
          <div style={{
            marginBottom: `${calculatedMarginBottom}px`,
            zIndex: 10,
            display: "flex",
            flexDirection: isBottomAligned ? "flex-start" : "center",
            width: "100%"
          }}>
```

### 2. Disabling Flex Shrink in Mode Components
Update the root `containerStyle` of these components to include `flexShrink: 0`:
- `CircularProgressMode.tsx`
- `EarningsSnapshotMode.tsx`

## Verification Plan
We will verify that:
- Long titles (like `"90% Context Engineering thay thế Prompt Engineering"`) result in compact margins (`120px` top padding, `40px` margin bottom) and do not squeeze the dashboard elements.
- Short titles retain spacious layouts.
- The layout is stable and passes ESLint rules.
