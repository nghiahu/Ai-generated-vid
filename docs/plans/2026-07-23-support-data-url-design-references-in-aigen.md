# Support Base64 Data URLs for Design Reference Images Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Fix Data URL parsing in `urlToGenerativePart` so Gemini Vision API receives uploaded design reference images and applies layout adaptation in scene code generation.

**Architecture:** Update `urlToGenerativePart` in `aiGen.js` to parse `data:image/...` Data URLs, enhance vision layout prompt instructions, and verify base64 image payload extraction.

**Tech Stack:** Node.js, Gemini Vision API, JavaScript (ES6+), Buffer.

---

### Task 1: Update `urlToGenerativePart` & Vision Prompt in `aiGen.js`

**Files:**
- Modify: `backend/services/aiGen.js`

**Steps:**
1. Update `urlToGenerativePart` in `aiGen.js` to check if `imageUrl` starts with `data:image/`, parse MIME type and base64 payload, and return `{ inlineData: { data, mimeType } }`.
2. Enhance `referenceInstruction` in `generateTSXCodeForScene` to instruct Gemini Vision API to replicate spatial layout, card grid arrangement, and visual placements from reference images.

---

### Task 2: Verification & Test Suite

**Files:**
- Create and run backend verification test script `backend/test_data_url_verify.js` testing Data URL base64 extraction and `urlToGenerativePart` output.
