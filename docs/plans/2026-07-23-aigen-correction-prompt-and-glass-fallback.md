# AI Gen Correction Prompt & Premium Glass Fallback Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Eliminate plain black fallback screens and achieve 100% TSX compilation success by enhancing Gemini correction prompt with detailed Sucrase error traces and building a premium Glass Card fallback template.

**Architecture:** Update `aiGen.js` correction prompt, replace bare fallback component with a styled Glass Card Remotion component, and add icon pre-sanitization.

**Tech Stack:** Node.js, React (TSX), Remotion, Sucrase

---

### Task 1: Build Premium Glass Card Fallback Component & Enhance Pre-Sanitization in `aiGen.js`

**Files:**
- Modify: `backend/services/aiGen.js`

**Steps:**
1. Upgrade fallback component in `generateSingleSceneCode` from bare black div to full Glass Card Remotion component (ambient glowing orbs, glass card container, `Sparkles` icon badge, spring animation, subtitle support).
2. Enhance `sanitizeImportStatements` to map unknown icon imports to safe icons (`Sparkles`, `Zap`, `Shield`).

---

### Task 2: Enhance Gemini Correction Prompt with Sucrase Diagnostic Trace in `aiGen.js`

**Files:**
- Modify: `backend/services/aiGen.js`

**Steps:**
1. Update `catch (codeErr)` in `generateSingleSceneCode` to include exact Sucrase line/token error message, allowed imports list, and strict formatting rules in `correctionPrompt`.
2. Ensure corrected code passes through `cleanAndExtractCode` and `compileTSX` safely.

---

### Task 3: Verification

**Files:**
- Run test script verifying fallback TSX code compiles cleanly and correction prompt handles Sucrase errors properly.
