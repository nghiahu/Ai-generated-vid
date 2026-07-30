# Differentiate Metric Layouts Plan

Make the three metric layouts (**Grid Metrics**, **Metric Cards**, and **Hero Metric Cards**) visually distinct, premium, and fully responsive.

**Architecture:**
All three layouts will continue to use the `GridMetricsMode.tsx` component, but we will upgrade the renderer to dynamically adjust its layout grid template, responsiveness, card sizes, and child assets based on `t.id` (the template layout ID):

1. **Grid Metrics (`GridMetrics`)**:
   - Classic **2x2 grid layout**.
   - Clean balanced grid cards with backdrop blur.

2. **Metric Cards (`MetricCards`)**:
   - **Horizontal Row Layout** (side-by-side).
   - In landscape (16:9), cards render side-by-side in a row. In vertical (9:16), they stack.
   - Premium subtle gradient borders and glowing shadows.

3. **Hero Metric Cards (`HeroMetricCards`)**:
   - **Hero Split Layout**.
   - First card is designated as the **Hero Card**:
     - Spans full width on top (9:16) or takes the full left column (16:9).
     - Renders a larger value and a custom animated SVG Sparkline Chart drawing inside it.
     - Background is filled with the accent-to-dark-accent color gradient.
   - Other cards render as smaller secondary statistic cards.

---

### Task 1: Upgrade `GridMetricsMode.tsx`

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/GridMetricsMode.tsx`

**Implementation details:**
- Import `useCurrentFrame` from `remotion` to animate the Sparkline path.
- Add conditions checking `t.id` for container styles and card rendering:
  - If `t.id === "MetricCards"`, use flex row (desktop) / flex column (mobile).
  - If `t.id === "HeroMetricCards"`, use custom grid-template-areas or column/row spans.
- Implement the SVG Sparkline in Card 0 for `HeroMetricCards`.

---

### Task 2: Verify Compiling and Rendering

**Files:**
- Run `npm run build` inside `my-video` folder to verify compilation.
- Manually check the preview in the browser for all three dropdown values.
