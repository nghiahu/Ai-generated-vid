# Exact Voiceover Preservation Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Ensure 100% exact preservation of user voiceover scripts in `generateScenePlanForAIGen` without summarizing, shortening, or rewriting.

**Architecture:** Update `generateScenePlanForAIGen` in `backend/services/aiGen.js` with `temperature: 0.0` and strict preservation rules.

**Tech Stack:** Node.js, Gemini API, JavaScript.

---

### Task 1: Update `generateScenePlanForAIGen` in `aiGen.js`

**Files:**
- Modify: `backend/services/aiGen.js`

**Steps:**
1. Update `systemInstruction` in `generateScenePlanForAIGen`:
   - Add `100% EXACT VOICEOVER PRESERVATION (MANDATORY & ABSOLUTE)` rule.
   - Instruct Gemini to handle structured scripts (`0-8s`, `Lời thoại`, `On-screen text`, `B-roll`).
2. Set `temperature: 0.0` in `options.generationConfig`.

---

### Task 2: Verification & Test Suite

**Files:**
- Run backend verification test `backend/test_voiceover_preservation.js`.
- Run `npm run build` in `frontend` to verify 0 errors.
