# Dynamic Watermark & Remove AI LAB Hardcode Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Eliminate hardcoded `"AI LAB"` watermark override and enforce 100% adherence to user watermark settings (hide completely when disabled, render custom text and position when enabled).

**Architecture:** Update `my-video/src/compositions/MainComposition.tsx` watermark overlay block and ensure `StudioAIGen.jsx` passes watermark config properly.

**Tech Stack:** React (TSX), Remotion.

---

### Task 1: Update Watermark Rendering Logic in `MainComposition.tsx`

**Files:**
- Modify: `my-video/src/compositions/MainComposition.tsx`

**Steps:**
1. Update `MainComposition.tsx` lines 345-400:
   - Check `if (!config?.watermark?.enabled) return null;`.
   - Remove `"AI LAB"` string and hardcoded `ai_hub_grid` overrides.
   - Render `config.watermark.text` using position styles (`top-right`, `top-left`, `bottom-right`, `bottom-left`).

---

### Task 2: Pass Watermark Config in `StudioAIGen.jsx`

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx`

**Steps:**
1. Ensure `watermark` config (`enabled`, `text`, `position`) is included in `project.config` or passed to `MasterPlayer`.

---

### Task 3: Verification

**Files:**
- Verify building `my-video` with `npx remotion bundle` or checking compilation.
