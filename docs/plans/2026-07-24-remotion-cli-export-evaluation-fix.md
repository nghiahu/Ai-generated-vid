# Remotion CLI Export Component Evaluation & Audio Binding Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Fix blank video exports and missing audio during Remotion CLI rendering in `MainComposition.tsx`.

**Architecture:** Add `evalAIComponent` evaluator and dual-field audio binding (`scene.voiceoverAudioUrl || scene.audioUrl`) in `my-video/src/compositions/MainComposition.tsx`.

**Tech Stack:** React, Remotion, TypeScript.

---

### Task 1: Update `MainComposition.tsx` with Dynamic Evaluator & Dual-Field Audio

**Files:**
- Modify: `my-video/src/compositions/MainComposition.tsx`

**Steps:**
1. In `MainComposition.tsx`, add `evalAIComponent(compiledJS: string)` helper function with Lucide Proxy icon resolver.
2. Update scene component resolution:
   `const sceneComp = (scene as any).Component || ((scene as any).compiledJS ? evalAIComponent((scene as any).compiledJS) : null);`
3. Update audio rendering:
   `const audioUrl = scene.voiceoverAudioUrl || (scene as any).audioUrl;`

---

### Task 2: Verification

**Files:**
- Run production build `npm run build` in `frontend` to verify 0 errors.
