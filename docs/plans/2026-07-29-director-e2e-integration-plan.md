# Director Engine End-to-End Integration Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Enable the React web app frontend to fully display, play, and regenerate `DIRECTOR` type projects using the new Director Engine.

**Architecture:** Extend database project getters to map nested `scenes` configurations into flat models. Update both the Storyboard and Master Remotion players to mount `DirectorRoot` if `projectType === 'DIRECTOR'`. Implement a single-scene semantic planner and update the `/generate-scene` backend route to process Director manifests instead of compiling raw React code.

**Tech Stack:** Node.js/Express, React, Remotion, sql.js, Gemini API.

---

## Tasks

### Task 1: Update Database Adapter for DIRECTOR projects

**Files:**
- Modify: [db.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/db.js)
- Create: `backend/scratch/test_db_director_mapping.js`

**Step 1: Write database mapping code**
Open [db.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/db.js) and search for `getProjectById` around line 213. Insert the `DIRECTOR` type mapping block right before `if (project.type === 'AIGEN')`:

```javascript
    if (project.type === 'DIRECTOR') {
      const scenes = (project.config?.scenes || []).map((sc, idx) => ({
        id: `scene_idx_${idx}`,
        sceneIndex: sc.sceneIndex,
        heading: sc.content?.heading || '',
        points: sc.content?.supporting || [],
        voiceover: sc.content?.voiceover || '',
        audioUrl: sc.audioUrl,
        audioDuration: sc.audioDuration,
        subtitlesJson: sc.subtitlesJson,
        duration: sc.audioDuration || sc.intent?.duration || 6.0,
        intent: sc.intent,
        content: sc.content
      }));
      return {
        id: project.id, title: project.title, status: project.status,
        createdAt: project.created_at, type: project.type, config: project.config,
        scenes
      };
    }
```

**Step 2: Create a verification scratch script**
Create `backend/scratch/test_db_director_mapping.js`:
```javascript
const db = require('../services/db');

async function main() {
  await db.initDb();
  
  const fakeManifest = {
    version: 'director-v1',
    projectId: 'test-map-001',
    scenes: [
      {
        sceneIndex: 0,
        intent: { duration: 5.0 },
        content: { heading: 'Test Title', supporting: ['Bullet 1'], voiceover: 'Test voiceover' },
        audioUrl: '/audio/test.wav',
        audioDuration: 5.0,
        subtitlesJson: []
      }
    ]
  };

  await db.saveDirectorProject('test-map-001', 'Test Mapping Project', fakeManifest);
  console.log('[Test] Project saved.');

  const project = await db.getProjectById('test-map-001');
  if (project.type !== 'DIRECTOR') throw new Error('Incorrect project type!');
  if (project.scenes.length !== 1) throw new Error('Failed to resolve mapped scenes!');
  
  const scene = project.scenes[0];
  if (scene.heading !== 'Test Title') throw new Error('Heading mapping failed!');
  if (scene.voiceover !== 'Test voiceover') throw new Error('Voiceover mapping failed!');
  if (scene.duration !== 5.0) throw new Error('Duration mapping failed!');
  
  // Clean up
  await db.deleteProject('test-map-001');
  console.log('[Test] Mapped fields: ALL PASS ✅');
}

main().catch(e => { console.error('[FAIL]', e.message); process.exit(1); });
```

**Step 3: Run scratch script to verify it passes**
Run: `node backend/scratch/test_db_director_mapping.js`
Expected: `Mapped fields: ALL PASS ✅`

**Step 4: Commit**
```bash
git add backend/services/db.js backend/scratch/test_db_director_mapping.js
git commit -m "feat(db): map DIRECTOR manifest scenes to flat editor models"
```

---

### Task 2: Update Dashboard Filter

**Files:**
- Modify: [Dashboard.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/Dashboard.jsx)

**Step 1: Update filteredProjects logic**
Open [Dashboard.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/Dashboard.jsx). Locate line 67 and change it to include `DIRECTOR` projects:

```javascript
  // Filter projects by type: AIGEN and DIRECTOR
  const filteredProjects = projects.filter(p => p.type === "AIGEN" || p.type === "DIRECTOR");
```

**Step 2: Commit**
```bash
git add frontend/src/components/Dashboard.jsx
git commit -m "feat(frontend): allow DIRECTOR type projects in Dashboard"
```

---

### Task 3: Update Storyboard Editor Player

**Files:**
- Modify: [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx)
- Modify: [App.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/App.jsx)

**Step 1: Import DirectorRoot in StoryboardEditor.jsx**
Open [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx). Add the import statement around line 5:
```javascript
import { DirectorRoot } from "../../../my-video/src/compositions/director/DirectorRoot";
```

**Step 2: Pass projectType through parameters**
Add `projectType` to the destructured props list of `StoryboardEditor` (line 446) and `InlineScenePlayer` (line 6):

```javascript
const InlineScenePlayer = ({ playerRef, scene, config, projectType, isPlaying, onEnded }) => {
```

```javascript
export const StoryboardEditor = ({
  mode = "editor",
  projectType = "AIGEN",
  scenes = [],
  config = {},
  // ...
```

**Step 3: Modify Player component resolution**
In `InlineScenePlayer`, rewrite the player definition (around line 107) to conditionally render `DirectorRoot` and its manifest wrapper:

```javascript
  return (
    <Player
      ref={localPlayerRef}
      component={projectType === 'DIRECTOR' ? DirectorRoot : MainComposition}
      inputProps={projectType === 'DIRECTOR' ? {
        manifest: {
          version: "director-v1",
          projectId: scene.id,
          metadata: { width: 1080, height: 1920, fps: 30, theme: "AI_HUB_DARK" },
          scenes: [scene]
        }
      } : { scenes: [scene], config }}
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
    />
  );
```

**Step 4: Update InlineScenePlayer call**
Find the rendering invocation of `<InlineScenePlayer` inside `StoryboardEditor.jsx` (around line 2090) and forward the `projectType` prop:
```javascript
                  <InlineScenePlayer
                    playerRef={el => playerRefs.current[scene.id] = el}
                    scene={scene}
                    config={config}
                    projectType={projectType}
                    isPlaying={playingSceneId === scene.id}
                    onEnded={() => handleScenePlayerEnded(scene.id)}
                  />
```

**Step 5: Forward projectType in App.jsx**
Open [App.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/App.jsx). In the `<StoryboardEditor` mount (line 671), pass `projectType`:
```javascript
              <StoryboardEditor
                mode="editor"
                projectType={currentProject?.type}
                scenes={currentProject?.scenes || []}
```

**Step 6: Commit**
```bash
git add frontend/src/components/StoryboardEditor.jsx frontend/src/App.jsx
git commit -m "feat(frontend): render DirectorRoot in StoryboardEditor for DIRECTOR projects"
```

---

### Task 4: Update Master Player

**Files:**
- Modify: [MasterPlayer.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/MasterPlayer.jsx)
- Modify: [App.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/App.jsx)

**Step 1: Import DirectorRoot**
Open [MasterPlayer.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/MasterPlayer.jsx). Add the import statement around line 4:
```javascript
import { DirectorRoot } from "../../../my-video/src/compositions/director/DirectorRoot";
```

**Step 2: Add projectType prop**
Destructure `projectType` from parameters in `MasterPlayer` (line 5):
```javascript
export const MasterPlayer = ({ 
  scenes = [], 
  config = {}, 
  projectTitle = "",
  projectType = "AIGEN",
  // ...
```

**Step 3: Modify Player component**
Update the `<Player>` render block in `MasterPlayer.jsx` (line 148):
```javascript
          {scenes.length > 0 ? (
            <Player
              component={projectType === 'DIRECTOR' ? DirectorRoot : MainComposition}
              inputProps={projectType === 'DIRECTOR' ? {
                manifest: {
                  version: "director-v1",
                  projectId: "master",
                  metadata: { width: 1080, height: 1920, fps: 30, theme: "AI_HUB_DARK" },
                  scenes: scenes
                }
              } : { scenes, config }}
              durationInFrames={totalFrames}
              fps={fps}
              compositionWidth={1080}
              compositionHeight={1920}
              style={{
                width: "100%",
                height: "100%",
              }}
              controls
              acknowledgeRemotionLicense
            />
          )
```

**Step 4: Forward projectType in App.jsx**
Open [App.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/App.jsx). Pass `projectType` to `<MasterPlayer` mount (line 692):
```javascript
              <MasterPlayer
                scenes={currentProject?.scenes || []}
                config={currentProject?.config || {}}
                projectTitle={currentProject?.title}
                projectType={currentProject?.type}
```

**Step 5: Commit**
```bash
git add frontend/src/components/MasterPlayer.jsx frontend/src/App.jsx
git commit -m "feat(frontend): render DirectorRoot in MasterPlayer for DIRECTOR projects"
```

---

### Task 5: Export single-scene Director planner in backend

**Files:**
- Modify: [directorPlanner.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/directorPlanner.js)

**Step 1: Write regenerateSingleDirectorScene**
Open [directorPlanner.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/directorPlanner.js) and append the function to the end:

```javascript
async function regenerateSingleDirectorScene({ sceneIndex, script, narrativeMoment, summary, projectId }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);

  const skeleton = {
    paragraphIds: [0],
    narrativeMoment: narrativeMoment || 'peak',
    summary: summary || 'regenerate scene content',
    estimatedDuration: 6.0,
    dependencies: []
  };

  const paragraphs = [script];
  const allSkeletons = [skeleton];

  const enriched = await pass2IntentContentPlanner(genAI, skeleton, paragraphs, allSkeletons, sceneIndex, projectId);
  return {
    sceneIndex,
    intent: enriched.intent,
    content: enriched.content
  };
}
```

**Step 2: Export the function**
Update the exports at the bottom (line 252):
```javascript
module.exports = { generateDirectorManifest, regenerateSingleDirectorScene };
```

**Step 3: Commit**
```bash
git add backend/services/directorPlanner.js
git commit -m "feat(backend): add regenerateSingleDirectorScene planner helper"
```

---

### Task 6: Update backend generate-scene route for DIRECTOR projects

**Files:**
- Modify: [studioAiGenRoute.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/routes/studioAiGenRoute.js)

**Step 1: Add imports**
Open [studioAiGenRoute.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/routes/studioAiGenRoute.js). Add imports at the top:
```javascript
const path = require("path");
const directorPlanner = require("../services/directorPlanner");
const { generateTTS } = require("../services/tts");
const { getWordTimestamps } = require("../services/aligner");
```

**Step 2: Handle DIRECTOR project type in generate-scene endpoint**
Find `router.post("/generate-scene"` (line 137). Insert the conditional block right after finding the project:

```javascript
    // Update project scenes array in database
    const project = await db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    if (project.type === 'DIRECTOR') {
      console.log(`[Director Route] Regenerating Scene ${scene.sceneIndex} inside DIRECTOR project ${projectId}...`);
      
      // 1. Generate new intent & content from script
      const planned = await directorPlanner.regenerateSingleDirectorScene({
        sceneIndex: scene.sceneIndex,
        script,
        narrativeMoment: scene.intent?.narrativeMoment,
        summary: scene.intent?.summary || 'User requested regeneration',
        projectId
      });

      // 2. Generate Audio TTS & aligned word timestamps
      const voiceover = planned.content.voiceover || '';
      let audioUrl = '';
      let audioDuration = 6.0;
      let subtitlesJson = [];

      if (voiceover.trim()) {
        const ttsResult = await generateTTS(voiceover, projectId, scene.sceneIndex);
        audioUrl = ttsResult.url;
        audioDuration = ttsResult.duration;

        const audioFileName = path.basename(ttsResult.url);
        const filePath = path.join(__dirname, '../public/tts', audioFileName);
        const subtitles = await getWordTimestamps(filePath, voiceover, ttsResult.duration);
        subtitlesJson = subtitles.map(w => ({
          word: w.word,
          start: w.start,
          end: w.end,
          speechStart: w.start,
          speechEnd: w.end
        }));
      }

      const updatedScene = {
        sceneIndex: scene.sceneIndex,
        intent: planned.intent,
        content: planned.content,
        audioUrl,
        audioDuration,
        subtitlesJson
      };

      const scenes = project.config.scenes || [];
      const idx = scenes.findIndex(s => s.sceneIndex === scene.sceneIndex);
      if (idx !== -1) {
        scenes[idx] = updatedScene;
      } else {
        scenes.push(updatedScene);
      }
      project.config.scenes = scenes.sort((a, b) => a.sceneIndex - b.sceneIndex);
      await db.saveDirectorProject(projectId, project.title, project.config);

      return res.json({
        success: true,
        scene: {
          id: `scene_idx_${scene.sceneIndex}`,
          ...updatedScene,
          heading: planned.content.heading,
          points: planned.content.supporting,
          voiceover: planned.content.voiceover,
          duration: audioDuration
        }
      });
    }
```

**Step 3: Commit**
```bash
git add backend/routes/studioAiGenRoute.js
git commit -m "feat(backend): support scene regeneration for DIRECTOR projects"
```
