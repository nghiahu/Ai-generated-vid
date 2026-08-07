# Circular Progress Header Extraction Design

## Overview
This design document specifies a modification to how the circular progress metric value is extracted. It adds an option where the system first searches the header/title text for a percentage value (e.g. `100%`, `85%`). If a percentage value is found in the title, it is used as the target percentage for the progress circle. Otherwise, it falls back to the first point of the points list.

## Goals
- Scan `titleText` for percentage patterns like `XX%` (e.g. `100%`, `85%`) in `CircularProgressMode.tsx`.
- If a percentage is found, parse the digits as the target value of the progress animation.
- If no percentage is found in the header, fall back to the first point (`otherComps[0]`) as before.
- Ensure that if the percentage comes from the title, all cards underneath (from Point #1 onwards) are rendered as cards, allowing up to 4 cards to show. If the percentage is fallback-extracted from Point #1, only Points #2 to #5 are rendered as cards (up to 3 cards).

## Detailed Changes

### 1. Value Extraction in `CircularProgressMode.tsx`
Modify the metric value extraction block:
```typescript
  // 1. Search for percentage in title text first
  let targetValue = 0;
  let hasExtractedFromTitle = false;
  const titlePctMatch = titleText ? titleText.match(/(\d+(?:\.\d+)?)\s*%/i) : null;

  if (titlePctMatch) {
    const val = parseInt(titlePctMatch[1], 10);
    if (!isNaN(val)) {
      targetValue = Math.min(100, Math.max(0, val));
      hasExtractedFromTitle = true;
    }
  }

  // Fallback to first point if not found in title
  if (!hasExtractedFromTitle) {
    const metricComp = otherComps[0];
    const metricValueText = String(metricComp?.data?.value || metricComp?.data?.text || "0");
    const parsedValue = parseInt(metricValueText.replace(/[^\d]/g, ""), 10);
    targetValue = isNaN(parsedValue) ? 0 : Math.min(100, Math.max(0, parsedValue));
  }

  // 2. Card extraction offset
  // If the percentage came from the title, the cards start from otherComps[0] (up to 4 cards)
  // If fallback was used, the cards start from otherComps[1] (up to 3 cards)
  const cardComps = hasExtractedFromTitle ? otherComps.slice(0, 4) : otherComps.slice(1, 5);
```

## Verification Plan
We will verify that:
- Title `"Sự cố Chatbot AI bán xe 58,000$ giá 1$"` has no percentage, so it falls back to parsing Point #1.
- Title `"100% MCP Servers — Hàng trăm MCP Server"` or `"Hiệu suất đạt 95%"` parses `100` or `95` as target value and renders all points as cards.
- The layout is stable and passes ESLint rules.
