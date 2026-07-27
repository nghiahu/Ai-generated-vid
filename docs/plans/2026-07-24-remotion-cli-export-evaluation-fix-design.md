# Design: Remotion CLI Render Component Evaluation & Audio Binding Fix

**Date:** 2026-07-24  
**Status:** Approved  
**Topic:** Ensure complete visual rendering of AI TSX scenes and TTS audio playout during Remotion CLI video export (`npx remotion render`).

---

## 1. Problem Statement

When users exported MP4 videos from Studio AI Gen ("🎬 Xuất Video MP4"), the rendered MP4 file was blank with missing visual components and no audio sound:
1. **Missing Visuals**: Props sent to Remotion CLI via JSON files (`temp_projectId.json`) cannot serialize live React Component instances. As a result, `(scene as any).Component` was `undefined` during headless CLI rendering, causing `MainComposition.tsx` to omit AI TSX scene rendering.
2. **Missing Audio**: AI Gen scenes store audio files under `scene.audioUrl`, while `MainComposition.tsx` only checked `scene.voiceoverAudioUrl`, skipping TTS audio during render.

---

## 2. Proposed Architecture & System Design

### Component A: Dynamic Component Evaluator in `MainComposition.tsx`
- Implement `evalAIComponent(compiledJS: string)` inside `my-video/src/compositions/MainComposition.tsx`.
- Parse and evaluate `scene.compiledJS` dynamically using `new Function("args", ...)` with injected `React`, `Remotion`, and `LucideIcons` globals.
- Fall back to `evalAIComponent((scene as any).compiledJS)` whenever `(scene as any).Component` is `undefined` (during JSON CLI rendering).

### Component B: Dual-Field Audio Binding in `MainComposition.tsx`
- Update `<Audio />` tag in `MainComposition.tsx`:
  `const audioUrl = scene.voiceoverAudioUrl || (scene as any).audioUrl;`
- Render `<Audio src={getFullUrl(audioUrl)} volume={1.8} />` whenever `audioUrl` is present.

---

## 3. Verification Plan
1. **CLI Render Test**:
   - Trigger render command and verify stdout logs confirm components evaluated cleanly.
2. **Exported Video Inspection**:
   - Inspect output MP4 file to confirm visuals and audio playout.
