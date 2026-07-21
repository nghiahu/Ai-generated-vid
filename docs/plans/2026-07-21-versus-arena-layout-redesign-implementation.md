# Versus Arena Layout Redesign Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Redesign `SplitHorizontalMode.tsx` to match the exact Versus Arena reference visual design.

**Architecture:** Implement dual accent glowing cards, compact dark `VS` badge, text deduplication, and dynamic keyword highlighting.

**Tech Stack:** React, Remotion, TypeScript.

---

### Task 1: Redesign `SplitHorizontalMode.tsx`

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/SplitHorizontalMode.tsx`

**Step 1: Implement Dual Accent & Compact VS Badge**
- Set `VS` badge to 56px, background `#020617`, color `#ffffff`.
- Set left card border/glow to `#EF4444`, right card border/glow to `#EAB308`.
- Apply `highlightHeadingText` to left and right cards with their respective colors.
- Deduplicate tailing repeated words in card text.

**Step 2: Verification**
- Verify in preview player that the layout matches the sample image.
