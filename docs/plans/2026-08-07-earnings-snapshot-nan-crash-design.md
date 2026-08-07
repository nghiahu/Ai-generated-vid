# Earnings Snapshot NaN Crash Design

## Overview
This design document specifies a bug fix for the rendering crash in the `EarningsSnapshotMode` layout. The crash occurs when the layout tries to parse a percentage from `comp.data.value` but encounters a non-numeric string, leading to `NaN` in the `outputRange` of Remotion's `interpolate` function.

## Goals
- Add safe checks to prevent `NaN` values from being parsed in `EarningsSnapshotMode.tsx`.
- Provide sensible defaults when the point value is missing, empty, or non-numeric.

## Detailed Changes

### 1. Robust Percentage Parsing in `EarningsSnapshotMode.tsx`
Modify the percentage parsing block:
```typescript
            const rawVal = comp?.data?.value;
            let pct = defaultPercentages[idx] ?? 50;

            if (rawVal) {
              const parsed = parseInt(String(rawVal).replace(/[^\d]/g, ""), 10);
              if (!isNaN(parsed)) {
                pct = Math.min(100, Math.max(0, parsed));
              }
            }
```

This changes:
- `replace("%", "")` to `replace(/[^\d]/g, "")` to extract only digits from strings like `"$10"`, `"60%"`, or `"85k"`.
- Adds `!isNaN(parsed)` check and falls back to `defaultPercentages[idx]` if the parsing results in `NaN`.

## Verification Plan
We will verify that:
- Non-numeric strings (like `"Context"`, `"Remediate"`, or missing values) do not crash the layout and fall back gracefully.
- The layout is stable and passes ESLint rules.
