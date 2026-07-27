# Design: Automatic Gemini Token Usage Tracking for Studio AI Gen

**Date:** 2026-07-27  
**Status:** Approved  

## 1. Goal & Context
Fix 0-token count bug in `video_token_usage.log` by extracting `usageMetadata` from Gemini API responses during Studio AI Gen workflows and accumulating token usage in PostgreSQL DB (`db.accumulateTokens`).

---

## 2. Technical Changes

### Step 1: Update `generateContentWithFallback` in `backend/services/aiGen.js`
Accept `projectId` parameter and accumulate tokens whenever `result.response.usageMetadata` is present:
```js
const usage = result.response?.usageMetadata;
if (usage && projectId) {
  const promptTokens = usage.promptTokenCount || usage.promptTokens || 0;
  const completionTokens = usage.candidatesTokenCount || usage.completionTokens || 0;
  if (promptTokens > 0 || completionTokens > 0) {
    db.accumulateTokens(projectId, promptTokens, completionTokens).catch(err => {
      console.error("[Studio AI Gen] Failed to accumulate tokens:", err.message);
    });
  }
}
```

### Step 2: Propagate `projectId` Across Studio AI Gen Pipeline
- Pass `projectId` into `generateScenePlanForAIGen`.
- Pass `projectId` into `generateTSXCodeForScene`.
- Pass `projectId` into `generateSingleSceneCode`.
- Pass `projectId` to `generateContentWithFallback` on all API attempts (including self-correction retries).

---

## 3. Verification Plan
1. Create test script `backend/scratch/test_token_accumulation.js` to simulate Gemini token extraction and DB accumulation.
2. Verify `projects` DB record has non-zero `tokenUsage` in `config`.
