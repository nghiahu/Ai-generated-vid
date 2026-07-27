# AI Gen 5-Layer Validation & Sandbox Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Establish a bulletproof 5-layer validation, sandboxing, and AI self-repair orchestration pipeline for AI-generated React/Remotion video components.

**Architecture:** The Backend acts as the orchestrator checking AST and compile-time rules (Layer 1 & 2) and managing the AI self-repair loop (Layer 4). The Frontend acts as a validation runner client loading compiled scene code dynamically inside a hidden sandboxed iframe (Layer 3) to verify runtime execution, CPU lockups, and visual layout collisions/overflows (Layer 5) before sending a structured telemetry report back to the Backend.

**Tech Stack:** React, Remotion, @babel/parser, sucrase, Node.js, Express, JavaScript, HTML5 Canvas / DOM Bounding Rect API.

---

### Task 1: Install Parsing Dependencies and Set Up Test Environment

**Files:**
- Modify: `backend/package.json`
- Create: `backend/tests/helpers.js`

**Step 1: Write a test script to check if test environment works**
Create `backend/tests/sanity.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert');

test('Sanity check for Node test runner', () => {
  assert.strictEqual(1 + 1, 2);
});
```

**Step 2: Run test to verify it passes**
Run: `node --test backend/tests/sanity.test.js`
Expected: PASS

**Step 3: Update dependencies in package.json**
Add `@babel/parser` and `@babel/traverse` to `dependencies` in [package.json](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/package.json):
```json
"@babel/parser": "^7.24.0",
"@babel/traverse": "^7.24.0"
```
Run `npm install` inside the backend directory.

**Step 4: Verify packages can be loaded**
Create `backend/tests/helpers.js`:
```js
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

module.exports = { parser, traverse };
```
Run: `node -e "require('./backend/tests/helpers.js')"`
Expected: Exit status 0 (packages loaded successfully).

**Step 5: Commit**
```bash
git add backend/package.json backend/tests/sanity.test.js backend/tests/helpers.js
git commit -m "chore: install babel parser and setup backend test environment"
```

---

### Task 2: Implement Static AST Validator (Layer 1)

**Files:**
- Create: `backend/services/astValidator.js`
- Create: `backend/tests/astValidator.test.js`

**Step 1: Write the failing tests**
Create `backend/tests/astValidator.test.js` with validation test cases:
```js
const test = require('node:test');
const assert = require('node:assert');
const { validateTSXCode } = require('../services/astValidator');

test('Should reject code with missing GeneratedScene export', () => {
  const code = `import React from 'react'; export const MyComp = () => null;`;
  const result = validateTSXCode(code);
  assert.strictEqual(result.isValid, false);
  assert.match(result.error, /Missing default export or GeneratedScene/);
});

test('Should reject code importing forbidden packages', () => {
  const code = `import React from 'react'; import fs from 'fs'; export default function GeneratedScene() { return null; }`;
  const result = validateTSXCode(code);
  assert.strictEqual(result.isValid, false);
  assert.match(result.error, /Forbidden import: fs/);
});

test('Should reject code using security-risk features like eval', () => {
  const code = `import React from 'react'; export default function GeneratedScene() { eval('1+1'); return null; }`;
  const result = validateTSXCode(code);
  assert.strictEqual(result.isValid, false);
  assert.match(result.error, /Forbidden security statement: eval/);
});

test('Should reject negative Sequence starts in Remotion', () => {
  const code = `
    import React from 'react';
    import { Sequence } from 'remotion';
    export default function GeneratedScene() {
      return <Sequence from={-10} durationInFrames={30}><div>Test</div></Sequence>;
    }
  `;
  const result = validateTSXCode(code);
  assert.strictEqual(result.isValid, false);
  assert.match(result.error, /Sequence "from" frame must be non-negative/);
});
```

**Step 2: Run test to verify it fails**
Run: `node --test backend/tests/astValidator.test.js`
Expected: FAIL (validateTSXCode not defined)

**Step 3: Write minimal implementation**
Create `backend/services/astValidator.js`:
```js
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function validateTSXCode(code) {
  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"]
    });

    let hasValidExport = false;
    let errorMsg = null;

    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        const whitelist = ["react", "remotion", "lucide-react"];
        if (!whitelist.includes(source)) {
          errorMsg = `Forbidden import: ${source}`;
          path.stop();
        }
      },
      CallExpression(path) {
        if (path.node.callee.name === 'eval') {
          errorMsg = `Forbidden security statement: eval`;
          path.stop();
        }
      },
      JSXOpeningElement(path) {
        if (path.node.name.name === 'Sequence') {
          const fromAttr = path.node.attributes.find(attr => attr.name?.name === 'from');
          if (fromAttr && fromAttr.value?.type === 'JSXExpressionContainer') {
            const expr = fromAttr.value.expression;
            if (expr.type === 'UnaryExpression' && expr.operator === '-' && expr.argument.type === 'NumericLiteral') {
              errorMsg = 'Sequence "from" frame must be non-negative';
              path.stop();
            }
          }
        }
      },
      ExportDefaultDeclaration() {
        hasValidExport = true;
      },
      ExportNamedDeclaration(path) {
        if (path.node.declaration?.declarations) {
          for (const dec of path.node.declaration.declarations) {
            if (dec.id?.name === 'GeneratedScene') {
              hasValidExport = true;
            }
          }
        }
      }
    });

    if (errorMsg) return { isValid: false, error: errorMsg };
    if (!hasValidExport) return { isValid: false, error: "Missing default export or GeneratedScene named export" };

    return { isValid: true };
  } catch (err) {
    return { isValid: false, error: `AST Parsing Error: ${err.message}` };
  }
}

module.exports = { validateTSXCode };
```

**Step 4: Run test to verify it passes**
Run: `node --test backend/tests/astValidator.test.js`
Expected: PASS

**Step 5: Commit**
```bash
git add backend/services/astValidator.js backend/tests/astValidator.test.js
git commit -m "feat: implement Layer 1 Static AST Validator with Babel"
```

---

### Task 3: Implement Compile & Module Validation (Layer 2)

**Files:**
- Create: `backend/tests/compileValidator.test.js`
- Modify: `backend/services/aiGen.js`

**Step 1: Write failing test**
Create `backend/tests/compileValidator.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert');
const { compileTSX, validateCompiledJS } = require('../services/aiGen');

test('Should fail compiled validation for empty or invalid JS', () => {
  const result = validateCompiledJS("");
  assert.strictEqual(result.isValid, false);
});

test('Should compile and successfully validate a standard component', () => {
  const tsx = `
    import React from 'react';
    export const GeneratedScene = () => <div>Hello</div>;
    export default GeneratedScene;
  `;
  const compiled = compileTSX(tsx);
  const result = validateCompiledJS(compiled);
  assert.strictEqual(result.isValid, true);
});
```

**Step 2: Run test to verify it fails**
Run: `node --test backend/tests/compileValidator.test.js`
Expected: FAIL (validateCompiledJS not defined)

**Step 3: Implement validation in aiGen.js**
Add `validateCompiledJS` and export it in [aiGen.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/aiGen.js):
```js
function validateCompiledJS(compiledJS) {
  if (!compiledJS || typeof compiledJS !== "string" || compiledJS.trim() === "") {
    return { isValid: false, error: "Compiled JS is empty" };
  }

  // Basic JS syntax execution check in vm context
  const vm = require("vm");
  try {
    const mockExports = {};
    const context = vm.createContext({
      module: { exports: mockExports },
      exports: mockExports,
      require: (mod) => {
        if (["react", "remotion", "lucide-react"].includes(mod)) return {};
        throw new Error(`Cannot find module '${mod}'`);
      }
    });

    vm.runInContext(compiledJS, context, { timeout: 100 });
    const comp = mockExports.default || mockExports.GeneratedScene;
    if (!comp) {
      return { isValid: false, error: "Compiled JS does not export default or GeneratedScene component" };
    }
    return { isValid: true };
  } catch (err) {
    return { isValid: false, error: `Module Validation Failure: ${err.message}` };
  }
}
```
Add to `module.exports`:
```js
module.exports = {
  // ... existing exports
  validateCompiledJS
};
```

**Step 4: Run test to verify it passes**
Run: `node --test backend/tests/compileValidator.test.js`
Expected: PASS

**Step 5: Commit**
```bash
git add backend/tests/compileValidator.test.js backend/services/aiGen.js
git commit -m "feat: implement Layer 2 Compile Validation with VM execution check"
```

---

### Task 4: Setup Browser Validation Sandbox Page & Endpoint (Layer 3 & 5)

**Files:**
- Create: `backend/public/validation-sandbox.html`
- Modify: `backend/routes/studioAiGenRoute.js`

**Step 1: Create validation-sandbox.html**
Create `backend/public/validation-sandbox.html` to run dynamic import rendering and check boundaries:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Studio AI Gen Validation Sandbox</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <style>
    #root { width: 1080px; height: 1920px; position: relative; overflow: hidden; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // Mock Remotion and Lucide variables on window
    window.React = React;
    window.Remotion = {
      useCurrentFrame: () => 0,
      useVideoConfig: () => ({ width: 1080, height: 1920, fps: 30, durationInFrames: 120 }),
      spring: () => 1,
      interpolate: () => 0
    };
    window.LucideIcons = new Proxy({}, { get: () => () => React.createElement('div') });

    // React Error Boundary Helper
    class ErrorBoundary extends React.Component {
      constructor(props) { super(props); this.state = { hasError: false, error: null }; }
      static getDerivedStateFromError(error) { return { hasError: true, error }; }
      componentDidCatch(error, errorInfo) {
        window.parent.postMessage({ type: 'VALIDATION_ERROR', error: error.message, stack: errorInfo.componentStack }, '*');
      }
      render() { return this.state.hasError ? null : this.props.children; }
    }

    window.addEventListener('message', async (e) => {
      if (e.data.type === 'VALIDATE_CODE') {
        const { code, sceneData } = e.data;
        const rootEl = document.getElementById('root');
        
        try {
          // Process and load compiled code dynamically via blob URL
          let rewrittenJS = code
            .replace(/import\s+([\s\S]*?)\s+from\s+['"]react['"];?/gi, "const React = window.React;")
            .replace(/import\s+([\s\S]*?)\s+from\s+['"]remotion['"];?/gi, "const { useCurrentFrame, spring, interpolate } = window.Remotion;")
            .replace(/import\s+([\s\S]*?)\s+from\s+['"]lucide-react['"];?/gi, "const LucideIcons = window.LucideIcons;");

          const blob = new Blob([rewrittenJS], { type: 'application/javascript' });
          const url = URL.createObjectURL(blob);
          const mod = await import(url);
          const Component = mod.default || mod.GeneratedScene;

          const root = ReactDOM.createRoot(rootEl);
          root.render(React.createElement(ErrorBoundary, null, React.createElement(Component, { scene: sceneData || {} })));

          // Wait brief frame for layout to render fully
          requestAnimationFrame(() => {
            // Visual Overlap and Safe Area checks
            const errors = [];
            const elements = rootEl.querySelectorAll('*');
            
            // Check safe zone overflow (bottom 22% is y > 1498px)
            elements.forEach(el => {
              const rect = el.getBoundingClientRect();
              if (rect.bottom > 1498 && el.innerText?.trim()) {
                errors.push({ type: 'safe-zone-overflow', message: `Element containing "${el.innerText.substring(0, 15)}..." overflowed into subtitle safe zone` });
              }
            });

            // Post successful validation
            window.parent.postMessage({
              type: 'VALIDATION_SUCCESS',
              errors
            }, '*');
          });
        } catch (err) {
          window.parent.postMessage({ type: 'VALIDATION_ERROR', error: err.message, stack: err.stack }, '*');
        }
      }
    });
  </script>
</body>
</html>
```

**Step 2: Add validation status store and endpoint in backend**
Add a route `POST /api/studio-ai-gen/validate-result` in [studioAiGenRoute.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/routes/studioAiGenRoute.js):
```js
// Store temporary validation responses in memory index keyed by validationId
const pendingValidations = new Map();

router.post("/validate-result", (req, res) => {
  const { validationId, success, error, stack, visualErrors } = req.body;
  if (!validationId) return res.status(400).json({ error: "Missing validationId" });
  
  pendingValidations.set(validationId, { success, error, stack, visualErrors, timestamp: Date.now() });
  res.json({ success: true });
});

router.get("/validate-status/:validationId", (req, res) => {
  const val = pendingValidations.get(req.params.validationId);
  if (!val) return res.json({ status: "PENDING" });
  res.json({ status: "COMPLETE", result: val });
});
```
Make sure `pendingValidations` is clean (older than 2 minutes can be swept regularly).

**Step 3: Commit**
```bash
git add backend/public/validation-sandbox.html backend/routes/studioAiGenRoute.js
git commit -m "feat: add validation sandbox HTML runner and status endpoints"
```

---

### Task 5: Integrate Validation Sandbox in Frontend (Layer 3)

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx`

**Step 1: Mount the sandbox hidden iframe**
In [StudioAIGen.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StudioAIGen.jsx), add a hidden iframe inside the main view:
```jsx
// Render within component tree
<iframe
  id="validation-sandbox-iframe"
  src="http://localhost:5000/validation-sandbox.html"
  style={{ display: "none" }}
/>
```

**Step 2: Add event listener to capture sandbox result messages**
Set up an effect hook to handle validation verification events:
```jsx
useEffect(() => {
  const handleSandboxMessage = async (event) => {
    if (!event.data || !event.data.type) return;
    
    if (event.data.type === 'VALIDATION_SUCCESS' || event.data.type === 'VALIDATION_ERROR') {
      const isSuccess = event.data.type === 'VALIDATION_SUCCESS';
      const validationId = window.__activeValidationId;
      
      if (!validationId) return;

      // Post validation telemetry results directly to backend orchestrator
      await axios.post("http://localhost:5000/api/studio-ai-gen/validate-result", {
        validationId,
        success: isSuccess,
        error: isSuccess ? null : event.data.error,
        stack: isSuccess ? null : event.data.stack,
        visualErrors: event.data.errors || []
      });
    }
  };

  window.addEventListener('message', handleSandboxMessage);
  return () => window.removeEventListener('message', handleSandboxMessage);
}, []);
```

**Step 3: Expose window listener helper for triggering browser validation**
Expose a function to send the code payload to the iframe:
```jsx
window.triggerBrowserValidation = (validationId, code, sceneData) => {
  const iframe = document.getElementById('validation-sandbox-iframe');
  if (!iframe) return;
  window.__activeValidationId = validationId;
  iframe.contentWindow.postMessage({
    type: 'VALIDATE_CODE',
    code,
    sceneData
  }, '*');
};
```

**Step 4: Commit**
```bash
git add frontend/src/components/StudioAIGen.jsx
git commit -m "feat: embed hidden verification sandbox iframe in StudioAIGen frontend"
```

---

### Task 5: Implement AI Repair Loop and Orchestration in Backend (Layer 4)

**Files:**
- Modify: `backend/services/aiGen.js`
- Modify: `backend/routes/studioAiGenRoute.js`

**Step 1: Write repair logic and validation flow in generateSingleSceneCode**
In [aiGen.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/aiGen.js), modify the generation workflow to orchestrate validations:
- **Layer 1 AST check**: If validation fails, directly repeat prompt.
- **Layer 2 VM module check**: If validation fails, directly repeat prompt.
- **Layer 3 & 5 Browser Sandbox waiting loop**:
  We save a validation ticket, notify the parent thread to run validation, and poll `/api/studio-ai-gen/validate-status/:id` inside the backend call for up to 2 seconds.
- Create a recursive repair builder `generateSingleSceneCodeWithRepair`:
```js
async function generateSingleSceneCodeWithRepair(args, attemptsRemaining = 3, errorFeedback = null) {
  const { scene, index, projectId, genAI, modelName } = args;

  let promptModifier = "";
  if (errorFeedback) {
    promptModifier = `
\n⚠️ PREVIOUS CODE GENERATION FAILED VALIDATION:
Error details: ${errorFeedback.error}
Stack trace: ${errorFeedback.stack || "N/A"}
Visual flaws: ${JSON.stringify(errorFeedback.visualErrors || [])}

Please fix the error listed above. Do NOT redesign the layout from scratch. Keep structure and classes identical, only patch the syntax/runtime bug.
`;
  }

  // Call gemini, validate AST (Layer 1) & Compile (Layer 2)
  let rawTSX = await generateTSXCodeForScene(genAI, modelName, scene, args.theme, args.bgImage, args.refImages, promptModifier);
  const astResult = validateTSXCode(rawTSX);
  if (!astResult.isValid) {
    if (attemptsRemaining > 1) {
      console.warn(`[AI Repair] Layer 1 (AST) Failed. Retrying... Error: ${astResult.error}`);
      return generateSingleSceneCodeWithRepair(args, attemptsRemaining - 1, { error: astResult.error });
    }
    return safetyFallback(scene, index); // Safety net fallback
  }

  const compiledJS = compileTSX(rawTSX);
  const compileResult = validateCompiledJS(compiledJS);
  if (!compileResult.isValid) {
    if (attemptsRemaining > 1) {
      console.warn(`[AI Repair] Layer 2 (Compile) Failed. Retrying... Error: ${compileResult.error}`);
      return generateSingleSceneCodeWithRepair(args, attemptsRemaining - 1, { error: compileResult.error });
    }
    return safetyFallback(scene, index);
  }

  // Trigger browser validation ticket (Layer 3)
  const validationId = `val_${projectId || 'aigen'}_${index}_${Date.now()}`;
  
  // Set up pending ticket state
  pendingValidations.set(validationId, { success: false, pending: true });

  // Expose JS code so that client knows to fetch and validate
  scene.validationId = validationId;
  scene.compiledJS = compiledJS;
  scene.tsxCode = rawTSX;

  // Let route orchestrator poll client-side browser feedback
  return {
    sceneIndex: index,
    validationId,
    visualPattern: scene.visualPattern,
    heading: scene.heading,
    voiceover: scene.voiceover,
    tsxCode: rawTSX,
    compiledJS,
    status: "PENDING_BROWSER_VALIDATION"
  };
}
```

**Step 2: Add validation result check in scene generation route**
Modify `POST /api/studio-ai-gen/generate-scene` inside [studioAiGenRoute.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/routes/studioAiGenRoute.js) to support the polling and repair loop orchestrations:
```js
// If PENDING_BROWSER_VALIDATION is returned, let frontend run triggerBrowserValidation and then re-submit validation result.
```

**Step 3: Commit**
```bash
git add backend/services/aiGen.js backend/routes/studioAiGenRoute.js
git commit -m "feat: orchestrate 5-layer validation sandbox & repair pipeline on backend"
```

---

## Remember

- Validate each layer sequentially: L1 AST $\rightarrow$ L2 Compile $\rightarrow$ L3/L5 Browser Sandbox $\rightarrow$ L4 Self-Repair.
- Maintain fallback templates in [aiGen.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/aiGen.js#L753) as absolute bulletproof safety net protection.
