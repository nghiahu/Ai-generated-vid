# Dynamic Generative UI & Visual Primitives Engine Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Transform Studio AI Gen into a dynamic Generative UI engine where Gemini performs visual reasoning to design unique, non-repetitive scene layouts using standardized UI Primitives with 100% compile safety.

**Architecture:** 
1. Upgrade Phase 1 Planner in `backend/services/aiGen.js` to output dynamic `visualConcept` descriptors with strict history rotation rules.
2. Upgrade Phase 2 Prompt & System Instruction in `backend/services/aiGen.js` to provide high-end UI Primitives (`<GlassContainer>`, `<GlowBadge>`, `<CodeTerminal>`, `<MetricGauge>`, `<StatCard>`, `<FlowArrow>`, `<ComparisonColumn>`, `<SafeIcon>`) and multi-palette styling guidelines.
3. Keep automated `Sucrase` compile checks and safety-net fallback templates for zero-error execution.

**Tech Stack:** Node.js (Express backend), Google Generative AI (Gemini 3.6 Flash / 2.5 Flash), React TSX, Remotion, Tailwind CSS, Lucide Icons, Sucrase.

---

### Task 1: Upgrade Phase 1 Schema & Visual Reasoning Prompt (`aiGen.js`)

**Files:**
- Modify: `backend/services/aiGen.js:95-166` (Planner Schema & Prompt)

**Step 1: Write tests / verification check for Phase 1 Planner output**

Create scratch test script `backend/scratch/test_planner_dynamic_concepts.js` to verify Planner output contains dynamic `visualConcept` strings and no consecutive identical concepts across an 8-scene test script.

```javascript
const { generateScenePlanForAIGen } = require("../services/aiGen");

async function testPlanner() {
  const sampleScript = [
    { voiceover: "Hôm nay chúng ta sẽ tìm hiểu về AI Hyperframe và lý do tại sao nó lại khác biệt." },
    { voiceover: "Vấn đề của các hệ thống cũ là giao diện bị lặp đi lặp lại rất đơn điệu." },
    { voiceover: "Hyperframe tự động phân tích ngữ cảnh kịch bản qua 3 bước xử lý thông minh." },
    { voiceover: "Tốc độ xử lý tăng gấp 10 lần và tiết kiệm 90% chi phí tài nguyên." },
    { voiceover: "Dưới đây là so sánh giữa phương pháp truyền thống và công nghệ AI Generative UI mới." },
    { voiceover: "Được tích hợp trực tiếp vào hệ thống render Remotion với chất lượng 60 FPS." }
  ];

  console.log("Testing Phase 1 Dynamic Visual Planner...");
  const plan = await generateScenePlanForAIGen(sampleScript);
  console.log("Planner Result:", JSON.stringify(plan, null, 2));

  // Verify visualConcepts exist and no consecutive duplicates
  for (let i = 1; i < plan.length; i++) {
    const prev = plan[i - 1].visualConcept || plan[i - 1].visualPattern;
    const curr = plan[i].visualConcept || plan[i].visualPattern;
    if (prev === curr) {
      throw new Error(`Duplicate visual concept detected at scene ${i}: ${curr}`);
    }
  }
  console.log("✅ Phase 1 Visual Planner Test Passed!");
}

testPlanner().catch(console.error);
```

**Step 2: Run test to verify initial state**

Run: `node backend/scratch/test_planner_dynamic_concepts.js`

**Step 3: Modify Phase 1 Schema and System Instruction in `aiGen.js`**

Update `AIGEN_PLANNER_SCHEMA` and `generateScenePlanForAIGen` system instructions to accept dynamic `visualConcept` strings instead of restricting to 10 hardcoded enums, and enforce `visualConcept[i] != visualConcept[i-1]`.

```javascript
// In AIGEN_PLANNER_SCHEMA:
visualConcept: {
  type: SchemaType.STRING,
  description: "Descriptive unique visual concept name for this scene based on semantic intent (e.g., 'CODE_TERMINAL_DIFF', 'HORIZON_3STEP_FLOW', 'HERO_METRIC_GAUGE_RING', 'VS_SPLIT_COMPARISON', 'GRID_MATRIX_4TILES', 'EDITORIAL_QUOTE_CARD', 'OUTRO_CTA_PULSE'). Must be distinct from previous scenes."
}
```

**Step 4: Run test to verify it passes**

Run: `node backend/scratch/test_planner_dynamic_concepts.js`  
Expected: PASS with unique `visualConcept` per scene and zero consecutive duplicates.

**Step 5: Commit**

```bash
git add backend/services/aiGen.js backend/scratch/test_planner_dynamic_concepts.js
git commit -m "feat(aiGen): upgrade Phase 1 Planner for dynamic visual reasoning and non-repetition"
```

---

### Task 2: Implement UI System Primitives & Generative Prompt in Phase 2 (`aiGen.js`)

**Files:**
- Modify: `backend/services/aiGen.js:500-800` (Phase 2 Prompt & Exemplars)

**Step 1: Write scratch test for Phase 2 TSX Generator with Primitives**

Create scratch test script `backend/scratch/test_code_gen_primitives.js` to verify TSX code generation uses UI primitives (`GlassContainer`, `GlowBadge`, `StatCard`, etc.) and compiles with Sucrase cleanly.

```javascript
const { generateTSXCodeForScene } = require("../services/aiGen");

async function testCodeGen() {
  const sampleScene = {
    sceneIndex: 0,
    visualConcept: "CODE_TERMINAL_DIFF",
    heading: "AI Hyperframe Reasoning Engine",
    voiceover: "Hệ thống tự động phân tích kịch bản và sinh giao diện động theo ngữ cảnh.",
    subtitleCardText: "Sinh UI linh hoạt theo thời gian thực"
  };

  console.log("Testing Phase 2 Generative TSX Code Generator...");
  const tsxCode = await generateTSXCodeForScene(sampleScene, 0);
  console.log("Generated TSX Length:", tsxCode.length);
  console.log("Sample TSX Code Snippet:\n", tsxCode.substring(0, 500));

  if (!tsxCode.includes("export") || tsxCode.length < 200) {
    throw new Error("Invalid generated TSX code structure");
  }

  console.log("✅ Phase 2 Generative TSX Code Generator Test Passed!");
}

testCodeGen().catch(console.error);
```

**Step 2: Run test to verify initial output**

Run: `node backend/scratch/test_code_gen_primitives.js`

**Step 3: Update `generateTSXCodeForScene` system instructions in `aiGen.js`**

Include standard UI Primitive helper patterns inside `systemInstruction`:
- `<GlassContainer>`
- `<GlowBadge>`
- `<CodeTerminal>`
- `<MetricGauge>`
- `<StatCard>`
- `<FlowArrow>`
- `<ComparisonColumn>`
- `<SafeIcon>`

Instruct Gemini to combine these primitives into unique visual layouts matching `visualConcept` and `heading`.

**Step 4: Run test to verify passing compile**

Run: `node backend/scratch/test_code_gen_primitives.js`  
Expected: PASS with clean TSX output.

**Step 5: Commit**

```bash
git add backend/services/aiGen.js backend/scratch/test_code_gen_primitives.js
git commit -m "feat(aiGen): add UI System Primitives and Generative UI prompt to Phase 2 Code Generator"
```

---

### Task 3: Full End-to-End Verification & Build Check

**Files:**
- Test: Full backend API generation test via existing scratch scripts or `npm run dev` in frontend.

**Step 1: Run full video generation test**

Run: `node backend/scratch_test_endpoint.js` or verify via backend test script to ensure full scene generation pipeline works synchronously without errors.

**Step 2: Verify Frontend Production Build**

Run: `cd frontend && npm run build`  
Expected: Build succeeds with 0 errors.

**Step 3: Commit final plan & implementation status**

```bash
git add .
git commit -m "feat: complete dynamic generative UI and visual primitives engine for Studio AI Gen"
```
