# Fix Blank Layout Render & Complete Layout Family Mapping Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Eliminate blank layout rendering when `otherComps` is empty by adding safe fallback component rendering in mode files, and populate all layout families in `frontend/src/components/StoryboardEditor.jsx`.

**Tech Stack:** React, TypeScript, Remotion.

---

### Task 1: Add Safe Fallbacks in Mode Renderers (`my-video/src/compositions/layouts/modes/*`)

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/SplitHorizontalMode.tsx`
- Modify: `my-video/src/compositions/layouts/modes/BeforeAfterPanelMode.tsx`
- Modify: `my-video/src/compositions/layouts/modes/OpsMonitorMode.tsx`
- Modify: `my-video/src/compositions/layouts/modes/IntroBriefingCardMode.tsx`
- Modify: `my-video/src/compositions/layouts/modes/IntroSignalStepsMode.tsx`
- Modify: `my-video/src/compositions/layouts/modes/IntroMapPinsMode.tsx`
- Modify: `my-video/src/compositions/layouts/modes/IntroRadarSignalMode.tsx`

**Step 1: Ensure safe fallback when `otherComps` is empty**
Use `const safeComps = otherComps.length > 0 ? otherComps : [{ type: "card", data: { text: titleText || "Nội dung phân cảnh" } }]`.

**Step 2: Commit changes**

```bash
git add my-video/src/compositions/layouts/modes/*.tsx
git commit -m "fix(layouts): add safe component fallbacks to prevent blank screen rendering"
```

---

### Task 2: Populate Complete Layout Families in `StoryboardEditor.jsx`

**Files:**
- Modify: `frontend/src/components/StoryboardEditor.jsx`

**Step 1: Update `LAYOUTS_BY_FAMILY` map**
Populate `Comparison / Table`, `Data / Metrics`, `Timeline` and refine `Opening / Headline` layout options.

**Step 2: Commit changes**

```bash
git add frontend/src/components/StoryboardEditor.jsx
git commit -m "feat(frontend): populate complete layout families in StoryboardEditor dropdowns"
```

---

### Task 3: Verification & Test Check

**Step 1: Verify video build**
Run Remotion build check.

**Step 2: Commit final status**

```bash
git commit --allow-empty -m "fix(storyboard): verify blank layout render fix and layout family mapping"
```
