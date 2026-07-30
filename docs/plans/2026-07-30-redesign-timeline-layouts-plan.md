# Redesign Timeline Layouts Implementation Plan (Camera Scroll Fix)

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement horizontal camera scrolling and left-edge line drawing for **Timeline Beam Rail**:
- Draw horizontal line from left edge of screen to center.
- Scroll camera horizontally following the line tip.
- Increase card width to `360px`.

---

### Task 1: Rewrite IntroEvidenceTimelineMode.tsx with horizontal camera pan and left-edge line draw

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/IntroEvidenceTimelineMode.tsx`

---

### Task 2: Verify compiling and rendering

**Files:**
- Run `npm run build` inside `my-video` folder to ensure it bundles with no errors.
- Test in the browser.
