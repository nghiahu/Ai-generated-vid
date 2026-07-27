# Studio AI Gen Token Tracking Fix Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Ensure `finalProjectId` is created and saved to DB before Gemini calls begin, and update `db.saveAIGenProject` to merge `tokenUsage` so accurate token counts are logged to `video_token_usage.log`.

**Architecture:** Update `studioAiGenRoute.js` to initialize project DB entry before calling `aiGen.generateAIGenStoryboard`, and update `saveAIGenProject` in `backend/services/db.js` to merge existing `config.tokenUsage`.

**Tech Stack:** Node.js, Express, PostgreSQL.

---

### Task 1: Fix Route Initialization & DB Config Token Preservation

**Files:**
- Modify: `backend/routes/studioAiGenRoute.js:10-53`
- Modify: `backend/services/db.js:601-612`
- Test: `backend/scratch/test_token_flow_fix.js`

**Step 1: Write test script for full token flow**

Create `backend/scratch/test_token_flow_fix.js`:
```javascript
const db = require('../services/db');

async function testFullTokenFlow() {
  const projId = `proj_test_flow_${Date.now()}`;
  console.log("Testing full token accumulation & config merge for:", projId);
  
  // 1. Initial save (IN_PROGRESS)
  await db.saveAIGenProject(projId, "Test Title", { script: "hello" }, 'IN_PROGRESS');
  
  // 2. Accumulate tokens
  await db.accumulateTokens(projId, 1200, 800);
  
  // 3. Final save (COMPLETED)
  await db.saveAIGenProject(projId, "Test Title", { script: "hello", scenes: [] }, 'COMPLETED');
  
  // 4. Verify config.tokenUsage
  const proj = await db.getProjectById(projId);
  console.log("Resulting Project Config Token Usage:", proj.config.tokenUsage);
  
  if (proj.config.tokenUsage && proj.config.tokenUsage.totalTokens === 2000) {
    console.log("✅ Full Token Flow Fix Test PASSED!");
  } else {
    console.error("❌ Full Token Flow Fix Test FAILED!");
  }
}

testFullTokenFlow();
```

**Step 2: Update `db.saveAIGenProject` in `backend/services/db.js`**

Preserve existing `config.tokenUsage` when updating project config:
```javascript
  saveAIGenProject: async (id, title, config, status = 'COMPLETED') => {
    await initDb();
    let finalConfig = config;
    try {
      const existingRes = await pool.query('SELECT config FROM projects WHERE id = $1', [id]);
      if (existingRes.rowCount > 0) {
        const existingConfig = existingRes.rows[0].config || {};
        finalConfig = {
          ...existingConfig,
          ...config,
          tokenUsage: existingConfig.tokenUsage || config.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
        };
      }
    } catch (e) {}

    const query = `
      INSERT INTO projects (id, title, status, config, type)
      VALUES ($1, $2, $4, $3, 'AIGEN')
      ON CONFLICT (id) DO UPDATE
      SET title = $2, config = $3, status = $4
      RETURNING *
    `;
    const res = await pool.query(query, [id, title, JSON.stringify(finalConfig), status]);
    return res.rows[0];
  },
```

**Step 3: Update `studioAiGenRoute.js` to save project IN_PROGRESS first**

```javascript
    const finalProjectId = projectId || `proj_aigen_${Math.random().toString(36).substr(2, 9)}`;
    const projectTitle = `AI Gen - ${script.trim().substring(0, 30)}...`;

    // Save initial project entry to DB so accumulateTokens finds the row
    await db.saveAIGenProject(finalProjectId, projectTitle, {
      script: script.trim(),
      targetLength,
      theme,
      voiceKey,
      bgImage,
      refImages
    }, 'IN_PROGRESS');

    const scenes = await aiGen.generateAIGenStoryboard({
      script: script.trim(),
      targetLength,
      theme,
      voiceKey,
      bgImage,
      refImages,
      projectId: finalProjectId
    });
```

**Step 4: Run test script to verify**

Run: `node scratch/test_token_flow_fix.js` (in `backend`)
Expected output: Full Token Flow Fix Test PASSED!

**Step 5: Commit**

```bash
git add backend/routes/studioAiGenRoute.js backend/services/db.js backend/scratch/test_token_flow_fix.js docs/plans/2026-07-27-studio-aigen-token-tracking-fix-plan.md
git commit -m "fix(backend): initialize project DB entry early and preserve tokenUsage across updates"
```
