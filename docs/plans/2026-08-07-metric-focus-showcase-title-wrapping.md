# Metric Focus Showcase Title Symmetrical Wrapping Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Modify MetricFocusShowcaseMode to implement responsive font sizing, conditional column layout, and wrapping rules to keep left and right margins identical.

**Architecture:**
1. Compute `useColumnLayout` and `dynamicFontSize` based on the length of `metricValue` in `MetricFocusShowcaseMode.tsx`.
2. Update JSX layout and styles to use column direction for long values, and enforce `flexWrap: "wrap"` with `wordBreak: "break-word"` to constrain text to the container boundaries.

**Tech Stack:** React, TypeScript, Remotion

---

### Task 1: Update MetricFocusShowcaseMode with Wrapping and Responsive Font Sizing

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/MetricFocusShowcaseMode.tsx`

**Step 1: Inspect code**
Check lines 80-210 in `MetricFocusShowcaseMode.tsx`.

**Step 2: Modify code**
Update `MetricFocusShowcaseMode.tsx` to:
1. Define `isLongMetric`, `useColumnLayout`, `getDynamicFontSize()`, and `dynamicFontSize` below the animations config block.
2. Modify the main metric's parent container to dynamically switch layout directions.
3. Update the metric text wrapper styling to include `flexWrap: "wrap"`, `wordBreak: "break-word"`, and `maxWidth: "100%"`, while removing `flexShrink: 0`.

**Step 3: Run verify compilation**
Run: `npx eslint src/compositions/layouts/modes/MetricFocusShowcaseMode.tsx`
Expected: PASS

**Step 4: Commit**
```bash
git add my-video/src/compositions/layouts/modes/MetricFocusShowcaseMode.tsx
git commit -m "feat: implement symmetrical wrapping and dynamic font sizing for MetricFocusShowcaseMode"
```
