# Dynamic Margins and Squish Prevention Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Prevent squishing of card layouts in vertical modes when headings are long by adjusting padding-top and margin-bottom dynamically, and disabling flex-shrink.

**Architecture:**
1. Calculate dynamic `paddingTop` and `marginBottom` in `TemplateLayout.tsx` and override static values.
2. Set `flexShrink: 0` in `CircularProgressMode.tsx` and `EarningsSnapshotMode.tsx`.

**Tech Stack:** React, TypeScript, Remotion

---

### Task 1: Implement dynamic padding and margin adjustments in TemplateLayout

**Files:**
- Modify: `my-video/src/compositions/layouts/TemplateLayout.tsx`

**Step 1: Inspect code**
Check the current `containerStyle` and title margin declarations in `TemplateLayout.tsx`.

**Step 2: Modify code**
Update `TemplateLayout.tsx` with:
- Dynamic variables:
  ```typescript
    const calculatedPaddingTop = (() => {
      if (isFlywheel || isCenteredLayout || isBottomAligned) return 0;
      const basePadding = parseInt(String(t.container?.paddingTop || "380"));
      if (!titleText) return basePadding;
      if (titleText.length > 40) return Math.max(100, basePadding - 180);
      if (titleText.length > 25) return Math.max(150, basePadding - 100);
      return basePadding;
    })();

    const calculatedMarginBottom = (() => {
      const baseMargin = parseInt(String(t.title?.marginBottom || "100"));
      if (!titleText) return baseMargin;
      if (titleText.length > 40) return Math.max(30, baseMargin - 60);
      if (titleText.length > 25) return Math.max(40, baseMargin - 40);
      return baseMargin;
    })();
  ```
- Change `containerStyle.paddingTop` to:
  ```typescript
  paddingTop: `${calculatedPaddingTop}px`,
  ```
- Change title block `marginBottom` to:
  ```typescript
  marginBottom: `${calculatedMarginBottom}px`,
  ```

**Step 3: Run verify compilation**
Run: `npx eslint src/compositions/layouts/TemplateLayout.tsx`
Expected: PASS

**Step 4: Commit**
```bash
git add my-video/src/compositions/layouts/TemplateLayout.tsx
git commit -m "feat: implement responsive top padding and title margin in TemplateLayout"
```

---

### Task 2: Disable flex-shrink on CircularProgressMode and EarningsSnapshotMode

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/CircularProgressMode.tsx`
- Modify: `my-video/src/compositions/layouts/modes/EarningsSnapshotMode.tsx`

**Step 1: Modify CircularProgressMode.tsx**
Add `flexShrink: 0` to `containerStyle`:
```typescript
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    maxWidth: t.container?.maxWidth || "960px",
    zIndex: 5,
    flexShrink: 0
  };
```

**Step 2: Modify EarningsSnapshotMode.tsx**
Add `flexShrink: 0` to `containerStyle`:
```typescript
  const containerStyle: React.CSSProperties = {
    borderRadius: "36px",
    background: isLight
      ? "rgba(255, 255, 255, 0.72)"
      : "linear-gradient(rgba(8, 16, 28, 0.34), rgba(2, 6, 23, 0.18))",
    border: isLight
      ? "1px solid rgba(0, 0, 0, 0.08)"
      : "1px solid rgba(255, 255, 255, 0.22)",
    boxShadow: isLight
      ? "0 26px 62px rgba(0, 0, 0, 0.06)"
      : `rgba(0, 0, 0, 0.22) 0px 30px 78px, rgba(255, 255, 255, 0.08) 0px 0px 0px 1px inset, rgba(${rgb}, 0.094) 0px 0px 34px`,
    backdropFilter: "blur(9px) saturate(1.08)",
    padding: resolvePadding("36px", paddingScale),
    minHeight: "720px",
    display: "grid",
    gridTemplateColumns: "1.25fr 1fr",
    gap: "28px",
    alignItems: "stretch",
    width: "100%",
    maxWidth: t.container.maxWidth || "1020px",
    zIndex: 5,
    boxSizing: "border-box",
    flexShrink: 0
  };
```

**Step 3: Run verify compilation**
Run: `npx eslint src/compositions/layouts/modes/CircularProgressMode.tsx src/compositions/layouts/modes/EarningsSnapshotMode.tsx`
Expected: PASS

**Step 4: Commit**
```bash
git add my-video/src/compositions/layouts/modes/CircularProgressMode.tsx my-video/src/compositions/layouts/modes/EarningsSnapshotMode.tsx
git commit -m "feat: disable flex-shrink on CircularProgressMode and EarningsSnapshotMode root views"
```
