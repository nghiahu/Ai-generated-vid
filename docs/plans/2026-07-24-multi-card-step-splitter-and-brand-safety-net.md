# Multi-Card Step Splitter & Brand Safety Net Upgrade Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Ban single plain text boxes for multi-step content, enforce automatic splitting into 2-3 structured glass cards with step badges (01, 02) and Lucide icons while preserving 100% of the custom brand theme.

**Architecture:** Update `generateTSXCodeForScene` system instructions and upgrade `generateGlassCardSafetyNetTSX` in `backend/services/aiGen.js`.

**Tech Stack:** Node.js, React, TypeScript/TSX, Gemini API.

---

### Task 1: Update `generateTSXCodeForScene` & `generateGlassCardSafetyNetTSX` in `aiGen.js`

**Files:**
- Modify: `backend/services/aiGen.js`

**Steps:**
1. In `generateTSXCodeForScene` system instructions, add `ABSOLUTE BAN ON SINGLE LARGE TEXT BOXES FOR MULTI-STEP CONTENT` and mandate multi-card rendering.
2. Upgrade `generateGlassCardSafetyNetTSX` to parse multi-step clauses and render 2-3 structured glass cards with step badges (`01`, `02`) and Lucide icons.

---

### Task 2: Verification

**Files:**
- Run syntax check `node -c backend/services/aiGen.js`.
- Run production build `npm run build` in `frontend` to verify 0 errors.
