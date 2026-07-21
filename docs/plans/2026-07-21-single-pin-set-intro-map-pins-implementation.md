# Single Pin Set Intro Map Pins Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Refactor `IntroMapPinsMode.tsx` to remove the duplicate bottom summary bar (`LOCATION 1-2-3`), expand map canvas height to `480px`, and enlarge the 3 Pin cards (`PIN-1`, `PIN-2`, `PIN-3`) on the map grid.

**Architecture:** Modify `my-video/src/compositions/layouts/modes/IntroMapPinsMode.tsx` to expand canvas layout and remove the redundant bottom card section.

**Tech Stack:** React, Remotion, TypeScript.

---

### Task 1: Refactor `IntroMapPinsMode.tsx` for Single Pin Set & Expanded Map Canvas

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/IntroMapPinsMode.tsx`

**Step 1: Write implementation code**
- Remove bottom location summary cards section (`LOCATION 1`, `LOCATION 2`, `LOCATION 3`).
- Expand central map canvas height from `360px` to `480px`.
- Enlarge the 3 Pin cards: `padding: "14px 22px"`, `fontSize: getDynamicFontSize(item.text, 20, fontScale)`, `maxWidth: "260px"`.
- Adjust pin coordinates `(x, y)` and route path curve for well-spaced placement across the 480px canvas.

**Step 2: Commit file**

```bash
git add src/compositions/layouts/modes/IntroMapPinsMode.tsx
git commit -m "feat: remove duplicate bottom cards and enlarge map pin cards in IntroMapPinsMode"
```

---

### Task 2: Build & Verification Check

**Step 1: Run Remotion bundle**
Run `npm run build` inside `my-video` to confirm clean build.

**Step 2: Commit final changes**

```bash
git commit --allow-empty -m "fix(layout): verify single pin set implementation"
```
