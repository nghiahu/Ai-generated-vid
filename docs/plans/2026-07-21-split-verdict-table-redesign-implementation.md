# Split Verdict Table Redesign Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Redesign `BeforeAfterPanelMode.tsx` to match the exact visual layout of the Split Verdict Table reference image.

**Architecture:** Implement 2-row card content formatting (context body + enlarged highlighted metric below) and right card enlargement.

**Tech Stack:** React, Remotion, TypeScript.

---

### Task 1: Redesign `BeforeAfterPanelMode.tsx`

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/BeforeAfterPanelMode.tsx`

**Step 1: Implement `extractBodyAndHighlight` & 2-Row Layout**
- Extract body text and highlight keyphrase.
- Render body text on Row 1 (24-28px).
- Render highlight text on Row 2 (40-48px bold 950, Gold for left card, Red for right card).
- Enlarge right card (`scale(1.05)` and red glow).

**Step 2: Verification**
- Verify preview player matches the uploaded reference image.
