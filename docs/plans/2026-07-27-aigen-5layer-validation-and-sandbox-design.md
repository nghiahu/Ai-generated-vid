# Design: AI Gen 5-Layer Validation and Sandbox Architecture

## Overview
Currently, the AI video generation pipeline compiles TSX to JS using Sucrase and immediately saves it. However, syntax compilation success does not guarantee runtime validity, aesthetic correctness, or main-thread safety. 

This design establishes a **5-Layer Validation Pipeline** orchestrated by the Backend, utilizing the Frontend purely as a sandboxed runtime validation client. This isolates execution crashes, runs automated visual bounding-box collision checks, and drives a structured, multi-attempt AI self-repair loop before falling back to safety nets.

```
                  User Script
                       │
                       ▼
             Scene Planning (Gemini)
                       │
                       ▼
                  Storyboard
                       │
                       ▼
                 Generate Scene
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
    TTS Audio                  TSX Generator
        │                             │
        ▼                             ▼
    Alignment                [L1] AST Validation
        │                             │
        │                    [L2] Compile (Sucrase)
        │                             │
        │                    Save Temporary JS
        │                             │
        │           [L3] Browser Sandbox (Hidden Iframe)
        │                             │
        │                  [L5] Visual Validation
        │                             │
        │                    Validation Report
        │                             │
        │                    [L4] AI Repair Loop (Retry ≤3)
        │                             │
        │                        Safety Net
        └──────────────┬──────────────┘
                       ▼
                  Save Scene
                       │
                       ▼
                 Dynamic Import
                       │
                       ▼
                Remotion Preview
```

---

## Design Details

### 1. Layer 1: Static AST Validation (Backend)
Before compiling the code, the backend parses the raw TSX returned by Gemini into an Abstract Syntax Tree (AST) using `@babel/parser` (configured with `typescript` and `jsx` plugins).

The AST Validator traverses the tree and rejects the code if it violates any of the following rules:
- **Missing Required Exports**: The AST must contain a default export or a named export matching `GeneratedScene`.
- **Imports Whitelist**: Only imports from `react`, `remotion`, and `lucide-react` are permitted. Imports from server-side packages (e.g., `fs`, `path`, `child_process`) or uninstalled packages will be blocked immediately.
- **Security Blacklist**: Restrict syntax structures representing `eval()`, `Function()`, `fetch()`, `axios`, `XMLHttpRequest`, `window.location`, and `document.write`.
- **Semantic / Remotion Rules**:
  - Analyze `<Sequence>` JSX elements. If the `from` property is negative (e.g. `<Sequence from={-10}>`), reject (Remotion throws runtime errors on negative start frames).
  - Verify that hook dependencies and calling conditions are standard.

---

### 2. Layer 2: Compile Validation (Backend)
- **Sucrase Compilation**: The backend compiles the validated TSX to plain ES6 JavaScript using Sucrase.
- **Import Validation**: The backend instantiates the compiled JS string in a virtual environment (using a lightweight Node `vm` context) to verify that all modules are extractable and that it resolves to a valid React component:
  ```ts
  const comp = module.exports.default || module.exports.GeneratedScene;
  if (!comp || typeof comp !== 'function') throw new Error("Component is not a valid function");
  ```

---

### 3. Layer 3: Browser Validation Sandbox (Frontend)
To safely verify code without locking up the user's browser, the frontend exposes a hidden, restricted `<iframe>`.

- **Iframe Sandboxing**: The iframe will use `sandbox="allow-scripts"`.
- **Loading Phase**: The backend saves the compiled JS code into a temporary public path (e.g. `/public/temp-scenes/:projectId_scene_:sceneIndex.js`). The iframe loads a validation test runner page, which dynamically imports this temporary JS file:
  ```js
  const module = await import(`/temp-scenes/${projectId}_scene_${sceneIndex}.js`);
  ```
- **Error Capturing**:
  - The iframe wraps the render cycle inside a standard **React Error Boundary** to catch React-specific render crashes.
  - It binds `window.onerror` and `window.onunhandledrejection` to catch general execution faults.
- **CPU Lockup / Infinite Loop Protection**:
  - The parent window starts a **1500ms timeout watchdog**.
  - The iframe posts a heartbeat message to the parent on every `requestAnimationFrame`. If the heartbeat stops or the timeout expires before the component successfully renders frame 0, it is flagged as a **Timeout (Infinite Loop)**.
- **Validation Report**:
  Once validated, the frontend posts the results back to the backend endpoint `POST /api/studio-ai-gen/validate-result`:
  ```json
  {
    "projectId": "proj_123",
    "sceneIndex": 0,
    "success": false,
    "timeout": false,
    "error": "TypeError: Cannot read properties of undefined (reading 'map')",
    "stack": "...",
    "metrics": {
      "renderTimeMs": 150,
      "fps": 60
    }
  }
  ```

---

### 4. Layer 4: AI Repair Loop & Orchestration (Backend)
The backend acts as the central coordinator of the repair loop:
1. If the validation report contains errors, the backend increments `repairAttempts` (limit = 3).
2. It generates a **Structured Repair Prompt** to Gemini containing:
   - **Original Prompt & Script**: The visual concept goal.
   - **Current Code**: The buggy code.
   - **Error Log**: AST syntax errors, compile errors, or Browser Sandbox runtime stack traces.
   - **Strict Directives**: *"Fix the specific error provided. Do NOT change the overall design structure, layout patterns, or theme tokens unless absolutely necessary. Only patch the failing code."*
3. Gemini outputs a modified TSX. The backend feeds it back into **Layer 1**.
4. If it fails 3 times, the backend abandons the loop and loads the local **Pattern Safety Net Fallback** (e.g. `safetyNetTitleHook` or `safetyNetCodeTerminal`) corresponding to the scene's Visual Pattern.

---

### 5. Layer 5: Visual Layout Validation
Inside the Browser Sandbox, after the component successfully renders React elements to the DOM, the test runner performs automated layout analysis:
- **Safe Area Overflow**:
  Retrieves bounding boxes (`el.getBoundingClientRect()`) for all text blocks, grids, and cards. If any element extends into the bottom 22% safe zone ($y > 1536px$ on a $1080 \times 1920px$ canvas), it raises a `Visual Validation Fail`.
- **Bounding Box Overlap Detection**:
  Compares the coordinates of primary layout nodes (e.g. Heading vs Cards). If their overlap intersection area exceeds 20%:
  $$\text{Intersection Area} / \text{Element Area} > 0.20$$
  it flags an **Overlap Collision**.
- **Text Truncation Check**:
  Checks if `el.scrollHeight > el.clientHeight` or `el.scrollWidth > el.clientWidth` for titles, reporting clipped text.

---

### 6. Database Metadata Schema
Every scene configuration in the database will save a detailed **Validation Report**:
```json
{
  "projectId": "proj_aigen_93kas",
  "sceneIndex": 0,
  "visualPattern": "DUAL_METRIC_CARDS",
  "heading": "...",
  "voiceover": "...",
  "tsxCode": "...",
  "compiledJS": "...",
  "validationReport": {
    "ast": "pass",
    "compile": "pass",
    "runtime": "pass",
    "visual": "warning",
    "repairAttempts": 1,
    "fallback": false,
    "validationTimeMs": 842,
    "errors": [
      {
        "layer": "visual",
        "message": "Heading text overlaps Card elements by 23%"
      }
    ]
  }
}
```

---

## Verification Plan

### Automated Tests
1. **AST Validation Test**: Run unit tests in `backend/tests/ast.test.js` passing syntactically invalid TSX (e.g. unmatched tags, forbidden imports like `fs`) and verify the parser rejects it.
2. **Iframe Sandbox Timeout Test**: Inject a loop component `while(true) {}` and verify the frontend watchdog terminates the execution after 1500ms and reports a Timeout.
3. **AI Self-Repair Mock Run**: Mock a compilation error (e.g., referencing an undefined variable `scene.points.map`) and trace the repair prompt generation. Confirm that Gemini corrects the reference in the second attempt.

### Manual Verification
1. Open **Studio AI Gen** dashboard.
2. Enter a script that triggers complex layouts (e.g. `DUAL_METRIC_CARDS`).
3. Verify that the dynamic sandbox validates it, and the scene renders cleanly on the player without UI stutter or visual overlaps.
