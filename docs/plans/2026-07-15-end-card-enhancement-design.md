# Design Document: End Card Enhancement

Enhance the end card (outro) feature of the AI video generator so it's not just a black screen. It will support a custom background image, a separate background music track, and a dynamic TTS voiceover read using the selected project voice.

## 1. Requirements & User Intent
- **No black screen**: Support background image instead of plain black.
- **Custom BGM**: Allow selecting a separate background music track specifically for the end card sequence, or keep it silent/use main BGM.
- **Voiceover**: Allow typing custom text to be read aloud by the chosen AI voice during the end card.
- **Dynamic Timing**: The end card's duration should scale to fit the generated TTS audio duration (minimum 4 seconds).

## 2. Technical Architecture & Design

### Database & Config Schema
The project configuration (`config` JSONB column in the `projects` table) has an `ending` object. We will extend it with:
- `imageUrl`: string (URL of uploaded background image)
- `backgroundMusic`: string ("None" or one of the available BGM tracks)
- `voiceover`: string (Text content to speak)
- `voiceoverAudioUrl`: string (URL of the generated TTS file)
- `voiceoverDuration`: number (Duration of the generated TTS in seconds)

### Backend TTS Processing
In `backend/server.js`, modify `PUT /api/projects/:id/config`:
1. Detect if `config.ending.voiceover` changed or if the project `voice` changed.
2. If voiceover text is present and has changed (or voice has changed), generate the TTS audio file using the project's voice by calling `tts.generateTTS(voiceover, projectId, 'ending', voiceKey)`.
3. Update `config.ending.voiceoverAudioUrl` and `config.ending.voiceoverDuration` with the resulting TTS values.
4. Save the updated configuration to the database.

### Frontend Config UI
In `frontend/src/components/SidebarConfig.jsx`:
- Show an image uploader/preview for the background image. If an image is uploaded, it posts to `/api/upload` (Cloudinary) and saves the returned URL to `config.ending.imageUrl`.
- Show a dropdown for selecting the ending BGM (`config.ending.backgroundMusic`).
- Show a textarea for typing the ending voiceover text (`config.ending.voiceover`).

### Remotion Composition Integration
In `my-video/src/compositions/MainComposition.tsx` and `my-video/src/Root.tsx`:
1. Calculate the ending card duration dynamically: `const endingDurationSeconds = config?.ending?.voiceoverDuration ? Math.max(4.0, config.ending.voiceoverDuration) : 4.0;`.
2. Update the total duration calculation of the video to use the dynamic ending duration.
3. In `EndingLayout`, render the custom background image with a dark tint overlay (for text legibility) if `config.ending.imageUrl` is provided.
4. In `MainComposition`, restrict the main background music to `durationInFrames={currentFrameOffset}` (stop when ending starts) if a custom ending BGM is selected.
5. Play the custom ending BGM during the ending sequence.
6. Play the generated ending TTS audio file during the ending sequence if `config.ending.voiceoverAudioUrl` is present.

## 3. Verification Plan

### Automated Verification
- Run local development servers (`npm run dev`) for backend and frontend.
- Verify video builds/renders via Remotion CLI and backend.

### Manual Verification
1. Open Studio in the browser.
2. Go to the "Ending Card" section, enable it.
3. Type text into the "Voiceover Text" field, wait for auto-save, and verify in the network tab that TTS is generated.
4. Upload an image, check that it renders as a background in the video player.
5. Select a separate BGM, test playback, verify the transition from main BGM to ending BGM.
6. Render the video and check the final MP4 output.
