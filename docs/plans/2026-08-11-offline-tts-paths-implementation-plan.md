# Offline TTS Path and Model Cache Resolution Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Modify the Electron application to extract the portable Python runtime into a space-free, Unicode-safe public directory and inject the `HF_HOME` environment variable pointing to the packaged offline model cache.

**Architecture:** Relocate extraction folder to `C:\Users\Public\ai-video-app-runtime` in the Electron main process, define and pass the `HF_HOME` environment variable down to the spawned Node.js backend, and modify the backend TTS service to forward `HF_HOME` to the spawned `omnivoice-infer.exe` process.

**Tech Stack:** Electron Main Process, Node.js child_process, Windows filesystem.

---

### Task 1: Update extraction path and environment variables in Electron main.js

**Files:**
- Modify: [main.js](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/electron/main.js)

**Step 1: Relocate extraction directory in main.js**
Modify `ensureOmniVoice()` path assignment in `electron/main.js`:
Replace `const omnivoiceDir = path.join(app.getPath('userData'), 'omnivoice-runtime');` (around line 315) with:
```javascript
const omnivoiceDir = path.join(process.env.SystemDrive || 'C:', 'Users', 'Public', 'ai-video-app-runtime');
```

**Step 2: Inject HF_HOME in lifecycle startup**
Inside `app.whenReady()` (around line 401), set `HF_HOME` variable on process environment:
```javascript
app.whenReady().then(async () => {
  const exePath = await ensureOmniVoice();
  if (exePath) {
    const omnivoiceDir = path.join(process.env.SystemDrive || 'C:', 'Users', 'Public', 'ai-video-app-runtime');
    process.env.OMNIVOICE_INFER_PATH = exePath;
    process.env.HF_HOME = path.join(omnivoiceDir, 'hf_cache');
    console.log('[Main] AppData OmniVoice path registered:', process.env.OMNIVOICE_INFER_PATH);
    console.log('[Main] AppData HF_HOME cache path registered:', process.env.HF_HOME);
  }
  ...
```

**Step 3: Forward HF_HOME to Express backend in startBackend()**
In `startBackend()` (around line 77), add `HF_HOME` to the `env` object:
```javascript
  const env = {
    ...process.env,
    PORT: String(BACKEND_PORT),
    ELECTRON_APP_DATA: APP_DATA_DIR,
    MY_VIDEO_PATH: MY_VIDEO_PATH,
    NODE_ENV: 'production',
    ELECTRON_RUN_AS_NODE: '1',
    HF_HOME: process.env.HF_HOME
  };
```

**Step 4: Commit**
```bash
git add electron/main.js
git commit -m "feat: change tts extraction directory to Users/Public and inject HF_HOME"
```

---

### Task 2: Inject HF_HOME into subprocess environment inside tts.js

**Files:**
- Modify: [tts.js](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/backend/services/tts.js)

**Step 1: Add HF_HOME to execFileAsync arguments in generateTTS**
In `backend/services/tts.js` `generateTTS` (around line 215), inside the `env` dictionary of `execFileAsync`:
```javascript
          return await execFileAsync(omnivoiceExe, args, {
            cwd: backendDir,
            timeout: 300000,
            maxBuffer: 10 * 1024 * 1024,
            env: {
              ...process.env,
              PYTHONUTF8: "1",
              PYTHONIOENCODING: "utf-8",
              HF_ENDPOINT: "https://hf-mirror.com",
              HF_HOME: process.env.HF_HOME
            }
          });
```

**Step 2: Commit**
```bash
git add backend/services/tts.js
git commit -m "feat: forward HF_HOME to omnivoice-infer process"
```

---

### Task 3: Verification Plan

**Step 1: Re-build directory**
Run `npm run build:dir` in the `electron` directory.

**Step 2: Verify extraction and startup**
Ensure any existing `C:\Users\Public\ai-video-app-runtime` folder is deleted. Launch the packaged application, check that extraction is initiated, and verify that the backend launches successfully.
