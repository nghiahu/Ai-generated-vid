# Voice Audio Loss Prevention Design

## Overview
This design document specifies fixes for the issue where voiceover audio is lost when entering the storyboard editor, requiring a page reload. The issue is caused by browser media/audio tag exhaustion and AudioContext suspension due to rendering multiple `Player` components in parallel, each allocating 100 shared audio tags.

## Goals
- Mute inactive preview players (`muted={!isPlaying}`) in `StoryboardEditor.jsx` to prevent the browser from suspending the AudioContext and blocking audio.
- Reduce `numberOfSharedAudioTags` from `100` to a sensible default of `5` across all player components (`StoryboardEditor.jsx`, `MasterPlayer.jsx`, `Dashboard.jsx`) to prevent resource exhaustion.

## Detailed Changes

### 1. Update `StoryboardEditor.jsx`
In `InlineScenePlayer`, update the `Player` component:
- Add `muted={!isPlaying}` so that only the playing scene produces audio.
- Change `numberOfSharedAudioTags={100}` to `numberOfSharedAudioTags={5}` to prevent allocating too many HTML5 audio tags on load.

```typescript
      <Player
        ref={localPlayerRef}
        component={MainComposition}
        inputProps={{ scenes: [scene], config }}
        durationInFrames={sceneDurationFrames}
        fps={30}
        compositionWidth={1080}
        compositionHeight={1920}
        initialFrame={peakFrame}
        style={{
          width: "100%",
          height: "100%",
        }}
        controls={false}
        autoPlay={false}
        acknowledgeRemotionLicense
        numberOfSharedAudioTags={5}  // Reduced to prevent tag exhaustion
        muted={!isPlaying}           // Muted unless active playing
```

### 2. Update `MasterPlayer.jsx`
Change `numberOfSharedAudioTags={100}` to `numberOfSharedAudioTags={5}`.

### 3. Update `Dashboard.jsx`
Change `numberOfSharedAudioTags={100}` to `numberOfSharedAudioTags={5}`.

## Verification Plan
We will verify that:
- Storyboard editor loads successfully and preview players do not exhaust browser media resources.
- Active player plays audio cleanly when the user clicks play, without requiring a page reload.
- Build and lint checks pass cleanly.
