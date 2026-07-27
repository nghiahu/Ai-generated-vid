# AI Gen Layout, Asset, Motion Validation & Caching (Layers 4-7) Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement automated visual layout validations (Layer 4), an asset caching pipeline (Layer 5), static AST animation clamping (Layer 6), and metadata-driven cache checks (Layer 7) to ensure high-performance, crash-free, and cost-effective video rendering.

**Architecture:** Visual DOM overlap and safe-area testing are performed inside the Hidden Iframe sandbox (L4). The Asset pipeline pre-resolves asset requirements before generating TSX (L5). Animation parameters are statically clamped at AST parsing stage (L6), and DB JSONB caches are queried using scene signatures (L7).

**Tech Stack:** React, Remotion, @babel/parser, @babel/generator, sucrase, Node.js, Express, JavaScript, DOM Bounding Rect API.

---

### Task 1: Implement Design Layout Validation (Layer 4)

**Files:**
- Modify: `backend/public/validation-sandbox.html`

**Step 1: Implement Bounding Box Collision and Text Truncation check**
Modify [validation-sandbox.html](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/public/validation-sandbox.html) to calculate overlaps and clipping:
- Add a helper `checkDOMSanity()` called inside `requestAnimationFrame`:
  ```js
  const errors = [];
  const elements = Array.from(rootEl.querySelectorAll('h1, h2, p, img, .card, .tile'));
  
  // 1. Check Safe Zone Overflow
  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.bottom > 1498 && el.innerText?.trim()) {
      errors.push({ type: 'safe-zone-overflow', message: `Element containing "${el.innerText.substring(0, 15)}..." overflowed into subtitle safe zone` });
    }
  });

  // 2. Check Overlaps (Bounding Box Collisions)
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const r1 = elements[i].getBoundingClientRect();
      const r2 = elements[j].getBoundingClientRect();
      
      const xOverlap = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
      const yOverlap = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
      const intersection = xOverlap * yOverlap;
      
      const area1 = r1.width * r1.height;
      const area2 = r2.width * r2.height;
      
      if (intersection > 0 && (intersection / Math.min(area1, area2)) > 0.20) {
        errors.push({
          type: 'visual-overlap',
          message: `Overlap collision: "${elements[i].innerText?.substring(0,10)}..." overlaps with "${elements[j].innerText?.substring(0,10)}..." by ${(intersection / Math.min(area1, area2) * 100).toFixed(0)}%`
        });
      }
    }
  }

  // 3. Check Text Truncation
  elements.forEach(el => {
    if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
      errors.push({ type: 'text-clipping', message: `Text truncated: "${el.innerText?.substring(0, 15)}..." has scrollOverflow` });
    }
  });
  ```

**Step 2: Run verification sandbox**
Verify sandbox successfully detects overlaps by launching mock elements and capturing messages.

**Step 3: Commit**
```bash
git add backend/public/validation-sandbox.html
git commit -m "feat: implement Layer 4 Design Layout validation in browser sandbox"
```

---

### Task 2: Implement Asset Pipeline (Layer 5)

**Files:**
- Modify: `backend/services/aiGen.js`

**Step 1: Implement asset pre-planning extraction**
In `generateScenePlanForAIGen`, ensure that Gemini returns required visual topics.
In `generateSingleSceneCode`, add a resolver helper `resolveSceneAssets(scene)`:
```js
function resolveSceneAssets(scene) {
  // Map keywords inside scene plan to local resources
  const assetMap = {
    "speed": "/assets/icons/speed.svg",
    "cpu": "/assets/icons/cpu.svg",
    "shield": "/assets/icons/shield.svg",
    "database": "/assets/icons/database.svg"
  };

  const resolved = {};
  if (scene.points) {
    scene.points.forEach((pt, idx) => {
      const lower = pt.toLowerCase();
      let matched = "/assets/icons/sparkles.svg";
      for (const [key, val] of Object.entries(assetMap)) {
        if (lower.includes(key)) matched = val;
      }
      resolved[`asset_icon_${idx}`] = matched;
    });
  }
  return resolved;
}
```

**Step 2: Inject resolved assets into generateTSXCodeForScene prompt**
In `generateTSXCodeForScene`, resolve the assets, inject them in the JSON payload of the prompt, and instruct Gemini to use the specific resolved URL values for `<img src={...} />`.

**Step 3: Verify asset loader output**
Confirm that generated components contain the correct resolved URLs instead of placeholders.

**Step 4: Commit**
```bash
git add backend/services/aiGen.js
git commit -m "feat: implement Layer 5 Asset Pipeline for verified icon and image resolution"
```

---

### Task 3: Implement AST Motion Clamping (Layer 6)

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/services/astValidator.js`
- Create: `backend/tests/motionClamping.test.js`

**Step 1: Install @babel/generator dependency**
Add `@babel/generator` to `dependencies` in `backend/package.json` and run `npm install`.

**Step 2: Write failing test**
Create `backend/tests/motionClamping.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert');
const { clampMotionParameters } = require('../services/astValidator');

test('Should clamp out-of-bounds spring config values to safe defaults', () => {
  const tsx = `
    import { spring } from 'remotion';
    const val = spring({ frame, fps, config: { damping: 500, stiffness: 900 } });
  `;
  const repaired = clampMotionParameters(tsx);
  assert.match(repaired, /damping:\s*14/);
  assert.match(repaired, /stiffness:\s*55/);
});
```

**Step 3: Run test to verify it fails**
Run: `node --test backend/tests/motionClamping.test.js`
Expected: FAIL (clampMotionParameters not defined)

**Step 4: Implement AST Clamping logic**
In `backend/services/astValidator.js`, implement `clampMotionParameters` using `@babel/generator`:
```js
const generator = require('@babel/generator').default;

function clampMotionParameters(code) {
  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"]
    });

    traverse(ast, {
      CallExpression(path) {
        if (path.node.callee.name === 'spring') {
          const argObj = path.node.arguments[0];
          if (argObj && argObj.type === 'ObjectExpression') {
            const configProp = argObj.properties.find(p => p.key?.name === 'config');
            if (configProp && configProp.value.type === 'ObjectExpression') {
              const damping = configProp.value.properties.find(p => p.key?.name === 'damping');
              const stiffness = configProp.value.properties.find(p => p.key?.name === 'stiffness');
              
              if (damping && damping.value.type === 'NumericLiteral') {
                const val = damping.value.value;
                if (val < 5 || val > 80) damping.value.value = 14; // safe default
              }
              if (stiffness && stiffness.value.type === 'NumericLiteral') {
                const val = stiffness.value.value;
                if (val < 10 || val > 300) stiffness.value.value = 55;
              }
            }
          }
        }
      }
    });

    return generator(ast).code;
  } catch (err) {
    return code; // Return original if parsing fails
  }
}
```
Export `clampMotionParameters`. Integrate it at the end of `validateTSXCode` or inside `generateSingleSceneCode` before compiling.

**Step 5: Run tests and verify they pass**
Run: `node --test backend/tests/motionClamping.test.js`
Expected: PASS

**Step 6: Commit**
```bash
git add backend/package.json backend/services/astValidator.js backend/tests/motionClamping.test.js
git commit -m "feat: implement Layer 6 AST Motion Clamping for safe animation spring parameters"
```

---

### Task 4: Implement Caching & Rich Metadata (Layer 7)

**Files:**
- Modify: `backend/services/aiGen.js`
- Modify: `backend/services/db.js`

**Step 1: Write signature check and caching loop**
In `backend/services/aiGen.js`, add a caching resolver `getCachedScene(projectId, sceneIndex, hash)`:
- Create `sha256` hashing logic.
- Look up project configs in `db.js`.
- If match, return code directly.

**Step 2: Save metadata on successful generation**
Update `generateSingleSceneCode` to include metadata properties (`visualIntent`, `motionStyle`, `compileHash`, `promptHash`) in the config object saved to PostgreSQL database.

**Step 3: Verify caching output**
Confirm compile time drops to <50ms on cache hit.

**Step 4: Commit**
```bash
git add backend/services/aiGen.js backend/services/db.js
git commit -m "feat: implement Layer 7 Metadata and Compile Caching layer in PostgreSQL"
```
