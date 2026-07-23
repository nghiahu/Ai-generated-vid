# Design Document: Enable Lucide React Icons in Studio AI Gen

## Overview
Enables Gemini to import and render vector icons from `lucide-react` dynamically in generated scene TSX components.

## Architecture & Integration
1. **Frontend Global Runtime Registration (`frontend/src/components/StudioAIGen.jsx`)**:
   - `import * as LucideIcons from "lucide-react";`
   - Bind `window.LucideIcons = LucideIcons;` globally.
2. **Dynamic Import Rewriter (`StudioAIGen.jsx` -> `loadComponentFromJS`)**:
   - Parse `import { ... } from "lucide-react"` and transform to `const { ... } = window.LucideIcons;`.
3. **Gemini System Instruction Update (`backend/services/aiGen.js`)**:
   - Explicitly instruct Gemini that `lucide-react` is available and encouraged:
     `import { Zap, Cpu, Shield, Sparkles, TrendingUp, Award, Layers, Terminal, Database, Activity, CheckCircle, Flame } from "lucide-react";`
   - Guide Gemini to insert icons inside glass cards, pills, badges, and donut counters.

## Verification Plan
- Verify `npx tsc --noEmit` build status.
- Test generating scenes with `lucide-react` icons.
