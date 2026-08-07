# Smart Number Parsing for Metric Layouts

## Overview
This design document specifies the architecture and logic for the smart number parsing utility `parseNumbers` used in metric-focused Remotion layout compositions. The fix resolves the bug where numbers like `58,000$` or `85,000 đô` (using English thousands separator `,`) are parsed as decimal `58` instead of integer `58000`.

## Goals
- Correctly parse metric numbers with English format (`58,000` or `58,000.50`) and Vietnamese format (`58.000` or `58.000,50`).
- Consolidate the duplicated inline `parseNumbers` helper function from the following modes:
  - `MetricShowcaseHookMode.tsx`
  - `MetricFocusShowcaseMode.tsx`
- Ensure range numbers (e.g. `15 - 20 triệu` or `15,000 - 20,000 usd`) are also correctly parsed using the same rules.

## Design Details

### 1. New Utility File: `utils/numberParser.ts`
We will create a new utility file `my-video/src/utils/numberParser.ts` containing the shared `parseNumbers` function.

### 2. Smart Formatting Heuristics
When a numeric string contains commas (`,`) or dots (`.`):
- **Both separators present** (e.g., `1,234.56` or `1.234,56`):
  - English style if comma appears before dot: Replace all commas with empty string and parse.
  - Vietnamese/European style if dot appears before comma: Replace all dots with empty string, replace comma with dot, and parse.
- **Only comma(s) present** (e.g., `58,000` or `12,5`):
  - If the last segment after the last comma has exactly 3 digits, treat the commas as thousands separators (replace with empty string).
  - Otherwise, treat it as a decimal separator (replace with dot).
- **Only dot(s) present** (e.g., `58.000` or `12.5`):
  - If the last segment after the last dot has exactly 3 digits, treat the dots as thousands separators (replace with empty string).
  - Otherwise, treat it as a decimal separator (do nothing).

### 3. Usage in Layout Modes
Both `MetricShowcaseHookMode.tsx` and `MetricFocusShowcaseMode.tsx` will import `parseNumbers` from `../../utils/numberParser` instead of declaring it inline.

## Verification Plan
We will write unit tests or dry-run test cases in a scratch script to verify:
- `"58,000$"` -> `{ n1: 58000, suffix: "$" }`
- `"85,000 đô"` -> `{ n1: 85000, suffix: "đô" }`
- `"58.000$"` -> `{ n1: 58000, suffix: "$" }`
- `"12,5 triệu"` -> `{ n1: 12.5, suffix: "triệu" }`
- `"12.5 triệu"` -> `{ n1: 12.5, suffix: "triệu" }`
- `"15.000 - 20.000 usd"` -> `{ n1: 15000, n2: 20000, suffix: "usd" }`
- `"15,000 - 20,000 usd"` -> `{ n1: 15000, n2: 20000, suffix: "usd" }`
- `"15 - 20 triệu"` -> `{ n1: 15, n2: 20, suffix: "triệu" }`
