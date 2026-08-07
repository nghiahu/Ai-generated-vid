# MetricFocusShowcase Layout Design

## Overview
This design document specifies a new layout mode named `MetricFocusShowcase` (layoutMode: `metric_focus_showcase`) that showcases a high-impact dashboard metric with side-by-side descriptive text, multiple rows of stacked badges (pills), and a bottom progress card. It is optimized for security scanner dashboards, software metrics, or high-focus parameter reviews.

## Component Structure
The layout consists of the following components arranged vertically in a 9:16 layout:
1. **Category Pill (Phía trên cùng)**:
   - Dynamic label with an active glowing bullet indicator.
2. **Main Metric (Tiêu điểm Chỉ số)**:
   - A large number on the left (e.g., "42") rendered in bright orange with text shadow glow.
   - Stacked left-aligned subtext on the right (e.g., "lăng kính / ngôn ngữ") that wraps vertically next to the number.
3. **Stacked Badges (Hàng nhãn ở giữa)**:
   - Multiple rows of capsule pills representing item details.
   - Supports alternating border/background theme accents (Teal/Mint green and Orange/Red tones).
4. **Progress Card (Khung tiến trình dưới cùng)**:
   - Glassmorphism container (`backdrop-filter: blur(12px)`) with thin semi-transparent border.
   - List of items with a left label, right cost/status value (number or word), and a progress bar filled dynamically (using percentage parsed from value/subtext, or alternating default visual fallbacks like 70% and 95%).

## Data Schema & AI Contract
Add the following layout contract to `backend/services/contractLoader.js`:
```javascript
MetricFocusShowcase: {
  layoutId: 'MetricFocusShowcase',
  family: 'Opening / Headline',
  headingMaxChars: 45,
  pointsCount: { min: 1, max: 6, default: 4 },
  pointMaxChars: 50,
  allowedPointTypes: ['badge_row', 'metric', 'card'],
  aiHint: 'Layout chỉ số bảo mật/kỹ thuật cao, có số lớn màu cam kèm nhãn bên phải, hàng loạt pill chi tiết ở giữa và thẻ bảng tiến trình/chi phí ở dưới cùng.'
}
```

## Animation Timeline (60-90 frames @30fps)
- **Frame 0 - 20 (Mounting)**:
  - Category Pill slides down from the top.
  - Giant number ticks up from `0` to its target value over 25 frames with easing.
- **Frame 15 - 35 (Details Pop-in)**:
  - Subtext next to the giant number slides in from the left.
  - Stacked badge rows pop up from the bottom with 0.1s staggered delays.
- **Frame 30 - 65 (Dashboard Progress Card)**:
  - Bottom progress card scales up and fades in from the bottom.
  - Progress bars inside the card animate their fill widths from `0%` to their target widths over 20 frames.
