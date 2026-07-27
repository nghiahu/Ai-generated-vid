# Exponential Backoff & Active Model Fallback Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Eliminate 503 Service Unavailable errors and yellow warning signs in Studio AI Gen using randomized exponential backoff retries and pre-compiled safety net code.

**Architecture:** Update `generateContentWithFallback` in `aiGen.js` to implement exponential backoff with jitter and fallback pool (`gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-2.5-pro`), and ensure fallback TSX code is always pre-compiled.

**Tech Stack:** Node.js, Gemini API, JavaScript.

---

### Task 1: Update `generateContentWithFallback` & Fallback TSX Code in `aiGen.js`

**Files:**
- Modify: `backend/services/aiGen.js`

**Steps:**
1. In `aiGen.js`, update `generateContentWithFallback`:
   - Increase retries to 3 attempts per model.
   - Implement randomized exponential backoff: `delay = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 1000)`.
   - Update model pool to `["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.5-pro"]`.
2. In `generateTSXCodeForScene`, if all retries fail, return pre-compiled fallback glass card code instead of throwing.

---

### Task 2: Verification & Test Suite

**Files:**
- Create and run backend verification test `backend/test_backoff_verify.js` testing retry backoff logic.
