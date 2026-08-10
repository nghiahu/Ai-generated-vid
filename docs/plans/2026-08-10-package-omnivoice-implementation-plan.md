# Package OmniVoice Offline TTS in Electron Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Package the entire offline local cloner (OmniVoice) as a ZIP file within the Electron app and automatically extract it to the user's AppData on first run to achieve a zero-setup offline cloner experience.

**Architecture:** We bundle `omnivoice-runtime.zip` inside the Electron `extraResources`. At boot, Electron Main process checks for the extracted executable in `userData/omnivoice-runtime`. If missing, it displays a loading dialog, extracts it using `adm-zip`, sets the override path, and launches the backend.

**Tech Stack:** Electron Main Process, Node.js filesystem, `adm-zip` library.

---

### Task 1: Install `adm-zip` dependency in Electron package
**Files:**
- Modify: [package.json](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/electron/package.json)

**Step 1: Write the change in package.json**
Add `"adm-zip": "^0.5.10"` to `dependencies`.

**Step 2: Run npm install inside electron directory**
Run: `npm install` inside `c:\Users\nghia\OneDrive\Máy tính\AI-grenerated vid-hyperframe\electron`
Expected: Installation completes successfully and `adm-zip` is added to `node_modules`.

**Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: add adm-zip dependency to electron"
```

---

### Task 2: Implement extraction flow and setup window in `main.js`
**Files:**
- Modify: [main.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/electron/main.js)
- Create: [setup-loading.html](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/electron/setup-loading.html)

**Step 1: Create `setup-loading.html`**
Create a simple HTML page to act as the loading splash with a progress indicator for extraction.

**Step 2: Add extraction logic in `main.js`**
Write a function `ensureOmniVoice()` that checks if `omnivoice-infer.exe` exists in `app.getPath('userData')/omnivoice-runtime`.
If it doesn't, display `setup-loading.html`, extract `omnivoice-runtime.zip` asynchronously via `adm-zip` using worker/promises, and close the window upon completion.

**Step 3: Test execution**
Simulate zip file existence and verify that the loading window opens and closes correctly on completion.

**Step 4: Commit**
```bash
git add main.js setup-loading.html
git commit -m "feat: add ensureOmniVoice extraction utility and setup loading window"
```

---

### Task 3: Inject path environment variable to Backend process
**Files:**
- Modify: [main.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/electron/main.js)

**Step 1: Inject env variable in `startBackend`**
Set `OMNIVOICE_INFER_PATH` dynamically inside the spawned backend process environment:
```javascript
OMNIVOICE_INFER_PATH: path.join(app.getPath('userData'), 'omnivoice-runtime', 'Scripts', 'omnivoice-infer.exe')
```

**Step 2: Verify path environment**
Log the path at backend start to confirm it points to the local AppData folder.

**Step 3: Commit**
```bash
git add main.js
git commit -m "feat: pass AppData OmniVoice path to backend process"
```

---

### Task 4: Configure Electron Builder extraResources and build.js
**Files:**
- Modify: [package.json](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/electron/package.json)
- Modify: [build.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/electron/build.js)

**Step 1: Add config to package.json**
Add the ZIP mapping under `extraResources`:
```json
{
  "from": "temp-resources/omnivoice-runtime.zip",
  "to": "omnivoice-runtime.zip"
}
```

**Step 2: Sync runtime zip in build.js**
Ensure that `electron/build.js` copies the zip file from `electron/runtimes/omnivoice-runtime.zip` to the `temp-resources` directory before launching `electron-builder`.

**Step 3: Commit**
```bash
git add package.json build.js
git commit -m "build: configure extraResources and sync for omnivoice-runtime.zip"
```

---

### Task 5: Manual End-to-End Verification
**Step 1: Place dummy runtime.zip**
Create a small dummy zip containing a text file named `omnivoice-infer.exe` and place it in `electron/runtimes/omnivoice-runtime.zip`.

**Step 2: Clear local data and run**
Delete the destination folder if it exists. Run the app using dev or test build, and verify that it extracts, sets path, and boots properly.

**Step 3: Commit**
```bash
git commit --allow-empty -m "test: verify extraction and startup pipeline manual tests pass"
```
