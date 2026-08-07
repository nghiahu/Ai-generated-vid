# Circular Progress Layout Redesign Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Modify the Circular Progress layout by removing the main title header, making the progress circle larger with dynamic sizing, and arranging its child cards in a 2x2 grid.

**Architecture:**
1. Exclude the default title render in `TemplateLayout.tsx` for `circular_progress`.
2. Expand the circle size and implement character-length responsive font sizing in `CircularProgressMode.tsx`.
3. Shift card list layout from flex-row to grid 2x2 in `CircularProgressMode.tsx`.

**Tech Stack:** React, TypeScript, Remotion

---

### Task 1: Hide Title Header for Circular Progress Mode

**Files:**
- Modify: `my-video/src/compositions/layouts/TemplateLayout.tsx:293`

**Step 1: Check the line**
Verify line 293 in `TemplateLayout.tsx` contains the layout modes filter.

**Step 2: Modify code**
Add `layoutMode !== "circular_progress"` to the title condition.
```typescript
layoutMode !== "web_mockup_hero" && layoutMode !== "numbered_agent_panel" && layoutMode !== "circular_progress"
```

**Step 3: Verify**
Verify that it compiles without error.
Run: `npx eslint src/compositions/layouts/TemplateLayout.tsx`
Expected: PASS

**Step 4: Commit**
```bash
git add my-video/src/compositions/layouts/TemplateLayout.tsx
git commit -m "style: exclude title header from circular_progress layout"
```

---

### Task 2: Redesign Circular Progress Layout and grid cards

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/CircularProgressMode.tsx`

**Step 1: Inspect code**
Check the styles and structures of `CircularProgressMode.tsx`.

**Step 2: Modify code**
Update `CircularProgressMode.tsx` to:
1. Increase circle width/height to `480px`.
2. Calculate a dynamic font size:
   ```typescript
   const textToShow = `${Math.round(progress)}%`;
   const dynamicFontSize = textToShow.length >= 4 ? "105px" : textToShow.length === 3 ? "120px" : "135px";
   ```
3. Set `numberOverlayStyle` fontSize to `dynamicFontSize`.
4. Slice up to 4 elements: `const cardComps = otherComps.slice(1, 5);`.
5. Update `cardsContainerStyle` to grid:
   ```typescript
   const cardsContainerStyle: React.CSSProperties = {
     display: "grid",
     gridTemplateColumns: "1fr 1fr",
     gap: gap !== undefined ? `${gap}px` : (t.container?.gap || "20px"),
     width: "100%",
     marginTop: "24px",
     boxSizing: "border-box",
     padding: "0 20px",
   };
   ```
6. Update `cardStyle` to remove `flex: 1` if it stretches incorrectly (use normal grid stretch).

**Step 3: Run verify compilation**
Run: `npx tsc --noEmit` or `npx eslint src/compositions/layouts/modes/CircularProgressMode.tsx`
Expected: PASS

**Step 4: Commit**
```bash
git add my-video/src/compositions/layouts/modes/CircularProgressMode.tsx
git commit -m "feat: enlarge circular progress circle, add dynamic font size and 2x2 cards grid"
```
