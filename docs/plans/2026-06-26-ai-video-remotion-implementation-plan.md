# AI Video Remotion Creator Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build a separated Frontend-Backend application where the frontend is a React-Remotion app for storyboard editing and live preview, and the backend is a Node.js Express server managing projects, calling AI services (Gemini, ElevenLabs, Unsplash) with fallbacks, and rendering videos via Remotion CLI.

**Architecture:** 
- **Backend (Express API Server):** Manages DB state in a local JSON database, coordinates AI generation pipelines (Gemini + ElevenLabs + Unsplash), serves static voiceover audio, and runs Remotion rendering child processes.
- **Frontend (Remotion React App):** Connects to the backend via REST APIs, plays live previews via `@remotion/player` using reactive `inputProps`, and edits configs/scenes in a minimalist monochrome style.

**Tech Stack:** React, Remotion, `@remotion/player`, Node.js, Express, Axios, ElevenLabs API, Gemini API, Unsplash API.

---

## Phase 1: Backend Setup & Data Persistence (DB)

### Task 1: Reorganize Workspace Folders
*   **Files:**
    *   [NEW] [package.json](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/backend/package.json)
    *   [MODIFY] Workspace root directories: Rename `my-video` folder to `frontend`.
*   **Step 1:** Rename the existing folder `my-video` in the workspace to `frontend`.
*   **Step 2:** Create the directory `backend/` and `backend/public/tts/` for storing voiceover audio files.
*   **Step 3:** Create `backend/package.json` with the following content:
    ```json
    {
      "name": "ai-video-backend",
      "version": "1.0.0",
      "main": "server.js",
      "scripts": {
        "start": "node server.js",
        "dev": "nodemon server.js"
      },
      "dependencies": {
        "body-parser": "^1.20.2",
        "cors": "^2.8.5",
        "dotenv": "^16.4.5",
        "express": "^4.19.2",
        "@google/generative-ai": "^0.11.4"
      },
      "devDependencies": {
        "nodemon": "^3.1.0"
      }
    }
    ```
*   **Step 4:** Run initialization verification: install backend packages.
    *   Command: `cd backend; npm install`
*   **Step 5:** Commit changes.

### Task 2: Setup File-Based JSON Database Service
*   **Files:**
    *   [NEW] [db.js](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/backend/services/db.js)
*   **Step 1:** Implement `backend/services/db.js` using Node's `fs` module to save and load state in `db.json`. It must manage:
    *   `projects`: array of project objects with schema described in design doc.
    *   Methods: `getProjects()`, `getProjectById(id)`, `createProject(title)`, `updateProjectConfig(id, config)`, `updateProjectScenes(id, scenes)`, `updateScene(projectId, sceneId, sceneData)`.
*   **Step 2:** Code implementation:
    ```javascript
    const fs = require('fs');
    const path = require('path');
    const DB_FILE = path.join(__dirname, '../db.json');

    function initDb() {
      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ projects: [] }, null, 2));
      }
    }

    function readDb() {
      initDb();
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }

    function writeDb(data) {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    }

    module.exports = {
      getProjects: () => readDb().projects,
      getProjectById: (id) => readDb().projects.find(p => p.id === id),
      createProject: (title) => {
        const db = readDb();
        const newProj = {
          id: `proj_${Math.random().toString(36).substr(2, 9)}`,
          title,
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          config: {
            length: "Short (~60s)",
            language: "Vietnamese",
            voice: "rachel",
            watermark: { enabled: true, text: "yupclip.com", position: "top-right", color: "#000000" },
            ending: { enabled: true, logoText: "YupVid", website: "yupvid.com" },
            backgroundMusic: "Chill Lofi Beats"
          },
          scenes: []
        };
        db.projects.push(newProj);
        writeDb(db);
        return newProj;
      },
      updateProjectConfig: (id, config) => {
        const db = readDb();
        const index = db.projects.findIndex(p => p.id === id);
        if (index !== -1) {
          db.projects[index].config = { ...db.projects[index].config, ...config };
          writeDb(db);
          return db.projects[index];
        }
        return null;
      },
      updateProjectScenes: (id, scenes) => {
        const db = readDb();
        const index = db.projects.findIndex(p => p.id === id);
        if (index !== -1) {
          db.projects[index].scenes = scenes;
          writeDb(db);
          return db.projects[index];
        }
        return null;
      },
      updateScene: (projectId, sceneId, sceneData) => {
        const db = readDb();
        const proj = db.projects.find(p => p.id === projectId);
        if (!proj) return null;
        const sceneIndex = proj.scenes.findIndex(s => s.id === sceneId);
        if (sceneIndex !== -1) {
          proj.scenes[sceneIndex] = { ...proj.scenes[sceneIndex], ...sceneData };
          writeDb(db);
          return proj.scenes[sceneIndex];
        }
        return null;
      }
    };
    ```
*   **Step 3:** Verify using a quick Node terminal script that creating and fetching a project writes to `db.json`.
*   **Step 4:** Commit changes.

---

## Phase 2: AI Integrations, Fallbacks & Core REST Endpoints

### Task 3: Setup AI Integration Services (Gemini, ElevenLabs, Unsplash)
*   **Files:**
    *   [NEW] [ai.js](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/backend/services/ai.js)
    *   [NEW] [tts.js](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/backend/services/tts.js)
    *   [NEW] [media.js](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/backend/services/media.js)
    *   [NEW] [.env](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/backend/.env)
*   **Step 1:** Create `backend/.env` with placeholders for API keys:
    ```env
    PORT=5000
    GEMINI_API_KEY=
    ELEVENLABS_API_KEY=
    UNSPLASH_ACCESS_KEY=
    ```
*   **Step 2:** Write `backend/services/ai.js` to split scripts into scene JSON arrays. If `GEMINI_API_KEY` is not supplied, fallback to returning 3 pre-configured dummy scenes (Intro, Content, Outro).
*   **Step 3:** Write `backend/services/tts.js`. If `ELEVENLABS_API_KEY` is supplied, make an HTTP call to ElevenLabs `/v1/text-to-speech/{voice_id}` to generate `.mp3` and save in `backend/public/tts/`. If missing, copy a static blank/pre-defined silent audio or make a dummy `.mp3` file to avoid crashes.
*   **Step 4:** Write `backend/services/media.js`. If `UNSPLASH_ACCESS_KEY` is supplied, query Unsplash `/search/photos`. Otherwise, return a static array of high-quality tech/office Unsplash image URLs based on mock keywords.
*   **Step 5:** Verify code syntax and error handling.
*   **Step 6:** Commit changes.

### Task 4: Complete Express Server & Endpoints
*   **Files:**
    *   [NEW] [server.js](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/backend/server.js)
*   **Step 1:** Write the Express server in `backend/server.js` using `cors`, `body-parser` and serving static files from `backend/public/`.
*   **Step 2:** Implement the following routes:
    *   `GET /api/projects` - returns list of projects.
    *   `POST /api/projects` - creates project.
    *   `GET /api/projects/:id` - returns full project.
    *   `PUT /api/projects/:id/config` - updates project config.
    *   `GET /api/media/search` - queries Unsplash search using `media.js`.
    *   `PUT /api/projects/:id/scenes/:sceneId` - updates scene content. If `voiceover` text has changed, call `tts.js` to update `.mp3` voiceover file.
    *   `POST /api/projects/:id/generate-storyboard` - parses script via `ai.js`, generates tts for each scene, finds Unsplash suggestions, saves in project, and returns scenes.
*   **Step 3:** Verify backend server boots successfully on port 5000 without crashes.
    *   Command: `node backend/server.js`
*   **Step 4:** Commit changes.

---

## Phase 3: Frontend UI/UX Design

### Task 5: Setup Frontend Dependencies & Theme CSS
*   **Files:**
    *   [MODIFY] [package.json](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/frontend/package.json)
    *   [NEW] [theme.css](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/frontend/src/styles/theme.css)
*   **Step 1:** Add `@remotion/player`, `axios` to `frontend/package.json`.
    *   Command: `cd frontend; npm install @remotion/player axios`
*   **Step 2:** Write `frontend/src/styles/theme.css` to build the **Minimalist Monochrome** theme (solid 1px/2px black/gray borders, crisp 4px border-radius, clean grid lines, Inter body text, Space Grotesk headings, White/Black/Light-Gray backgrounds).
*   **Step 3:** Import `theme.css` in `frontend/src/index.css` or `frontend/src/main.jsx`.
*   **Step 4:** Verify that frontend boots correctly.
    *   Command: `cd frontend; npm run dev`
*   **Step 5:** Commit changes.

### Task 6: Implement Remotion Layout Templates & Sequences
*   **Files:**
    *   [NEW] [IntroProfile.tsx](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/frontend/src/compositions/IntroProfile.tsx)
    *   [NEW] [GithubStatusHook.tsx](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/frontend/src/compositions/GithubStatusHook.tsx)
    *   [NEW] [SplitGrid.tsx](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/frontend/src/compositions/SplitGrid.tsx)
    *   [NEW] [MainComposition.tsx](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/frontend/src/compositions/MainComposition.tsx)
*   **Step 1:** Build dynamic React compositions in `frontend/src/compositions/` using Remotion hooks (`useCurrentFrame`, `useVideoConfig`, `AbsoluteFill`, `spring`). They must support the Monochrome style.
*   **Step 2:** Write `MainComposition.tsx` to map the `scenes` array (passed in via `inputProps` from the player) to consecutive `<Sequence>` sections based on durations, overlaying the watermark, background music, and matching voiceovers.
*   **Step 3:** Commit changes.

### Task 7: Build UI/UX Editor Layout & Forms
*   **Files:**
    *   [NEW] [Dashboard.jsx](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/frontend/src/components/Dashboard.jsx)
    *   [NEW] [SidebarConfig.jsx](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/frontend/src/components/SidebarConfig.jsx)
    *   [NEW] [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx)
    *   [NEW] [MasterPlayer.jsx](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/frontend/src/components/MasterPlayer.jsx)
*   **Step 1:** Build the Dashboard component displaying project list and "Create Project" prompt.
*   **Step 2:** Build SidebarConfig layout to configure project parameters.
*   **Step 3:** Build StoryboardEditor rendering scene cards with forms to modify heading, bullet points, voiceover, layout, and image search.
*   **Step 4:** Build `MasterPlayer.jsx` wrapping `@remotion/player` playing `MainComposition` with live input properties from state.
*   **Step 5:** Commit changes.

---

## Phase 4: Integration & Rendering Engine

### Task 8: Frontend-Backend State Integration
*   **Files:**
    *   [NEW] [api.js](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/frontend/src/services/api.js)
    *   [MODIFY] [App.jsx](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/frontend/src/App.jsx)
*   **Step 1:** Create `frontend/src/services/api.js` containing API client functions mapping all server routes.
*   **Step 2:** Integrate `App.jsx` to load projects list at startup, load specific project details on project select, save config changes to backend via debounced auto-saves or save triggers, and save individual scene edits.
*   **Step 3:** Verify that changes made on the frontend (like modifying text, selecting a layout) reflect in `backend/db.json` and sync in the player live preview.
*   **Step 4:** Commit changes.

### Task 9: Implement Remotion Render Engine
*   **Files:**
    *   [MODIFY] [server.js](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/backend/server.js)
    *   [NEW] [render.js](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/backend/services/render.js)
*   **Step 1:** Write `backend/services/render.js` to execute `npx remotion render` CLI command inside the `frontend` folder using `child_process.spawn`.
*   **Step 2:** Remotion CLI command format:
    ```bash
    npx remotion render src/index.ts MainComposition public/downloads/output_<proj_id>.mp4 --input-props='<JSON>'
    ```
*   **Step 3:** Expose `/downloads` static directory from `backend/public/downloads/` containing rendered videos.
*   **Step 4:** Add state trackers to monitor parsing output of `progress` and write status updates to memory.
*   **Step 5:** Connect `POST /api/projects/:id/render` and `GET /api/projects/:id/render/status/:renderId` endpoints on Express server.
*   **Step 6:** Hook render buttons and loading progression bars on the Frontend.
*   **Step 7:** Verify rendering engine completes properly.
*   **Step 8:** Commit changes.

---

## Verification Plan

### Automated Tests
1. Verify backend starts without errors: `npm run start` inside `backend/`
2. Verify frontend starts without errors: `npm run dev` inside `frontend/`

### Manual Verification
1. Open frontend on `http://localhost:5173/`, verify Dashboard loads projects.
2. Create project, insert text script, wait for AI generating storyboard.
3. Edit a scene layout and verify live preview on the right side updates instantly.
4. Click 'Xuất Video', verify loader logs progress and provides download button.
5. Download MP4 video and play it.
