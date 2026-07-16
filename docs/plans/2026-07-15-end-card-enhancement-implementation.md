# End Card Enhancement Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Enhance the video end card to support background image uploads, a separate background music track, and custom TTS voiceover reading.

**Architecture:** Extend `config.ending` in the PostgreSQL database with `imageUrl`, `backgroundMusic`, `voiceover`, `voiceoverAudioUrl`, and `voiceoverDuration`. Modify the backend to generate TTS when the ending voiceover or main voice changes. Modify the frontend config panel to expose these settings and handle image upload. Update Remotion compositions to dynamically calculate composition duration and render background images, ending BGM, and ending voiceover audio.

**Tech Stack:** React, Express, Remotion, Cloudinary (upload), PostgreSQL.

---

### Task 1: Backend TTS Audio Generation for Ending

**Files:**
- Modify: `backend/server.js:192-262`

**Step 1: Write the minimal implementation**
We will update `PUT /api/projects/:id/config` in `backend/server.js` to check if `ending.voiceover` has changed or if the voice configuration changed. If the voiceover is present and has changed, or if the voice changed, we generate the ending TTS audio synchronously using `tts.generateTTS` and update the database with `voiceoverAudioUrl` and `voiceoverDuration`.

Here is the code snippet to be inserted in `PUT /api/projects/:id/config` after database update:
```javascript
    // Check if voice config has changed or ending voiceover has changed
    const oldVoice = oldProject.config?.voice || 'rachel';
    const oldCustomId = oldProject.config?.customVoiceId || '';
    const newVoice = updatedProject.config?.voice || 'rachel';
    const newCustomId = updatedProject.config?.customVoiceId || '';

    const oldEndingVoiceover = oldProject.config?.ending?.voiceover || '';
    const newEndingVoiceover = updatedProject.config?.ending?.voiceover || '';

    const voiceChanged = oldVoice !== newVoice || oldCustomId !== newCustomId;
    const endingVoiceoverChanged = oldEndingVoiceover !== newEndingVoiceover;

    if (newEndingVoiceover && (endingVoiceoverChanged || voiceChanged)) {
      console.log(`Generating ending voiceover TTS for project ${projectId}...`);
      const voiceKey = newVoice === 'custom' && newCustomId ? newCustomId : newVoice;
      try {
        const ttsResult = await tts.generateTTS(newEndingVoiceover, projectId, 'ending', voiceKey);
        
        // Merge into ending config
        const endingConfig = {
          ...updatedProject.config.ending,
          voiceoverAudioUrl: ttsResult.url,
          voiceoverDuration: ttsResult.duration
        };
        const finalProject = await db.updateProjectConfig(projectId, { ending: endingConfig });
        updatedProject.config = finalProject.config;
      } catch (ttsErr) {
        console.error(`Failed to generate ending voiceover TTS:`, ttsErr.message);
      }
    } else if (!newEndingVoiceover && oldEndingVoiceover) {
      // Clear audio fields if voiceover was cleared
      const endingConfig = {
        ...updatedProject.config.ending,
        voiceoverAudioUrl: "",
        voiceoverDuration: 0
      };
      const finalProject = await db.updateProjectConfig(projectId, { ending: endingConfig });
      updatedProject.config = finalProject.config;
    }
```

**Step 2: Commit**
```bash
git add backend/server.js
git commit -m "backend: support ending card voiceover tts generation"
```

---

### Task 2: Frontend Sidebar Configuration Panel Update

**Files:**
- Modify: `frontend/src/components/SidebarConfig.jsx:1-3`, `frontend/src/components/SidebarConfig.jsx:263-299`

**Step 1: Write minimal implementation**
1. Add `import axios from "axios";` at the top of `frontend/src/components/SidebarConfig.jsx`.
2. Expand the `Ending Card` details in `SidebarConfig.jsx` to render:
   - Call to Action text input.
   - Website link text input.
   - Background image upload panel: Triggering file selection, base64 FileReader conversion, posting to `/api/upload` (which uploads to Cloudinary), and updating `config.ending.imageUrl`.
   - Background Music (BGM) selection dropdown.
   - Voiceover Text textarea.

**Step 2: Commit**
```bash
git add frontend/src/components/SidebarConfig.jsx
git commit -m "frontend: extend ending card config UI with BGM, Image Upload, and Voiceover"
```

---

### Task 3: Remotion Root Configuration Updates

**Files:**
- Modify: `my-video/src/Root.tsx:18-37`

**Step 1: Write minimal implementation**
Modify the metadata calculation function in `my-video/src/Root.tsx` to dynamically compute the ending card's duration instead of hardcoding 4.0 seconds. It should read `config?.ending?.voiceoverDuration` and use `Math.max(4.0, voiceoverDuration)`.

**Step 2: Commit**
```bash
git add my-video/src/Root.tsx
git commit -m "remotion: support dynamic ending duration in composition metadata"
```

---

### Task 4: Remotion MainComposition and Ending Layout Updates

**Files:**
- Modify: `my-video/src/compositions/MainComposition.tsx:16-61`, `my-video/src/compositions/MainComposition.tsx:243-267`, `my-video/src/compositions/MainComposition.tsx:353-364`

**Step 1: Write minimal implementation**
1. In `EndingLayout`, add `imageUrl?: string` to props. Render a dark-overlayed background image using the URL if present.
2. In `MainComposition.tsx`, calculate BGM duration dynamically: stop the main background music when the ending starts *only* if a custom background music is configured for the ending.
3. Update the ending sequence to play the custom ending BGM (if set) and play the generated ending TTS voiceover audio (if set).

**Step 2: Commit**
```bash
git add my-video/src/compositions/MainComposition.tsx
git commit -m "remotion: play ending BGM, voiceover, and render background image"
```

---

### Task 5: Frontend Player Sync

**Files:**
- Modify: `frontend/src/components/MasterPlayer.jsx:16-22`

**Step 1: Write minimal implementation**
Update the frontend player's total duration calculation in `MasterPlayer.jsx` to match the new dynamic ending duration.

**Step 2: Commit**
```bash
git add frontend/src/components/MasterPlayer.jsx
git commit -m "frontend: synchronize master player total duration with dynamic ending"
```
