# Metric Focus Showcase Title Wrapping Design

## Overview
This design document specifies a fix for the title overflow bug in the `MetricFocusShowcase` layout. The goal is to dynamically resize the main large metric/keyword font size depending on its length and ensure the text container wraps properly and respects the right padding, keeping the right margin identical to the left margin.

## Goals
- Dynamically calculate the font size for `metricValue` in `MetricFocusShowcaseMode.tsx` based on its character length.
- Lay out the metric section in a column (`flexDirection: "column"`) when the metric is a long text phrase to prevent side-by-side overflow.
- Ensure the text container has `flexWrap: "wrap"`, `wordBreak: "break-word"`, and respects the container's left and right padding (`32px` in vertical mode), so that margins on both sides are perfectly symmetrical.

## Detailed Changes

### 1. Dynamic Font Size and Layout Mode
In `MetricFocusShowcaseMode.tsx`:
```typescript
  const isLongMetric = metricValue.length > 6;
  const useColumnLayout = isVertical && (!hasDigits || isLongMetric);

  const getDynamicFontSize = () => {
    const base = isVertical ? 250 : 210;
    const len = metricValue.length;
    if (hasDigits) {
      if (len > 8) return Math.round(base * 0.6 * fontScale);
      if (len > 5) return Math.round(base * 0.8 * fontScale);
      return Math.round(base * fontScale);
    } else {
      if (len > 20) return Math.round(base * 0.3 * fontScale);
      if (len > 15) return Math.round(base * 0.38 * fontScale);
      if (len > 10) return Math.round(base * 0.48 * fontScale);
      if (len > 6) return Math.round(base * 0.65 * fontScale);
      return Math.round(base * 0.85 * fontScale);
    }
  };

  const dynamicFontSize = getDynamicFontSize();
```

### 2. Styling in JSX
Apply layout change to the parent container:
```typescript
          <div style={{
            display: "flex",
            flexDirection: useColumnLayout ? "column" : "row",
            alignItems: useColumnLayout ? "flex-start" : "center",
            justifyContent: "flex-start",
            gap: useColumnLayout ? "12px" : (isVertical ? "32px" : "24px"),
            marginTop: "10px",
            marginBottom: "10px",
            width: "100%"
          }}>
```

Update the text overlay container styles to wrap text and respect container padding:
```typescript
            <div style={{
              fontSize: `${dynamicFontSize}px`,
              lineHeight: 0.95,
              fontWeight: 950,
              letterSpacing: "-0.06em",
              color: accentColor,
              fontFamily: styles.fontFamily,
              textShadow: isLight ? "none" : `0 8px 32px rgba(${rgb}, 0.35)`,
              display: "flex",
              alignItems: "baseline",
              flexWrap: "wrap",          // Allow wrap
              wordBreak: "break-word",   // Break words if needed
              maxWidth: "100%"           // Do not exceed container width
            }}>
```

## Verification Plan
We will verify that:
- Title `"Context Engineering"` is sized to `95px` and wraps correctly inside the vertical container boundaries.
- Right margins match left margins perfectly at `32px`.
- The layout is stable and passes ESLint rules.
