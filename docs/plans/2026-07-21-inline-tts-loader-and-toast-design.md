# Design Document: Inline TTS Loader & Corner Toast Notification

## Problem Statement
The TTS regeneration action previously invoked a global blocking loading screen and triggered intrusive browser `alert()` popups upon completion. The user requested an inline spinner right on the button/card during TTS regeneration and a sleek corner toast notification on completion.

## Design Specification
1. **Per-Scene Regenerating State (`regeneratingSceneId`)**:
   - `regeneratingSceneId` in `App.jsx` tracks the active scene undergoing TTS regeneration.
   - Passed down to `StoryboardEditor.jsx`.
2. **Inline Spinner Button Component (`StoryboardEditor.jsx`)**:
   - When `regeneratingSceneId === scene.id`, button renders a spinning mini CSS loader: `⏳ Đang tạo giọng đọc...` and disables click.
3. **Corner Toast Notification (`App.jsx`)**:
   - State `toast: { message: string, type: 'success' | 'error' } | null`.
   - Auto-dismisses after 3.5 seconds.
   - Replaces all browser `alert()` calls across TTS regeneration & scene update flows.

## Verification Plan
1. Click "🔊 Tái tạo giọng đọc" on a scene.
2. Verify inline spinner appears on the button while loading.
3. Verify corner toast pops up at bottom-right upon completion without browser `alert()`.
