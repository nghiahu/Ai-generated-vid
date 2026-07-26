# TSX Code Sanitizer & Concept-Aware Fallback Engine Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement automatic TSX code sanitization to auto-repair 99% of LLM TSX syntax errors and upgrade the Fallback Engine to route to concept-matching fallback layouts (Terminal, Flow, VS, Gauge, Grid, CTA) instead of repeating 3 glass cards.

**Architecture:** 
1. Add `sanitizeTSXCode(code)` helper in `backend/services/aiGen.js` to strip TypeScript type annotations, fix unescaped quotes, inject missing Remotion/Lucide imports, and sanitize JSX tags before Sucrase `compileTSX`.
2. Upgrade `generateSafetyNetTSX(scene)` in `backend/services/aiGen.js` to perform keyword matching on `scene.visualConcept` / `scene.visualPattern` to return concept-matching fallbacks.

**Tech Stack:** Node.js (Express backend), Sucrase, React TSX, Remotion, Lucide Icons.

---

### Task 1: Implement `sanitizeTSXCode` & Upgrade `compileTSX` (`aiGen.js`)

**Files:**
- Modify: `backend/services/aiGen.js:370-410` (`compileTSX` and `sanitizeTSXCode`)
- Create Test: `backend/scratch/test_tsx_sanitizer.js`

**Step 1: Write scratch test for TSX Code Sanitizer**

Create scratch test `backend/scratch/test_tsx_sanitizer.js` to test sanitization of broken TSX snippets (TS types, unescaped quotes, missing imports).

```javascript
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { compileTSX, sanitizeTSXCode } = require("../services/aiGen");

function testSanitizer() {
  console.log("Testing TSX Code Sanitizer & Compiler...");

  // Sample TSX snippet with common LLM syntax flaws (TS type annotations, missing imports)
  const flawedTsx = `
import React from 'react';
import { useCurrentFrame } from 'remotion';

interface SceneProps {
  heading: string;
}

export const GeneratedScene: React.FC<SceneProps> = ({ fps = 30 }: any) => {
  const frame = useCurrentFrame();
  const alertText = "BẮT ĐẦU "NGAY" VỚI AI";
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Sparkles size={24} />
      <h1>{alertText}</h1>
    </div>
  );
};
export default GeneratedScene;
`;

  const sanitized = sanitizeTSXCode(flawedTsx);
  console.log("Sanitized Output Snippet:\n", sanitized.substring(0, 300));

  const compiled = compileTSX(flawedTsx);
  if (!compiled || compiled.length < 50) {
    throw new Error("Sanitization failed to produce valid compiled JS");
  }

  console.log("✅ TSX Code Sanitizer & Compiler Test Passed! Compiled length:", compiled.length);
}

testSanitizer();
```

**Step 2: Run test to verify initial failure**

Run: `node backend/scratch/test_tsx_sanitizer.js`

**Step 3: Implement `sanitizeTSXCode` in `aiGen.js`**

Implement robust sanitization rules:
- Remove `interface ... { ... }` and `type ... = ...` blocks.
- Remove `: React.FC<...>` and parameter type annotations.
- Fix double quote escapes in string literals.
- Ensure `Sparkles`, `Terminal`, `Zap`, `Cpu`, `Layers` and `spring`, `interpolate` imports exist if referenced in JSX.

**Step 4: Run test to verify it passes**

Run: `node backend/scratch/test_tsx_sanitizer.js`  
Expected: PASS

**Step 5: Commit**

```bash
git add backend/services/aiGen.js backend/scratch/test_tsx_sanitizer.js
git commit -m "feat(aiGen): add TSX Code Sanitizer to auto-repair LLM syntax errors before compilation"
```

---

### Task 2: Implement Concept-Aware Smart Fallback Router (`aiGen.js`)

**Files:**
- Modify: `backend/services/aiGen.js:660-680` (`generateSafetyNetTSX`)
- Create Test: `backend/scratch/test_concept_fallback_router.js`

**Step 1: Write scratch test for concept fallback router**

Create `backend/scratch/test_concept_fallback_router.js` to verify that concepts (`CODE_TERMINAL_DIFF`, `HORIZON_3STEP_FLOW`, `VS_SPLIT_COMPARISON`, `HERO_GAUGE_RING`, `OUTRO_CTA_PULSE`) return distinct fallback layouts.

```javascript
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { generateSafetyNetTSX } = require("../services/aiGen");

function testConceptFallback() {
  console.log("Testing Concept-Aware Fallback Router...");

  const concepts = [
    { visualConcept: "CODE_TERMINAL_DIFF", heading: "Terminal Code" },
    { visualConcept: "HORIZON_3STEP_FLOW", heading: "3 Step Flow" },
    { visualConcept: "VS_SPLIT_COMPARISON", heading: "Split Versus" },
    { visualConcept: "HERO_GAUGE_RING", heading: "Gauge Metric" },
    { visualConcept: "OUTRO_CTA_PULSE", heading: "Outro Action" }
  ];

  const generatedFallbacks = new Set();

  for (const c of concepts) {
    const tsx = generateSafetyNetTSX(c);
    if (!tsx || tsx.length < 100) {
      throw new Error(`Failed to generate fallback for concept ${c.visualConcept}`);
    }
    // Check key signature elements
    if (c.visualConcept.includes("CODE") && !tsx.includes("hyperframe_diff")) {
      throw new Error("CODE_TERMINAL_DIFF fallback missing terminal window");
    }
    generatedFallbacks.add(tsx.substring(0, 100));
  }

  if (generatedFallbacks.size < concepts.length) {
    throw new Error("Fallback engine returned duplicate templates across distinct concepts!");
  }

  console.log(`✅ Concept Fallback Router Test Passed! Generated ${generatedFallbacks.size} distinct templates.`);
}

testConceptFallback();
```

**Step 2: Run test to verify initial failure**

Run: `node backend/scratch/test_concept_fallback_router.js`

**Step 3: Update `generateSafetyNetTSX` in `aiGen.js`**

Implement concept keyword router:
- `TERMINAL` / `CODE` / `DIFF` ➔ `safetyNetCodeTerminal(scene)`
- `FLOW` / `STEP` / `TIMELINE` ➔ `safetyNetProcessTimeline(scene)`
- `VS` / `VERSUS` / `COMPARE` ➔ `safetyNetComparisonVersus(scene)`
- `GAUGE` / `METRIC` / `RING` ➔ `safetyNetHeroMetric(scene)`
- `GRID` / `TILES` / `MATRIX` ➔ `safetyNetStatGrid(scene)`
- `OUTRO` / `CTA` / `ACTION` ➔ `safetyNetOutroCTA(scene)`

**Step 4: Run test to verify it passes**

Run: `node backend/scratch/test_concept_fallback_router.js`  
Expected: PASS

**Step 5: Commit**

```bash
git add backend/services/aiGen.js backend/scratch/test_concept_fallback_router.js
git commit -m "feat(aiGen): upgrade Fallback Engine to route to concept-matching templates"
```

---

### Task 3: End-to-End Verification & Build Check

**Files:**
- Test: Frontend build & end-to-end verification.

**Step 1: Run full frontend production build**

Run: `cd frontend && npm run build`  
Expected: 0 errors.

**Step 2: Final commit**

```bash
git add .
git commit -m "feat: complete TSX code sanitizer and concept fallback engine"
```
