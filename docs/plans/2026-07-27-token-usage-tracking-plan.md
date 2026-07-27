# Token Usage Tracking Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Extract Gemini API `usageMetadata` during Studio AI Gen workflows and accumulate tokens in DB so `video_token_usage.log` logs accurate non-zero token counts.

**Architecture:** Update `generateContentWithFallback` in `backend/services/aiGen.js` to extract `promptTokenCount` and `candidatesTokenCount` from `result.response.usageMetadata` and call `db.accumulateTokens(projectId, promptTokens, completionTokens)`. Propagate `projectId` down through `generateScenePlanForAIGen`, `generateTSXCodeForScene`, and `generateSingleSceneCode`.

**Tech Stack:** Node.js, Express, PostgreSQL, Gemini Generative AI SDK.

---

### Task 1: Update `generateContentWithFallback` and `aiGen.js` Functions to Accumulate Token Usage

**Files:**
- Modify: `backend/services/aiGen.js:245-298`
- Modify: `backend/services/aiGen.js:1165-1305`
- Modify: `backend/services/aiGen.js:1364-1745`
- Modify: `backend/services/aiGen.js:1780-2180`
- Test: `backend/scratch/test_token_accumulation.js`

**Step 1: Write test script for token accumulation**

Create `backend/scratch/test_token_accumulation.js`:
```javascript
const db = require('../services/db');

async function testAccumulate() {
  const testProjId = `test_proj_${Date.now()}`;
  console.log("Testing token accumulation for project:", testProjId);
  try {
    await db.saveAIGenProject(testProjId, "Test Project", { voice: "duythanh" });
    await db.accumulateTokens(testProjId, 500, 250);
    const updated = await db.getProjectById(testProjId);
    console.log("Updated Project Config:", updated.config.tokenUsage);
    if (updated.config.tokenUsage.totalTokens === 750) {
      console.log("✅ Token accumulation test PASSED!");
    } else {
      console.error("❌ Token accumulation test FAILED!");
    }
  } catch (err) {
    console.error("Error in token accumulation test:", err.message);
  }
}

testAccumulate();
```

**Step 2: Update `generateContentWithFallback` in `backend/services/aiGen.js`**

Add `projectId` parameter to `generateContentWithFallback(genAI, options, promptData, fallbackModels = [], projectId = null)`:
```javascript
if (result && result.response) {
  console.log(`[Studio AI Gen] ✅ Gemini API success with model: ${modelName}`);
  const usage = result.response.usageMetadata;
  if (usage && projectId) {
    const promptTokens = usage.promptTokenCount || usage.promptTokens || 0;
    const completionTokens = usage.candidatesTokenCount || usage.completionTokens || 0;
    if (promptTokens > 0 || completionTokens > 0) {
      db.accumulateTokens(projectId, promptTokens, completionTokens).catch(err => {
        console.error("[Studio AI Gen] Failed to accumulate tokens:", err.message);
      });
    }
  }
  return result;
}
```

**Step 3: Propagate `projectId` to all `generateContentWithFallback` calls in `aiGen.js`**

- Update `generateScenePlanForAIGen`: accept `projectId` and pass to `generateContentWithFallback`.
- Update `generateTSXCodeForScene`: accept `projectId` and pass to `generateContentWithFallback`.
- Update `generateSingleSceneCode`: pass `projectId` to `generateTSXCodeForScene`.
- Update `generateAIGenStoryboard`: pass `projectId` to `generateScenePlanForAIGen` and `generateTSXCodeForScene`.

**Step 4: Run test script to verify**

Run: `node scratch/test_token_accumulation.js` (in `backend`)
Expected output: Token accumulation test PASSED!

**Step 5: Commit**

```bash
git add backend/services/aiGen.js backend/scratch/test_token_accumulation.js docs/plans/2026-07-27-token-usage-tracking-plan.md
git commit -m "feat(backend): accumulate Gemini API token usage in Studio AI Gen workflows"
```
