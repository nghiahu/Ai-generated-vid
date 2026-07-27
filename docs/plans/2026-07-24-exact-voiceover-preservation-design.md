# Design: Exact Voiceover Script Preservation & Structured Script Parser

**Date:** 2026-07-24  
**Status:** Approved  
**Topic:** Ban AI voiceover summarizing, truncation, and paraphrasing in `generateScenePlanForAIGen` (`aiGen.js`), enforcing 100% exact preservation of the user's original script text and support for timestamped/structured multi-column script formats.

---

## 1. Problem Statement

When users supplied detailed scripts in Studio AI Gen (e.g. multi-line structured scripts with `0-8s HOOK`, `Lời thoại Gốc`, `On-screen text`), Gemini in Phase 1 (`generateScenePlanForAIGen`) rewrote and truncated long voiceovers into short summarized sentences (e.g. shrinking a 50-word voiceover into 15 words).

---

## 2. Proposed Architecture & System Design

### Component A: Strict Voiceover Preservation Prompt Rules (`aiGen.js`)
- In `generateScenePlanForAIGen` in `backend/services/aiGen.js`:
  - Add explicit mandatory rule: `100% EXACT VOICEOVER PRESERVATION (ABSOLUTE RULE)`:
    - AI is strictly prohibited from summarizing, shortening, paraphrasing, truncating, or rewriting the user's original voiceover text.
    - 100% of the exact wording provided by the user in the input script MUST be preserved in each scene's `voiceover` property.
  - Set `temperature: 0.0` for deterministic adherence.

### Component B: Structured Multi-Column & Timestamp Script Parsing (`aiGen.js`)
- Teach Gemini to parse structured user input containing timestamps (`0-8s`, `8-16s`), column headers (`Lời thoại`, `On-screen text`, `B-roll`), or phonemes:
  - If `Lời thoại (Phiên âm đọc)` or `Lời thoại (Gốc)` is present, extract that exact block as `voiceover`.
  - Extract `On-screen text` / `B-roll` keywords as `heading`, `points`, `alertText`, and `visualPattern`.

---

## 3. Verification Plan
1. **Preservation Test**:
   - Pass the user's exact long AlphaFold script into `generateScenePlanForAIGen` and verify the output `voiceover` contains 100% of the original text without truncation.
2. **Build Verification**:
   - Run production build `npm run build` in `frontend` to verify zero errors.
