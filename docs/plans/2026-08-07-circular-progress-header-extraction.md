# Circular Progress Header Extraction Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Modify CircularProgressMode to scan the header title text for a percentage indicator (e.g. `XX%`), using it for the progress circle if found, and offset cards accordingly to maximize card usage.

**Architecture:**
1. Update `ModeRendererProps` imports/props in `CircularProgressMode.tsx` to receive `titleText`.
2. Add regex matching in `CircularProgressMode.tsx` to search `titleText` for percentage.
3. Conditionally slide cards slicing index depending on whether the percentage came from the title or from the first point.

**Tech Stack:** React, TypeScript, Remotion

---

### Task 1: Update CircularProgressMode to extract percentage from header

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/CircularProgressMode.tsx`

**Step 1: Inspect code**
Check the destructuring parameters in `CircularProgressMode.tsx` to add `titleText`.

**Step 2: Modify code**
Update `CircularProgressMode.tsx` with:
- Prop destructuring:
  ```typescript
  export const CircularProgressMode: React.FC<ModeRendererProps> = ({
    otherComps,
    t,
    isLight,
    styles,
    gap,
    titleText
  }) => {
  ```
- Extraction logic:
  ```typescript
    // 1. Search for percentage in title text first (e.g. "100% MCP Servers" -> 100)
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

    // 2. Extract remaining comps for cards underneath (up to 4 cards)
    const cardComps = hasExtractedFromTitle ? otherComps.slice(0, 4) : otherComps.slice(1, 5);
  ```

**Step 3: Run verify compilation**
Run: `npx eslint src/compositions/layouts/modes/CircularProgressMode.tsx`
Expected: PASS

**Step 4: Commit**
```bash
git add my-video/src/compositions/layouts/modes/CircularProgressMode.tsx
git commit -m "feat: parse circular progress percentage from title text with fallback"
```
