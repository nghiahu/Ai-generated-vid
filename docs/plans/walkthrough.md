# Walkthrough — Remove Manual Studio & Simplify Project Editor

We have completed the cleanups and minimized the Storyboard Editor scene cards to only show:
1. Preview 9:16 (player on the left side).
2. Scene title header banner (top).
3. Voiceover Script input/textarea (right side).
4. `⚡ Sinh lại video bằng AI` and `🔊 Tạo lại giọng đọc (TTS)` action buttons.

## Changes Made

### 1. App Navigation & Workspace layout
- Removed manual `Studio` sidebar option and manual studio configuration views from [App.jsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/frontend/src/App.jsx).
- When a project is loaded, it routes directly to the simplified `WORKSPACE_EDITOR` view instead of `STUDIO_AI_GEN` or `WORKSPACE_SETUP`.
- Added `handleRegenerateSceneCode` to invoke AI design regeneration for a single scene and reload project status on success.
- Added redirect in `StudioAIGen` upon successful video generation so the user is directly loaded into the Storyboard Editor view.

### 2. Dashboard Simplification
- Removed project categories selectors in [Dashboard.jsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/frontend/src/components/Dashboard.jsx) and filtered the list to display only AI Gen projects.
- Simplified empty state.

### 3. Studio AI Gen Cleanup
- Removed preview mode layout and script/preview selection tabs from [StudioAIGen.jsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/frontend/src/components/StudioAIGen.jsx). It now acts purely as a script generator input screen, then transfers control to the main editor.

### 4. Scene Card Simplification
- In [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/frontend/src/components/StoryboardEditor.jsx), removed background media suggestion/upload widgets, and all layout dropdowns, heading text inputs, highlights, theme configs, and point items checklist.
- Kept only the layout preview video player, the header index badge, and the script textarea.
- Embedded action buttons below the script area to either regenerate the scene code/graphics through Gemini AI or regenerate TTS audio.

## Verification Results

### Build Verification
Vite build ran and compiled successfully without any errors:
```bash
vite v8.1.0 building client environment for production...
transforming...✓ 3722 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.46 kB │ gzip:   0.30 kB
dist/assets/index-fIAXRcOY.css      5.17 kB │ gzip:   1.42 kB
dist/assets/index-iN8ITTN0.js   2,256.72 kB │ gzip: 570.00 kB

✓ built in 977ms
```
All code compiles and passes successfully.
