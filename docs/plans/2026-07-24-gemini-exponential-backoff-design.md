# Design: Exponential Backoff & Active Model Fallback Pool for Gemini API 503 Errors

**Date:** 2026-07-24  
**Status:** Approved  
**Topic:** Eliminate 503 Service Unavailable errors and yellow warning signs in Studio AI Gen using randomized exponential backoff retries, active model fallback pool (`gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-2.5-pro`), and pre-compiled glass card safety net.

---

## 1. Problem Statement

When Google AI Studio servers experience transient load spikes (lasting 1-2 seconds), Gemini API returns `503 Service Unavailable / Model Overloaded`. 

In `backend/services/aiGen.js`, `generateContentWithFallback` retried only 1 time with a fixed 2-second delay on 1 sliced fallback model. When both attempts failed, `generateContentWithFallback` threw an exception, returning an empty TSX string (`""`) and causing Frontend `SceneWrapper` to render a yellow ⚠️ warning sign on a white background.

---

## 2. Proposed Architecture & System Design

### Component A: Exponential Backoff Retry Engine with Jitter (`aiGen.js`)
- In `backend/services/aiGen.js`:
  - Update `generateContentWithFallback`:
    - Catch 503 (Overloaded), 429 (Rate Limit), and 500 transient errors.
    - Perform up to 3 retries per model.
    - Calculate backoff delay: `delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000` (1.5s -> 3.5s -> 6.5s).
    - Log retry attempt details: `[Studio AI Gen] 503 Overloaded detected on ${modelName}. Retrying in ${delay}ms (Attempt ${attempt}/3)...`.

### Component B: Active Production Model Fallback Pool (`aiGen.js`)
- Use active, non-deprecated Google AI Studio model IDs:
  - Primary: `gemini-2.5-flash`
  - Fallbacks: `gemini-1.5-flash`, `gemini-2.5-pro`

### Component C: Pre-Compiled Glass Card Safety Net (`aiGen.js`)
- If Gemini API fails completely after all retries across all models:
  - Automatically return pre-compiled Remotion Glass Card TSX code containing the user's exact scene heading, voiceover, and points.
  - Ensures `compiledJS` is **never empty**, eliminating white screens and yellow warning signs.

---

## 3. Verification Plan
1. **Backoff Engine Unit Test**:
   - Create test script `backend/test_backoff_retry.js` simulating 503 errors and verify backoff delays and fallback execution.
2. **End-to-End Execution Test**:
   - Trigger scene generation and verify 0 empty scenes and 0 yellow warning signs.
