# Uniform Equal Intro Signal Steps Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Refactor `IntroSignalStepsMode.tsx` to enforce 100% equal width, uniform padding, and dynamic font sizing across all 3 step cards so cards are visually identical in size regardless of text length.

**Architecture:** Modify `my-video/src/compositions/layouts/modes/IntroSignalStepsMode.tsx` to use fixed card widths, `getDynamicFontSize` text scaling, and uniform `minHeight`.

**Tech Stack:** React, Remotion, TypeScript.

---

### Task 1: Refactor `IntroSignalStepsMode.tsx` for Equal Uniform Card Sizes

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/IntroSignalStepsMode.tsx`

**Step 1: Write implementation code**
- Calculate `dynamicFontSize = getDynamicFontSize(item.text, 26, fontScale)` for consistent single/double line text fitting across all 3 cards.
- Ensure all 3 step cards use `width: "100%"`, `minHeight: "88px"`, `padding: resolvePadding("20px 28px", paddingScale)`.
- Apply `marginLeft: "48px"` to Step 2 wrapper while expanding outer container width (`maxWidth: "880px"`) so Card 2 has 100% matching visual width.
- Align SVG signal rail coordinates to badge centers.

**Step 2: Commit file**

```bash
git add src/compositions/layouts/modes/IntroSignalStepsMode.tsx
git commit -m "feat: make step cards 100% equal and uniform size in IntroSignalStepsMode"
```

---

### Task 2: Build & Verification Check

**Step 1: Run Remotion bundle**
Run `npm run build` inside `my-video` to confirm clean build.

**Step 2: Commit final changes**

```bash
git commit --allow-empty -m "fix(layout): verify uniform equal step cards implementation"
```
