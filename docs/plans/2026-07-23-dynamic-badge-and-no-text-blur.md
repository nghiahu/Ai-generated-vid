# Dynamic Alert Badge & Crisp Text Rule Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Remove `"AI GENERATED SCENE"` badge from fallback component, enforce crisp 100% unblurred text prompt rules, and sanitize blur styles on heading text.

**Architecture:** Update fallback component in `aiGen.js` to render dynamic `scene.alertText` or `null`, add `NO BLUR ON TEXT` prompt rule, and sanitize text blur styles in `sanitizeImportStatements`.

**Tech Stack:** Node.js, React, Sucrase.

---

### Task 1: Update Fallback Badge & System Prompt in `aiGen.js`

**Files:**
- Modify: `backend/services/aiGen.js`

**Steps:**
1. In `aiGen.js`, update fallback component badge rendering: replace `AI GENERATED SCENE` with `scene.alertText` or `null` if none provided.
2. In `systemInstruction` in `aiGen.js`, add `NO BLUR ON TEXT (MANDATORY & ABSOLUTE)` prompt rule.
3. In `sanitizeImportStatements` or `cleanAndExtractCode`, strip `filter: "blur(...)"` from text element styles.

---

### Task 2: Verification & Test Suite

**Files:**
- Run backend verification test `backend/test_data_url_verify.js` or create test script to verify fallback component and text blur sanitization.
