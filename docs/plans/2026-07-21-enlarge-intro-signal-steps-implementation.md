# Enlarge Intro Signal Steps Cards Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Refactor `IntroSignalStepsMode.tsx` to remove the voiceover text paragraph block at the bottom and significantly enlarge the step cards (larger font `28px * fontScale`, padding `22px 32px`, badge `56px x 56px`, width `840px`).

**Architecture:** Modify `my-video/src/compositions/layouts/modes/IntroSignalStepsMode.tsx` to expand layout dimensions and remove the voiceover section.

**Tech Stack:** React, Remotion, CSS-in-JS.

---

### Task 1: Enlarge Step Cards & Remove Voiceover Paragraph in `IntroSignalStepsMode.tsx`

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/IntroSignalStepsMode.tsx`

**Step 1: Write implementation code**
- Remove `{voiceover && ...}` block at the bottom of `IntroSignalStepsMode`.
- Increase container `maxWidth` from `760px` to `840px`.
- Increase badge dimensions to `56px x 56px`, `fontSize: "22px"`.
- Increase step card padding to `resolvePadding("22px 32px", paddingScale)`.
- Increase step text `fontSize` to `${Math.round(28 * fontScale)}px`, `fontWeight: 900`.
- Adjust SVG vertical signal rail height and badge center coordinates.

**Step 2: Commit file**

```bash
git add src/compositions/layouts/modes/IntroSignalStepsMode.tsx
git commit -m "feat: enlarge step cards and remove voiceover block in IntroSignalStepsMode"
```

---

### Task 2: Build & Verification Check

**Step 1: Run Remotion bundle**
Run `npm run build` inside `my-video` to confirm clean build.

**Step 2: Commit final changes**

```bash
git commit --allow-empty -m "fix(layout): verify enlarged step cards implementation"
```
