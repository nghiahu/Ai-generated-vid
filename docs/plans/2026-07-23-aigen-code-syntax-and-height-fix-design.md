# Design: AI Gen Scene Code Syntax, Height, and Data Binding Fixes

## Overview
AI-generated scenes currently suffer from 3 runtime/compilation failures:
1. **Import Aliasing Syntax Error**: Gemini generates `import { Terminal as TerminalIcon } from "lucide-react";`. When converted into JS destructuring by `loadComponentFromJS`, it produced invalid JS syntax `const { Terminal as TerminalIcon } = window.LucideIcons;` (`Unexpected identifier 'as'`), causing code compilation badges ("⚠️ Lỗi code") on 4 out of 5 scenes.
2. **Undefined Prop / Data Crash**: Components reference `scene.points`, `scene.heading`, and `subtitlesJson`, but `<Component fps={fps} />` in `StudioAIGen.jsx` failed to pass `scene` and `subtitlesJson` props, causing `TypeError: Cannot read properties of undefined (reading 'points')` and blank scenes.
3. **Missing Root Height Constraint**: Root `<div>` elements generated without `height: "100%"` collapsed to minimal content height at the top of the canvas.

This design fixes all three issues across both Backend prompt generation rules and Frontend dynamic rendering/defense layers.

## Design Details

### 1. Frontend Runtime Fixes (`frontend/src/components/StudioAIGen.jsx`)
- **Fix `loadComponentFromJS` import rewriting**:
  Convert TypeScript import alias syntax (`A as B`) into valid JavaScript object destructuring alias syntax (`A: B`):
  ```js
  // Transform `{ Terminal as TerminalIcon, Cpu }` -> `{ Terminal: TerminalIcon, Cpu }`
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
  Perform the same ` as ` -> `: ` transformation for `remotion` and `react` imports.

- **Pass `scene` & `subtitlesJson` props in `SceneWrapper`**:
  Update `<Component fps={fps} />` to:
  ```jsx
  <Component
    fps={fps}
    scene={currentScene || {}}
    subtitlesJson={currentScene?.voiceoverTtsJson || []}
  />
  ```

- **Enforce Root Height Wrapper**:
  In `SceneWrapper`, wrap the rendered `<Component />` in a container with mandatory full-viewport constraints:
  ```jsx
  <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
    <Component fps={fps} scene={currentScene || {}} subtitlesJson={currentScene?.voiceoverTtsJson || []} />
  </div>
  ```

### 2. Backend Prompt Rules (`backend/services/aiGen.js`)
- Update `HARD RULES` in `generateTSXCodeForScene`:
  1. **Mandatory Root Height**:
     "The outermost root JSX element MUST use `<div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', ... }}>`. NEVER omit `width: '100%', height: '100%'`!"
  2. **Safe Component Signature & Default Props**:
     `export const GeneratedScene: React.FC<{ fps?: number; scene?: any; subtitlesJson?: any }> = ({ fps = 30, scene = {}, subtitlesJson = [] }) => { ... }`
  3. **No TS Import Alias Syntax**:
     "Do NOT use `import { Foo as Bar }` alias syntax. Import icons directly using their exact exported names (e.g. `import { Terminal, Cpu } from 'lucide-react'`)."

## Verification Plan
1. Re-generate scenes using Studio AI Gen.
2. Verify that 5 out of 5 scenes compile without "⚠️ Lỗi code" errors.
3. Verify that all scenes fill the full 9:16 vertical viewport height (100% height) with glassmorphism backgrounds and centered text.
4. Verify that subtitle karaoke lines and card points render cleanly without runtime exceptions.
