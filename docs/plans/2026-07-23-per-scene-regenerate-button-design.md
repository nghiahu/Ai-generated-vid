# Design Document: Per-Scene Regenerate Button in Studio AI Gen

**Date**: 2026-07-23  
**Status**: Proposed / Approved  

---

## 1. Overview & Problem Statement

Users currently cannot easily trigger a re-generation of individual video scenes when reviewing generated content in `StudioAIGen.jsx`. While the backend API and single-scene handler (`handleRegenerateSingleScene`) exist, the UI only displayed the button on compile-error fallback screens.

---

## 2. Proposed Changes & Technical Architecture

### Component: `StudioAIGen.jsx`

#### 1. Scene Card List Action Button (Left Column)
- On each scene item card in the preview list, add a dedicated `🔄 Sinh lại` button inside the header row next to the pattern badge.
- Clicking the button stops propagation (`e.stopPropagation()`) and invokes `handleRegenerateSingleScene(idx)`.
- When `regeneratingIndex === idx`, disable the button and display a loading state (`⏳ Đang sinh lại...`).

#### 2. Preview Toolbar Action Button (Right Column)
- On the player preview header toolbar above the Remotion player (when `previewType === "SCENE"`), add a prominent button `🔄 Sinh lại phân cảnh này`.
- Disabled when a scene regeneration or global generation is in progress.

---

## 3. Verification Plan

### Manual Verification
1. Open Studio AI Gen in the browser.
2. In the scene list view, verify that every scene card displays a `🔄 Sinh lại` button.
3. Click the button on Scene 1.
4. Verify that status updates to `🔄 AI đang sinh lại code cho phân cảnh 1...` and the scene updates seamlessly upon completion.
