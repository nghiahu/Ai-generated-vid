# Director Engine Sprint 3 — End-to-End Pipeline Proof

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Prove Director Engine replaces the old pipeline end-to-end: any script → DirectorManifest (via 2-pass LLM) → persisted in DB → loaded into Remotion Studio → video. Zero hardcoded data.

**Architecture:** A new `directorPlanner.js` service runs two sequential LLM passes (Pass 1: Narrative + Scene split → SceneSkeleton[]; Pass 2: Intent + Content per scene → DirectorManifest). A new `directorRoute.js` exposes POST/GET/export endpoints. DB stores the manifest in the existing `projects` table with `type='DIRECTOR'`. Remotion Studio renders via `inputProps`.

**Tech Stack:** Node.js / Express backend, `@google/generative-ai` (existing), sql.js (existing), Remotion Studio (existing `DirectorVideo` composition).

---

## Task 1: DB helpers — saveDirectorProject + getDirectorManifest

**Files:**
- Modify: `backend/services/db.js` (append after `saveAIGenProject` around line 551)

**Step 1: Add `saveDirectorProject` and `getDirectorManifest` to db.js**

Append the following two exports inside `module.exports` in `backend/services/db.js`, after the `saveAIGenProject` function:

```javascript
saveDirectorProject: async (id, title, manifest) => {
  await initDb();
  const db = await getDb();
  const config = JSON.stringify(manifest);
  const existing = queryOne(db, 'SELECT id FROM projects WHERE id = ?', [id]);
  if (existing) {
    runQuery(db, "UPDATE projects SET title=?, config=?, status='COMPLETED' WHERE id=?",
      [title, config, id]);
  } else {
    runQuery(db,
      "INSERT INTO projects (id, title, status, type, config) VALUES (?, ?, 'COMPLETED', 'DIRECTOR', ?)",
      [id, title, config]);
  }
  return queryOne(db, 'SELECT * FROM projects WHERE id = ?', [id]);
},

getDirectorManifest: async (id) => {
  await initDb();
  const db = await getDb();
  const row = queryOne(db, "SELECT * FROM projects WHERE id = ? AND type = 'DIRECTOR'", [id]);
  if (!row) return null;
  return {
    projectId: row.id,
    title: row.title,
    createdAt: row.created_at,
    manifest: JSON.parse(row.config || 'null')
  };
},
```

**Step 2: Verify the helpers work by running a scratch test**

Create `backend/scratch/test_director_db.js`:
```javascript
const db = require('../services/db');

async function main() {
  const fakeManifest = {
    version: 'director-v1',
    projectId: 'test-db-001',
    plannerVersion: 'director-planner-v1',
    model: 'gemini-test',
    promptHash: 'abc123',
    generatedAt: new Date().toISOString(),
    metadata: { width: 1080, height: 1920, fps: 30, theme: 'AI_HUB_DARK' },
    scenes: []
  };

  await db.saveDirectorProject('test-db-001', 'Test Director Project', fakeManifest);
  console.log('[Test] Saved director project ✅');

  const result = await db.getDirectorManifest('test-db-001');
  if (!result || !result.manifest) throw new Error('manifest not found after save!');
  console.log('[Test] Loaded manifest back ✅');
  console.log('[Test] projectId:', result.manifest.projectId);
  console.log('[Test] DB helpers: ALL PASS 🚀');
}
main().catch(e => { console.error('[Test FAIL]', e.message); process.exit(1); });
```

Run: `node backend/scratch/test_director_db.js`
Expected output: `DB helpers: ALL PASS 🚀`

**Step 3: Commit**

```bash
git add backend/services/db.js backend/scratch/test_director_db.js
git commit -m "feat(director): add saveDirectorProject and getDirectorManifest db helpers"
```

---

## Task 2: directorPlanner.js — 2-pass Semantic Planner

**Files:**
- Create: `backend/services/directorPlanner.js`

This is the core of Sprint 3. Two sequential LLM passes using the existing `generateContentWithFallback` pattern from `aiGen.js`.

**Step 1: Create `backend/services/directorPlanner.js`**

```javascript
// backend/services/directorPlanner.js
// Director Engine: 2-Pass Semantic Planner
// Pass 1: Script → SceneSkeleton[] (narrative arc + scene split)
// Pass 2: SceneSkeleton[] → SceneIntent + SceneContent → DirectorManifest

const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const crypto = require('crypto');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function splitIntoParagraphs(script) {
  return script
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);
}

function hashPrompt(text) {
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 12);
}

function cleanJSON(text) {
  if (!text) return '';
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

async function callLLM(genAI, systemInstruction, userPrompt, responseSchema, projectId) {
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite-preview-06-17';
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema
    }
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction
  });

  const text = result.response.text();
  return JSON.parse(cleanJSON(text));
}

// ─── Pass 1 Schema ───────────────────────────────────────────────────────────

const SCENE_SKELETON_SCHEMA = {
  type: SchemaType.ARRAY,
  description: 'Ordered list of scene skeletons representing the narrative arc',
  items: {
    type: SchemaType.OBJECT,
    properties: {
      id:               { type: SchemaType.STRING,  description: 'Unique scene id e.g. "scene_0"' },
      narrativeMoment:  { type: SchemaType.STRING,  description: 'One of: opening, rising, peak, falling, closing' },
      summary:          { type: SchemaType.STRING,  description: 'One sentence describing what this scene communicates' },
      paragraphIds:     { type: SchemaType.ARRAY,   description: 'Zero-based indices of script paragraphs this scene covers', items: { type: SchemaType.INTEGER } },
      estimatedDuration:{ type: SchemaType.NUMBER,  description: 'Estimated duration in seconds (3–12)' },
      dependencies:     { type: SchemaType.ARRAY,   description: 'IDs of scenes this scene needs context from (usually previous scene)', items: { type: SchemaType.STRING } }
    },
    required: ['id', 'narrativeMoment', 'summary', 'paragraphIds', 'estimatedDuration', 'dependencies']
  }
};

// ─── Pass 2 Schema ───────────────────────────────────────────────────────────

const DIRECTOR_SCENE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    intent: {
      type: SchemaType.OBJECT,
      properties: {
        sceneIndex:          { type: SchemaType.INTEGER, description: 'Zero-based scene index' },
        duration:            { type: SchemaType.NUMBER,  description: 'Scene duration in seconds' },
        purpose:             { type: SchemaType.STRING,  description: 'One of: hook, show_metric, compare, explain, list_points, quote, cta' },
        emotion:             { type: SchemaType.STRING,  description: 'One of: powerful, elegant, urgent, calm, curious, inspiring' },
        narrativeMoment:     { type: SchemaType.STRING,  description: 'One of: opening, rising, peak, falling, closing' },
        informationDensity:  { type: SchemaType.STRING,  description: 'One of: low, medium, high' },
        viewerAction:        { type: SchemaType.STRING,  description: 'One of: feel_emotion, focus_metric, read_comparison, absorb_list' },
        tempo:               { type: SchemaType.STRING,  description: 'One of: slow, medium, fast, explosive' },
        emphasis:            { type: SchemaType.STRING,  description: 'One of: hero, supporting, closing' }
      },
      required: ['sceneIndex','duration','purpose','emotion','narrativeMoment','informationDensity','viewerAction','tempo','emphasis']
    },
    content: {
      type: SchemaType.OBJECT,
      properties: {
        heading:    { type: SchemaType.STRING, description: 'Short hook heading (max 60 chars, Vietnamese)' },
        primary:    { type: SchemaType.STRING, description: 'Primary metric or hero text (e.g. "85%", "3× faster", key phrase)' },
        supporting: { type: SchemaType.ARRAY,  description: 'Supporting caption sentences (1–2)', items: { type: SchemaType.STRING } },
        voiceover:  { type: SchemaType.STRING, description: 'Full voiceover text for this scene from the script excerpt' },
        voiceoverTts: { type: SchemaType.STRING, description: 'Optional phonetic reading for TTS' }
      },
      required: ['heading', 'primary', 'supporting', 'voiceover']
    }
  },
  required: ['intent', 'content']
};

// ─── Pass 1: Narrative + Scene Planner ───────────────────────────────────────

async function pass1NarrativeScenePlanner(genAI, script, paragraphs, projectId) {
  const numberedParagraphs = paragraphs
    .map((p, i) => `[${i}]: ${p}`)
    .join('\n\n');

  const systemInstruction = `Bạn là Narrative Director. Nhiệm vụ của bạn là đọc một kịch bản video ngắn và chia nó thành các cảnh (scenes) theo cấu trúc narrative.

QUY TẮC QUAN TRỌNG:
1. Mỗi scene phải cover ít nhất 1 đoạn văn (paragraphIds không được rỗng).
2. Mỗi đoạn văn chỉ thuộc về ĐÚNG MỘT scene. Không trùng lặp paragraphIds.
3. Tất cả các đoạn văn (0 đến ${paragraphs.length - 1}) phải được cover bởi ít nhất một scene.
4. narrativeMoment phải tạo thành một arc có nghĩa: bắt đầu bằng "opening", kết thúc bằng "closing".
5. Số scene lý tưởng: 3–6 scenes cho video 60–90s.
6. estimatedDuration phải từ 3 đến 12 giây mỗi scene.
7. dependencies: liệt kê ID của scene trước nếu scene này cần context từ scene trước, để trống [] nếu không cần.`;

  const userPrompt = `Script video:
---
${script}
---

Đoạn văn đã đánh số:
---
${numberedParagraphs}
---

Hãy chia script này thành các scenes theo narrative arc. Trả về mảng SceneSkeleton[].`;

  console.log(`[Director Planner] Pass 1: Narrative + Scene planning (${paragraphs.length} paragraphs)...`);
  const skeletons = await callLLM(genAI, systemInstruction, userPrompt, SCENE_SKELETON_SCHEMA, projectId);
  console.log(`[Director Planner] Pass 1: Generated ${skeletons.length} scene skeletons ✅`);
  return skeletons;
}

// ─── Pass 2: Intent + Content Planner (per scene) ────────────────────────────

async function pass2IntentContentPlanner(genAI, skeleton, paragraphs, allSkeletons, sceneIndex, projectId) {
  // Extract text for this scene using paragraphIds
  const sceneText = (skeleton.paragraphIds || [])
    .map(i => paragraphs[i] || '')
    .filter(Boolean)
    .join('\n\n');

  // Build context window: previous scene summary if listed in dependencies
  let contextWindow = '';
  if (skeleton.dependencies && skeleton.dependencies.length > 0) {
    const depSummaries = skeleton.dependencies
      .map(depId => {
        const dep = allSkeletons.find(s => s.id === depId);
        return dep ? `[${dep.id}]: ${dep.summary}` : null;
      })
      .filter(Boolean);
    if (depSummaries.length > 0) {
      contextWindow = `\nBối cảnh từ cảnh trước:\n${depSummaries.join('\n')}\n`;
    }
  }

  // Next scene summary for forward context
  const nextSkeleton = allSkeletons[sceneIndex + 1];
  const nextContext = nextSkeleton
    ? `\nCảnh tiếp theo: "${nextSkeleton.summary}"`
    : '';

  const systemInstruction = `Bạn là Semantic Director. Nhiệm vụ của bạn là phân tích một đoạn kịch bản và trả về:
1. SceneIntent: Phân tích ngữ nghĩa (purpose, emotion, tempo, v.v.)
2. SceneContent: Nội dung hiển thị trên màn hình

QUY TẮC:
- heading: tối đa 60 ký tự, súc tích, bằng tiếng Việt
- primary: metric nổi bật nhất hoặc cụm từ chính (ví dụ: "85%", "3× nhanh hơn", "AI Director")
- supporting: 1–2 câu phụ ngắn gọn, hỗ trợ primary
- voiceover: giữ nguyên văn từ kịch bản, không paraphrase
- purpose "show_metric" chỉ khi có số liệu cụ thể
- informationDensity: low nếu < 20 từ, medium nếu 20–50 từ, high nếu > 50 từ`;

  const userPrompt = `Narrative moment: ${skeleton.narrativeMoment}
Scene summary: ${skeleton.summary}
${contextWindow}${nextContext}

Đoạn kịch bản của cảnh này:
---
${sceneText}
---

Hãy phân tích và trả về SceneIntent + SceneContent cho cảnh này. sceneIndex = ${sceneIndex}.`;

  console.log(`[Director Planner] Pass 2: Enriching scene ${sceneIndex} (${skeleton.narrativeMoment}: ${skeleton.summary.substring(0, 40)}...)...`);
  const result = await callLLM(genAI, systemInstruction, userPrompt, DIRECTOR_SCENE_SCHEMA, projectId);
  
  // Ensure sceneIndex and duration are set correctly
  result.intent.sceneIndex = sceneIndex;
  result.intent.duration = skeleton.estimatedDuration;
  result.intent.narrativeMoment = skeleton.narrativeMoment;
  
  return result;
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

async function generateDirectorManifest({ script, theme = 'AI_HUB_DARK', fps = 30, width = 1080, height = 1920, projectId }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const genAI = new GoogleGenerativeAI(apiKey);
  const startTime = Date.now();

  // Pre-split script into paragraphs (no LLM needed)
  const paragraphs = splitIntoParagraphs(script);
  if (paragraphs.length === 0) throw new Error('Script is empty or has no paragraphs');
  console.log(`[Director Planner] Script split into ${paragraphs.length} paragraphs`);

  // Pass 1: Generate SceneSkeleton[]
  const skeletons = await pass1NarrativeScenePlanner(genAI, script, paragraphs, projectId);
  if (!skeletons || skeletons.length === 0) throw new Error('Pass 1 returned no scene skeletons');

  // Pass 2: Enrich each skeleton → SceneIntent + SceneContent (sequential for now)
  const directorScenes = [];
  for (let i = 0; i < skeletons.length; i++) {
    const enriched = await pass2IntentContentPlanner(genAI, skeletons[i], paragraphs, skeletons, i, projectId);
    directorScenes.push({
      sceneIndex: i,
      intent: enriched.intent,
      content: enriched.content
    });
  }

  const promptHash = hashPrompt(script);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite-preview-06-17';

  const manifest = {
    version: 'director-v1',
    projectId,
    plannerVersion: 'director-planner-v1',
    model: modelName,
    promptHash,
    generatedAt: new Date().toISOString(),
    metadata: { width, height, fps, theme },
    scenes: directorScenes
  };

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Director Planner] ✅ Manifest generated: ${directorScenes.length} scenes in ${elapsed}s`);
  return manifest;
}

module.exports = { generateDirectorManifest };
```

**Step 2: Smoke-test the planner with a real script (requires running backend)**

Create `backend/scratch/test_director_planner.js`:
```javascript
const { generateDirectorManifest } = require('../services/directorPlanner');

const TEST_SCRIPT = `AI đã thay đổi mọi thứ chúng ta biết về năng suất.

Trước đây, một nhóm 10 người cần 2 tuần để phân tích dữ liệu thị trường.

Với Director Engine, cùng khối lượng công việc đó chỉ cần 4 giờ.

Hiệu suất tăng 35 lần. Không phải tự động hóa. Mà là tư duy lại toàn bộ quy trình.

Đây không phải tương lai. Đây là điều đang xảy ra ngay lúc này.`;

async function main() {
  try {
    const manifest = await generateDirectorManifest({
      script: TEST_SCRIPT,
      projectId: 'test-planner-001'
    });
    console.log('\n=== MANIFEST ===');
    console.log(JSON.stringify(manifest, null, 2));
    console.log(`\n✅ ${manifest.scenes.length} scenes generated`);
  } catch (e) {
    console.error('FAIL:', e.message);
    process.exit(1);
  }
}
main();
```

Run: `node backend/scratch/test_director_planner.js`
Expected: JSON manifest printed with 3-5 scenes, no errors.

**Step 3: Commit**

```bash
git add backend/services/directorPlanner.js backend/scratch/test_director_planner.js
git commit -m "feat(director): add 2-pass Semantic Planner (directorPlanner.js)"
```

---

## Task 3: directorRoute.js — POST + GET + export endpoints

**Files:**
- Create: `backend/routes/directorRoute.js`

**Step 1: Create the route file**

```javascript
// backend/routes/directorRoute.js
const express = require('express');
const router = express.Router();
const { generateDirectorManifest } = require('../services/directorPlanner');
const db = require('../services/db');

// POST /api/aigen/director
// Generate a DirectorManifest from a script and persist to DB
router.post('/', async (req, res) => {
  try {
    const {
      script,
      theme = 'AI_HUB_DARK',
      fps = 30,
      width = 1080,
      height = 1920
    } = req.body;

    if (!script || typeof script !== 'string' || script.trim().length === 0) {
      return res.status(400).json({ error: 'script is required and must be a non-empty string.' });
    }

    const projectId = `director_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    const title = `Director — ${script.trim().substring(0, 40)}...`;

    console.log(`[Director Route] Generating manifest for project ${projectId}...`);

    const manifest = await generateDirectorManifest({
      script: script.trim(),
      theme,
      fps,
      width,
      height,
      projectId
    });

    // Persist to DB
    await db.saveDirectorProject(projectId, title, manifest);
    console.log(`[Director Route] Manifest persisted to DB ✅`);

    res.json({ success: true, projectId, manifest });
  } catch (err) {
    console.error('[Director Route POST Error]:', err);
    res.status(500).json({ error: `Director manifest generation failed: ${err.message}` });
  }
});

// GET /api/aigen/director/:projectId
// Retrieve a persisted DirectorManifest
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await db.getDirectorManifest(projectId);
    if (!result) {
      return res.status(404).json({ error: `No Director project found with id: ${projectId}` });
    }
    res.json(result);
  } catch (err) {
    console.error('[Director Route GET Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/aigen/director/:projectId/export
// Download manifest as a JSON file (for Remotion CLI and regression fixtures)
router.get('/:projectId/export', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await db.getDirectorManifest(projectId);
    if (!result) {
      return res.status(404).json({ error: `No Director project found with id: ${projectId}` });
    }
    const filename = `manifest_${projectId}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.manifest, null, 2));
  } catch (err) {
    console.error('[Director Route export Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

**Step 2: Mount the route in server.js**

In `backend/server.js`, after line 54 (`app.use('/api/studio-ai-gen', studioAiGenRoute);`), add:

```javascript
const directorRoute = require('./routes/directorRoute');
app.use('/api/aigen/director', directorRoute);
```

**Step 3: Commit**

```bash
git add backend/routes/directorRoute.js backend/server.js
git commit -m "feat(director): add POST/GET/export endpoints at /api/aigen/director"
```

---

## Task 4: Wire DirectorRoot to accept manifest from inputProps (remove hardcoded GOLDEN_MANIFEST)

**Files:**
- Modify: `my-video/src/Root.tsx` (lines 10–45 and 114–124)

The `DirectorVideo` composition already uses `defaultProps={{ manifest: GOLDEN_MANIFEST }}`. We need to:
1. Remove the hardcoded `GOLDEN_MANIFEST` constant from `Root.tsx`
2. Keep `defaultProps` with a minimal placeholder so Remotion Studio shows the composition
3. Add `calculateMetadata` to dynamically compute `durationInFrames` from the manifest scenes

**Step 1: Update `my-video/src/Root.tsx`**

Replace the `GOLDEN_MANIFEST` constant and the `DirectorVideo` Composition registration:

```tsx
// Replace GOLDEN_MANIFEST constant (lines 10-45) with a minimal placeholder:
const DIRECTOR_DEFAULT_PROPS = {
  manifest: {
    version: 'director-v1' as const,
    projectId: 'placeholder',
    plannerVersion: 'director-planner-v1',
    model: 'placeholder',
    promptHash: 'placeholder',
    generatedAt: new Date().toISOString(),
    metadata: { width: 1080, height: 1920, fps: 30, theme: 'AI_HUB_DARK' },
    scenes: []
  }
};

// Replace DirectorVideo Composition (lines 114-124) with:
<Composition
  id="DirectorVideo"
  component={DirectorRoot}
  fps={30}
  width={1080}
  height={1920}
  defaultProps={DIRECTOR_DEFAULT_PROPS}
  calculateMetadata={({ props }) => {
    const manifest = (props as { manifest: DirectorManifest }).manifest;
    const totalSeconds = (manifest?.scenes || []).reduce(
      (sum, s) => sum + (s.intent?.duration || 6), 0
    );
    const fps = manifest?.metadata?.fps || 30;
    return {
      fps,
      durationInFrames: Math.max(fps, Math.round(totalSeconds * fps)),
    };
  }}
/>
```

**Step 2: Verify Remotion Studio still starts**

```bash
cd my-video && npm run dev
```

Expected: Remotion Studio opens at `http://localhost:3000`, `DirectorVideo` composition is listed, shows 0-frame video with placeholder props.

**Step 3: Commit**

```bash
git add my-video/src/Root.tsx
git commit -m "feat(director): DirectorVideo reads manifest from inputProps, removes hardcoded GOLDEN_MANIFEST"
```

---

## Task 5: fixtures/manifests directory + Golden Demo test

**Files:**
- Create: `fixtures/manifests/` directory
- Create: `fixtures/manifests/golden_demo_test.json` (generated from API)
- Create: `backend/scratch/test_golden_demo.js` (end-to-end demo script)

**Step 1: Create fixtures directory**

```bash
mkdir -p fixtures/manifests
echo "# Golden Manifests\n\nThese are saved DirectorManifest JSON files used for regression testing.\n\nGenerate a new one:\n\`\`\`bash\ncurl -s -X POST http://localhost:5000/api/aigen/director \\\\\n  -H 'Content-Type: application/json' \\\\\n  -d '{\"script\": \"your script here\"}' | jq '.manifest' > fixtures/manifests/golden_demo_test.json\n\`\`\`\n\nRender with Remotion CLI:\n\`\`\`bash\ncd my-video && npx remotion render DirectorVideo out.mp4 --props=../fixtures/manifests/golden_demo_test.json\n\`\`\`" > fixtures/manifests/README.md
```

**Step 2: Create the end-to-end demo script**

Create `backend/scratch/test_golden_demo.js`:
```javascript
// Golden Demo: Script → Manifest → DB → Load → Verify deterministic
const { generateDirectorManifest } = require('../services/directorPlanner');
const db = require('../services/db');
const fs = require('fs');
const path = require('path');

const GOLDEN_SCRIPT = `AI đã thay đổi mọi thứ chúng ta biết về năng suất.

Trước đây, một nhóm 10 người cần 2 tuần để phân tích dữ liệu thị trường.

Với Director Engine, cùng khối lượng công việc đó chỉ cần 4 giờ.

Hiệu suất tăng 35 lần. Không phải tự động hóa. Mà là tư duy lại toàn bộ quy trình.

Đây không phải tương lai. Đây là điều đang xảy ra ngay lúc này.`;

async function main() {
  const projectId = `golden_demo_${Date.now()}`;
  console.log('\n=== GOLDEN DEMO: Director Engine End-to-End ===\n');

  // Step 1: Generate manifest
  console.log('Step 1: Generating DirectorManifest from script...');
  const manifest = await generateDirectorManifest({ script: GOLDEN_SCRIPT, projectId });
  console.log(`✅ Manifest generated — ${manifest.scenes.length} scenes, promptHash: ${manifest.promptHash}`);

  // Step 2: Persist to DB
  console.log('\nStep 2: Persisting manifest to DB...');
  await db.saveDirectorProject(projectId, 'Golden Demo Project', manifest);
  console.log('✅ Manifest saved to DB');

  // Step 3: Load from DB (simulates refresh)
  console.log('\nStep 3: Loading manifest from DB (simulate page refresh)...');
  const loaded = await db.getDirectorManifest(projectId);
  if (!loaded || !loaded.manifest) throw new Error('Manifest not found in DB after save!');
  console.log(`✅ Manifest loaded from DB — ${loaded.manifest.scenes.length} scenes`);

  // Step 4: Verify scene count matches
  if (loaded.manifest.scenes.length !== manifest.scenes.length) {
    throw new Error('Scene count mismatch after DB roundtrip!');
  }
  console.log('✅ Scene count consistent after DB roundtrip');

  // Step 5: Export to fixtures/manifests/
  const fixturesDir = path.join(__dirname, '../../fixtures/manifests');
  if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir, { recursive: true });
  const outputPath = path.join(fixturesDir, 'golden_demo_test.json');
  fs.writeFileSync(outputPath, JSON.stringify(loaded.manifest, null, 2));
  console.log(`\n✅ Manifest exported to: ${outputPath}`);

  console.log('\n=== GOLDEN DEMO COMPLETE 🚀 ===');
  console.log('\nTo render the video:');
  console.log('  cd my-video');
  console.log('  npx remotion render DirectorVideo out.mp4 --props=../fixtures/manifests/golden_demo_test.json');
  console.log('\nOr use Remotion Studio:');
  console.log('  npm run dev');
  console.log('  → Open DirectorVideo composition → Edit Props → paste manifest JSON');
}

main().catch(e => {
  console.error('\n❌ GOLDEN DEMO FAILED:', e.message);
  process.exit(1);
});
```

**Step 3: Run the golden demo**

```bash
node backend/scratch/test_golden_demo.js
```

Expected output:
```
=== GOLDEN DEMO: Director Engine End-to-End ===

Step 1: Generating DirectorManifest from script...
✅ Manifest generated — N scenes, promptHash: ...
Step 2: Persisting manifest to DB...
✅ Manifest saved to DB
Step 3: Loading manifest from DB...
✅ Manifest loaded from DB — N scenes
✅ Scene count consistent after DB roundtrip
✅ Manifest exported to: fixtures/manifests/golden_demo_test.json

=== GOLDEN DEMO COMPLETE 🚀 ===
```

**Step 4: Commit**

```bash
git add fixtures/ backend/scratch/test_golden_demo.js
git commit -m "feat(director): add golden demo script and fixtures/manifests directory"
```

---

## Task 6: Final Verification — Render via Remotion Studio

**This task has no code changes. It is the final proof.**

**Step 1: Start the backend**
```bash
cd backend && node server.js
```
Expected: `Server running on port 5000`

**Step 2: Generate a manifest via API**
```bash
curl -s -X POST http://localhost:5000/api/aigen/director \
  -H "Content-Type: application/json" \
  -d "{\"script\": \"AI đã thay đổi mọi thứ...\"}" | jq '.'
```
Expected: JSON response with `projectId` and `manifest` containing N scenes.

**Step 3: Verify GET endpoint returns same manifest**
```bash
curl -s http://localhost:5000/api/aigen/director/<projectId> | jq '.manifest.scenes | length'
```
Expected: Same number of scenes as Step 2.

**Step 4: Export manifest to file**
```bash
curl -s http://localhost:5000/api/aigen/director/<projectId>/export > fixtures/manifests/sprint3_final.json
```

**Step 5: Start Remotion Studio and render**
```bash
cd my-video && npm run dev
```
- Open `http://localhost:3000`
- Select `DirectorVideo` composition
- Click "Edit Props"
- Paste content of `fixtures/manifests/sprint3_final.json`
- Video plays with correct scenes and animations

**OR render via CLI:**
```bash
cd my-video && npx remotion render DirectorVideo out_sprint3.mp4 \
  --props=../fixtures/manifests/sprint3_final.json \
  --overwrite
```
Expected: `out_sprint3.mp4` created successfully.

**Step 6: Final commit**
```bash
git add .
git commit -m "feat(director/sprint3): end-to-end pipeline proof complete — script → manifest → video"
```

---

## Summary of Changes

| File | Type | Description |
|------|------|-------------|
| `backend/services/db.js` | MODIFY | + `saveDirectorProject`, `getDirectorManifest` |
| `backend/services/directorPlanner.js` | CREATE | 2-pass Semantic Planner |
| `backend/routes/directorRoute.js` | CREATE | POST + GET + export REST endpoints |
| `backend/server.js` | MODIFY | Mount `/api/aigen/director` |
| `my-video/src/Root.tsx` | MODIFY | Remove hardcoded GOLDEN_MANIFEST, use inputProps |
| `fixtures/manifests/` | CREATE | Golden manifest snapshots directory |
| `backend/scratch/test_director_db.js` | CREATE | DB helpers smoke test |
| `backend/scratch/test_director_planner.js` | CREATE | Planner smoke test |
| `backend/scratch/test_golden_demo.js` | CREATE | End-to-end golden demo |

## Definition of Done

- [ ] `node backend/scratch/test_director_db.js` → `ALL PASS 🚀`
- [ ] `node backend/scratch/test_director_planner.js` → manifest JSON printed with ≥3 scenes
- [ ] `node backend/scratch/test_golden_demo.js` → `GOLDEN DEMO COMPLETE 🚀` + file exported
- [ ] `curl POST /api/aigen/director` → manifest returned
- [ ] `curl GET /api/aigen/director/:id` → same manifest after server restart
- [ ] Remotion Studio renders `DirectorVideo` with exported manifest props → video plays
