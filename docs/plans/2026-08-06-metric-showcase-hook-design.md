# MetricShowcaseHook Layout Design

## Overview
This design document specifies a new layout mode named `MetricShowcaseHook` that mimics a stats dashboard or repository review style layout. It supports a single count-up metric or a range count-up metric (e.g. "15 - 20 triệu") running in parallel from 0.

## Component Structure
The layout consists of the following components arranged vertically in a 9:16 layout:
1. **Headline (Title)**: Large heading text.
2. **Badge Row**: A list of badges right below the headline.
3. **Highlight Accent Bar**: A subtle neon-bordered card representing a single key subtext highlight.
4. **Metric Counter**: 
   - Supports single numbers (e.g. `4.600`) and ranges (e.g. `15 - 20`).
   - Suffix (like "sao" or "triệu") is extracted and displayed with smaller font size.
   - Count-up animation starting at frame 24 (or 0.8s) running to target value over 28-30 frames.
5. **Secondary Card**: Optional glassmorphism info card.
6. **Terminal / Command Prompt**: Optional command prompt bar at the bottom.

## Data Schema & AI Contract
Add the following layout contract to `backend/services/contractLoader.js`:
```javascript
MetricShowcaseHook: {
  layoutId: 'MetricShowcaseHook',
  family: 'Opening / Headline',
  headingMaxChars: 45,
  pointsCount: { min: 1, max: 5, default: 3 },
  pointMaxChars: 50,
  allowedPointTypes: ['badge_row', 'subheader', 'metric', 'card', 'terminal'],
  aiHint: 'Layout báo cáo chỉ số danh tiếng, repo hoặc lương dạng dashboard có hiệu ứng chạy số đôi hoặc số đơn.'
}
```

## Count-Up Range Animation Logic
- Match range numbers using regex (e.g., `/(\d+(?:[\.,]\d+)?)\s*-\s*(\d+(?:[\.,]\d+)?)/`).
- If match is found, isolate the numbers `N1` and `N2`, and the remainder string (suffix).
- Animate two interpolations:
  - `val1 = interpolate(frame, [start, end], [0, N1])`
  - `val2 = interpolate(frame, [start, end], [0, N2])`
- Display text as: `{val1} - {val2} {suffix}`.
- If not a range but a single number, animate `val = interpolate(frame, [start, end], [0, N])` and display `{val} {suffix}`.
- If no number is detected, display `value` as static text.
