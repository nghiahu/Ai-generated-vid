# Circular Progress Equal Height Cards Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Modify CircularProgressMode to enforce equal card heights, vertical centering, and dynamic font resizing for long text fields.

**Architecture:**
1. Update `cardStyle` properties in `CircularProgressMode.tsx` to set fixed `height` and vertical centering `justifyContent`.
2. Compute responsive `titleFontSize` and `subtextFontSize` within the card rendering loop in `CircularProgressMode.tsx`.

**Tech Stack:** React, TypeScript, Remotion

---

### Task 1: Enforce equal height and dynamic font sizing on Circular Progress cards

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/CircularProgressMode.tsx`

**Step 1: Inspect code**
Check the current definitions of `cardStyle` and JSX rendering in `CircularProgressMode.tsx`.

**Step 2: Modify code**
Update `CircularProgressMode.tsx` to:
1. Change `minHeight: "220px"` to `height: "240px"`.
2. Add `justifyContent: "center"`.
3. Add dynamic font size calculations:
   ```typescript
   const titleFontSize = title.length > 25 ? "15px" : title.length > 15 ? "18px" : "21px";
   const subtextFontSize = subtext.length > 30 ? "13px" : "15px";
   ```
4. Use `titleFontSize` in the title's JSX style block, and `subtextFontSize` in the subtext's JSX style block.

**Step 3: Run verify compilation**
Run: `npx eslint src/compositions/layouts/modes/CircularProgressMode.tsx`
Expected: PASS

**Step 4: Commit**
```bash
git add my-video/src/compositions/layouts/modes/CircularProgressMode.tsx
git commit -m "feat: enforce equal card height and dynamic font size scaling in CircularProgressMode"
```
