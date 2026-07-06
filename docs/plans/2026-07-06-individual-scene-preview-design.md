# Design: Individual Scene Preview in Storyboard Editor

## Background

The user requested the ability to preview each scene individually in the Storyboard Editor, similar to how it works in yupvid. Currently, each scene card in the storyboard lists a static HTML-based mockup of the scene layout. There is no way to play the actual video/audio sequence of that specific scene.

## Proposed Changes

We will implement an inline video player for each scene card in the Storyboard Editor.

### 1. Introduce `<InlineScenePlayer>` Component
We will create a component that renders the Remotion `<Player>` playing only a single scene.
- **Component**: `InlineScenePlayer`
- **Location**: `frontend/src/components/StoryboardEditor.jsx`
- **Configuration**:
  - `component`: `MainComposition`
  - `inputProps`: `{ scenes: [scene], config: { ...config, ending: { enabled: false } } }`
  - `durationInFrames`: Math.round(scene.duration * 30)
  - `fps`: 30
  - `autoPlay`: true
  - `controls`: false (as requested: no volume or other default player controls)
- **Lifecycle**: Using a `ref` on the Player, we will add an event listener for the `"ended"` event. When the scene finishes playing, it will trigger the `onEnded()` callback to reset the UI state.

### 2. Update `StoryboardEditor` State & Layout
- **State**: Add a local state `playingSceneId` inside `StoryboardEditor`.
- **Play Button Overlay**:
  - Render a circular Play button (`▶`) overlay at the bottom-left of each static scene preview mockup.
  - Clicking this button will set `playingSceneId` to the current scene's ID, which switches the card's 9:16 preview container from static mockup view to `<InlineScenePlayer>`.
- **Toggle View**:
  - If `playingSceneId === scene.id`, render `<InlineScenePlayer>`.
  - Otherwise, render the static preview and the Play button overlay.

### 3. Update `App.jsx`
Pass the `config` prop to `StoryboardEditor` components (in both setup and editor mode) so that it can be passed down to the `InlineScenePlayer`.

## Success Criteria

1. A play button is visible on each scene's static preview card.
2. Clicking the play button switches that specific preview container to an active video player playing that scene's video, voiceover, and audio.
3. The video plays once with no control bar and automatically reverts to the static mockup layout when it finishes.
4. Compilation and linting succeed.

## Files to Modify

- [App.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/App.jsx)
- [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx)
