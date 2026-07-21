# Remove Ending Card Feature Design

**Goal:** Remove the global Ending Card feature completely from the system, including the Frontend configurations UI, Remotion video duration calculations, rendering layers, and Backend database default configurations and TTS generation routes.

## Background Context
The system currently includes a "global Ending Card" feature that appends an extra CTA card after all scenes of a video. This card has a custom call to action, website/link, background image, background music (BGM), and custom voiceover (TTS). The user has decided that this Ending Card is unnecessary and requested to remove it completely.

Note: This removal is for the *global* Ending Card screen feature configured via the sidebar. Scene-level layouts in the "ending" family (e.g. HUST X RIKKEI, Brand Outro, Contact Card Ending) remain untouched as they are standard scene templates.

## Proposed Design

### 1. Backend Cleanups
- **`backend/services/db.js`**: Remove `ending` configuration from `defaultConfig` when creating a new project.
- **`backend/server.js`**:
  - Remove logic to detect changes in ending voiceover text and call TTS generator during configuration updates.
  - Remove logic to regenerate TTS for ending card voiceover inside `/api/projects/:id/regenerate-tts`.

### 2. Frontend Config UI Cleanups
- **`frontend/src/App.jsx`**: Remove `ending` fields from `draftConfig`.
- **`frontend/src/components/SidebarConfig.jsx`**:
  - Remove `handleEndingChange` helper.
  - Remove the Ending Card configuration form section completely.
- **`frontend/src/components/MasterPlayer.jsx`**:
  - Remove calculations related to `endingEnabled` and `endingDuration`.
  - Simplify `totalFrames` to only consider the sum of scene durations.

### 3. Remotion Video Composition Cleanups
- **`my-video/src/Root.tsx`**:
  - Remove `endingEnabled` and `endingDuration` calculations in the `calculateMetadata` function.
  - Remove `ending` from `defaultProps` config object.
- **`my-video/src/compositions/MainComposition.tsx`**:
  - Remove `EndingLayout` React component.
  - Remove `EndingConfig` type definition and its usage in `ProjectConfig` interface.
  - Remove calculations for `endingDurationSeconds`, `endingDurationFrames`, and adjust `totalDurationFrames` and `mainBgmDurationFrames` calculation.
  - Remove rendering of `EndingLayout` Sequence, its BGM audio, and its TTS voiceover audio.

## Success Criteria / Verification
1. Project creation succeeds and does not insert any `ending` configuration into the `config` JSONB column.
2. Web UI Sidebar Config no longer displays the "Ending Card" section.
3. Master Player correctly calculates video duration based solely on the active scenes without any ending card padding.
4. Video preview and output render correctly without any extra ending card scenes at the end of the video.
5. All backend update and TTS regeneration API requests succeed without trying to generate/call TTS for ending cards.
