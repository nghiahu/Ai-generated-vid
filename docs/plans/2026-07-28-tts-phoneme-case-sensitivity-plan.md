# TTS Phoneme Case Sensitivity Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Correct the TTS text optimization process to distinguish between the Vietnamese word "ai" (who) and the English acronym "AI" (Artificial Intelligence) by enforcing case-sensitivity for clashing stop words.

**Architecture:** 
1. Add a test suite `backend/tests/phoneme.test.js` using Node's built-in `node:test` runner.
2. In `backend/services/phoneme.js`, update the replacement regex logic inside `optimizeTextForPhonemes`. Specifically, if a term is a Vietnamese stop word, always match the uppercase version (`term.toUpperCase()`) and use the case-sensitive `"g"` regex flag. Otherwise, fallback to the case-insensitive `"gi"` flag.

**Tech Stack:** Node.js, `node:test`

---

### Task 1: Create failing test for case-sensitive phoneme replacement

**Files:**
- Create: `backend/tests/phoneme.test.js`

**Step 1: Write the failing test**
Create `backend/tests/phoneme.test.js` with tests asserting:
1. `"AI"` (uppercase) is replaced by `"ây-ai"`.
2. `"ai"` (lowercase) is NOT replaced.
3. `"react"` (lowercase) is still replaced by `"ri-ác"` (or its defined phoneme) case-insensitively.

```javascript
const test = require('node:test');
const assert = require('node:assert');
const { optimizeTextForPhonemes } = require('../services/phoneme');

test('TTS Phoneme Case Sensitivity - clashing terms', async () => {
  // Test case 1: uppercase "AI" should be replaced
  // Test case 2: lowercase "ai" should remain unchanged
  const input = "Không ai biết công nghệ AI sẽ đi về đâu.";
  const result = await optimizeTextForPhonemes(input);
  
  assert.match(result, /Không ai biết/);
  assert.match(result, /công nghệ ây-ai/);
});

test('TTS Phoneme Case Sensitivity - normal terms', async () => {
  // English words should still match case-insensitively
  const input = "Học react hay React Native?";
  const result = await optimizeTextForPhonemes(input);
  
  // "react" is not a stop word, so it should be replaced regardless of casing
  assert.doesNotMatch(result, /react/i);
});
```

**Step 2: Run test to verify it fails**
Run: `node --test backend/tests/phoneme.test.js`
Expected: FAIL (or it replaces `"ai"` in "Không ai biết" with `"ây-ai"`, failing the first assertion).

---

### Task 2: Implement case-sensitive matching for clashing stop words

**Files:**
- Modify: `backend/services/phoneme.js:630-636`

**Step 1: Write minimal implementation**
Modify `backend/services/phoneme.js` to change `searchPattern` and flags calculation:

```javascript
      // Nếu là Stop Word tiếng Việt (vd: ai, ba), bắt buộc dùng dạng viết hoa (AI, BA) và khớp chính xác (case-sensitive)
      const searchPattern = isStopWord ? term.toUpperCase() : term;
      const escaped = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const regex = new RegExp(
        `(?<=^|\\s|[-.,!?;()'"“”\\/\\\\*+={}\\[\\]])(${escaped})(?=$|\\s|[-.,!?;()'"“”\\/\\\\*+={}\\[\\]])`,
        isStopWord ? "g" : "gi"
      );
```

**Step 2: Run test to verify it passes**
Run: `node --test backend/tests/phoneme.test.js`
Expected: PASS

**Step 3: Commit**
```bash
git add backend/tests/phoneme.test.js backend/services/phoneme.js
git commit -m "fix(tts): enforce case-sensitivity for clashing Vietnamese stop words"
```
