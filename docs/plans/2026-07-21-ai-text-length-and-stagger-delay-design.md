# Design Document: AI Text Length & Early Stagger Delay Optimization

**Date:** 2026-07-21  
**Status:** Approved  
**Target Modules:** `backend/services/ai.js`, `backend/services/contractLoader.js`

---

## 1. Overview & Problem Statement
Currently, two critical UX issues affect generated videos:
1. **Excessively long point text from AI**: AI generates full sentences instead of short, punchy visual bullet points, making cards bloated, overflowing, and visually messy.
2. **Late element appearance delays**: Element delays are spread out over `duration - 1.0s`. In a 6-second scene with 3 items, the last item appears at `~3.8s`, leaving only ~2 seconds before transition — users don't have enough time to read before scene changes.

---

## 2. Solution Architecture

### 2.1 AI Prompt & Schema Optimization (`backend/services/ai.js`)
- **Strict Concise Text Guidelines**:
  - Update `systemInstruction` in `generateDetailedStoryboard` with explicit instructions and contrast examples:
    - ❌ Bad: *"Học nhiều nhưng trong quá trình làm việc thực tế vẫn giữ thái độ im lặng không chịu giao tiếp"*
    - ✅ Good: *"Học nhiều vẫn im"*
  - Enforce maximum 6-8 words / 40-45 characters per point in prompt instructions and schema descriptions.
- **Systematic Prompt Enforcement**:
  - Instruct AI to treat point text as high-impact visual headlines/keywords, NOT narrative paragraphs.

### 2.2 Compressed Early Stagger Delay Calculation (`backend/services/contractLoader.js` & `backend/services/ai.js`)
- **50% Duration Cap Rule**:
  - Cap the delay of the final item at `50%` of the total scene duration (`maxLastDelay = sceneDuration * 0.5`).
  - Example for a 6.0s scene with 3 items:
    - Base delay: `0.4s`
    - Max delay for item 3: `3.0s`
    - Calculated delays: `0.4s`, `1.7s`, `3.0s`
    - Remaining view time after full appearance: `3.0s` (50% of scene duration) — allowing ample time to read!

### 2.3 Safe Text Validation (No Word-Breaking Truncations)
- Maintain semantic integrity: Do NOT perform raw character slicing (`substring`) that breaks words or alters sentence meaning.
- Rely on AI prompt strictness and contract limits (`maxPointChars: 40-50`) during AI generation.

---

## 3. Verification Plan
- Verify `ai.js` and `contractLoader.js` changes via build/tests.
- Test delay calculation logic with various scene durations (4.0s, 6.0s, 8.0s) and item counts (2, 3, 4).
