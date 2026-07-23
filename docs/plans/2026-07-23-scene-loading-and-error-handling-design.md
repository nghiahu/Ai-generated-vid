# Design Document: Scene Loading State & Error Handling in Studio AI Gen

**Date:** 2026-07-23
**Status:** Approved

## Problem Description
When Studio AI Gen finishes Phase 1 (Scene Plan), scenes initially exist with empty `compiledJS` code while Phase 2 sequentially generates TSX code for each scene. If the user views a scene whose code is still pending generation, or if scene code generation fails/interrupted, `loadComponentFromJS` returned `error: "Empty code content"`. This caused `SceneWrapper` to immediately render a prominent red compiler error card ("LỖI LOAD DYNAMIC COMPONENT: empty code content") instead of indicating that generation is still in progress or offering a option to regenerate the scene.

## Proposed Solution

### 1. Distinguish Pending vs. Actual Compile Error
- Update `loadComponentFromJS` to differentiate between:
  - `isEmpty`: when `compiledJS` is missing/empty.
  - `compileError`: when `compiledJS` exists but failed runtime dynamic module evaluation.
- Pass `isGenerating` (whether overall generation loop or individual scene regeneration is currently running) to `SceneWrapper`.

### 2. UI Enhancements in `SceneWrapper`
- **Pending/Generating State (`!Component && (isGenerating || isEmpty)`):**
  - Render a clean, dark glassmorphism loading skeleton card with animated pulsing status: `"🤖 AI đang biên dịch phân cảnh... (Đang khởi tạo React TSX code & giọng đọc TTS)"`.
- **Actual Error / Incomplete State (`!isGenerating && (loadError || isEmpty)`):**
  - Render a refined error card displaying:
    - Clear title: `"⚠️ KHÔNG THỂ HIỂN THỊ PHÂN CẢNH"`
    - Descriptive error message or compilation log
    - Primary Action Button: `"🔄 Thử sinh lại phân cảnh này"` (Single Scene Regenerate)

### 3. Single Scene Regeneration Logic
- Add `handleRegenerateSingleScene(sceneIndex)` in `StudioAIGen.jsx`.
- Trigger `api.generateStudioAiGenScene(projectId, scene, voice, theme, bgImage, refImages)`.
- Update state for `rawScenes` and `loadedScenes` locally and save updated project config to local storage / DB.

## Affected Files
- `frontend/src/components/StudioAIGen.jsx`
- `docs/plans/2026-07-23-scene-loading-and-error-handling-design.md`
