# AI Gen Code Syntax, Height, and Data Binding Fixes Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Eliminate compilation errors ("⚠️ Lỗi code"), runtime prop crashes, and collapsed height issues across all AI-generated video scenes.

**Architecture:** Update `loadComponentFromJS` in `StudioAIGen.jsx` to transform TS import aliases (` as `) into JS destructuring aliases (`: `), pass `scene` & `subtitlesJson` props to generated components, wrap scenes in 100% height containers, and update prompt rules in `aiGen.js` to enforce root `height: "100%"`, safe component signatures, and direct icon imports.

**Tech Stack:** React (JSX), JavaScript ES6+, Remotion, Sucrase compiler

---

### Task 1: Fix `loadComponentFromJS` import rewriting and prop passing in `StudioAIGen.jsx`

**Files:**
- Modify: [StudioAIGen.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StudioAIGen.jsx#L20-L220)

**Step 1: Update `loadComponentFromJS` in `StudioAIGen.jsx` to handle import aliases**
Update lucide-react, remotion, and react import replacement logic:
```javascript
    // Match any import from "lucide-react" (including named imports with aliases)
    rewrittenJS = rewrittenJS.replace(/import\s+([\s\S]*?)\s+from\s+['"]lucide-react['"];?/g, (match, imports) => {
      if (imports.includes("{")) {
        const named = imports.match(/\{([\s\S]*?)\}/);
        if (named && named[1]) {
          const cleanImports = named[1].replace(/[\r\n]+/g, " ").replace(/\s+as\s+/g, ": ").trim();
          return `const { ${cleanImports} } = window.LucideIcons;`;
        }
      }
      return `const LucideIcons = window.LucideIcons;`;
    });
```

**Step 2: Update `SceneWrapper` in `StudioAIGen.jsx` to pass `scene` and `subtitlesJson` props and enforce full height**
In `SceneWrapper`:
```jsx
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#030712" }}>
      {Component ? (
        <Component
          fps={fps}
          scene={currentScene || {}}
          subtitlesJson={currentScene?.voiceoverTtsJson || []}
        />
      ) : (
        <div style={{ color: "#fff", display: "grid", placeItems: "center", height: "100%", fontFamily: "sans-serif" }}>
          Đang tải giao diện...
        </div>
      )}
      {audioUrl && (
        <Remotion.Audio src={`http://localhost:5000${audioUrl}`} />
      )}
    </div>
  );
```

**Step 3: Commit Task 1**

```bash
git add frontend/src/components/StudioAIGen.jsx
git commit -m "fix: transform TS import aliases to JS destructuring and pass scene props in StudioAIGen"
```

---

### Task 2: Update Backend AI Code Generation Prompt Rules in `aiGen.js`

**Files:**
- Modify: [aiGen.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/aiGen.js#L535-L560)

**Step 1: Enforce mandatory root height and safe component signature in `generateTSXCodeForScene`**
In `backend/services/aiGen.js`, update HARD RULES in `systemInstruction`:
```javascript
# HARD RULES
1. MANDATORY ROOT CONTAINER HEIGHT & FULLSCREEN FIT:
   The outermost root JSX element MUST use <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", ... }}> (or <AbsoluteFill>).
   NEVER omit width: "100%", height: "100%" on the root container!

2. Component Signature MUST be EXACTLY:
   export const GeneratedScene: React.FC<{ fps?: number; scene?: any; subtitlesJson?: any }> = ({ fps = 30, scene = {}, subtitlesJson = [] }) => {
     const frame = useCurrentFrame();
     // ...
     return ( ... );
   };
   export default GeneratedScene;

3. ALLOWED IMPORTS:
   Import icons directly using their exact names without 'as' alias syntax (e.g., import { Terminal, Cpu, Zap } from "lucide-react";).
   Do NOT use import { Terminal as TerminalIcon } alias syntax.
```

**Step 2: Commit Task 2**

```bash
git add backend/services/aiGen.js
git commit -m "fix: update aiGen prompt rules for mandatory 100% height, safe component signature, and no import alias syntax"
```

---

### Task 3: Verification

**Step 1: Test dynamic code compilation and loading**
Run scratch test script to verify that scenes with `Terminal as TerminalIcon` compile without error.

**Step 2: Commit task tracker**

```bash
git add docs/plans/2026-07-23-aigen-code-syntax-and-height-fix.md
git commit -m "docs: add implementation plan for AI Gen code syntax and height fixes"
```
