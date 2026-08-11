# Design: 100% Offline TTS Path and Model Packaging Resolution

## Goal

Resolve two critical runtime errors reported on client machines when running the offline OmniVoice TTS:
1. **Unicode/Space Path Execution Errors:** The app crashes or fails to execute `omnivoice-infer.exe` when the client's Windows username contains Vietnamese accents (Unicode characters) or spaces.
2. **Missing Offline Model Weights (Hugging Face Cache):** The application throws `LocalEntryNotFoundError` because the Hugging Face model weights (`k2-fsa/OmniVoice`) were not packaged in the application bundle and defaulted to looking up the client's empty home directory cache.

---

## Proposed Architecture

### 1. Relocate extraction to a Clean, Space-free, Unicode-safe path
Instead of extracting the portable runtime to `app.getPath('userData')` (which resolves under `C:\Users\<Username>\AppData\Roaming`), we will extract it to:
```javascript
const omnivoiceDir = path.join(process.env.SystemDrive || 'C:', 'Users', 'Public', 'ai-video-app-runtime');
```
* **Why `C:\Users\Public`?** It is standard across all Windows NT platforms (Vista, 7, 8, 10, 11), does not contain spaces or accented characters, and is writable by all standard users without requiring administrator privileges.

### 2. Packaging Hugging Face cache inside the runtime ZIP
The developer will rebuild `omnivoice-runtime.zip` to bundle the Hugging Face model cache:
1. Create a directory named `hf_cache` inside the local `omnivoice-runtime` folder.
2. Copy the contents of the local HuggingFace cache (from `C:\Users\nghia\.cache\huggingface`) into `omnivoice-runtime/hf_cache/`.
3. Zip `omnivoice-runtime` to `omnivoice-runtime.zip` and place it at `electron/runtimes/omnivoice-runtime.zip`.
When extracted on the client's machine, the models will live at `C:\Users\Public\ai-video-app-runtime\hf_cache`.

### 3. Inject `HF_HOME` environment variable to subprocesses
At app startup, Electron Main Process will register:
```javascript
process.env.HF_HOME = path.join(omnivoiceDir, 'hf_cache');
```
We will modify the spawn configurations so that `HF_HOME` is explicitly inherited and passed down:
* **Express Backend Spawn:** Pointed in `electron/main.js` `startBackend()` env variables.
* **OmniVoice PyInstaller Spawn:** Pointed in `backend/services/tts.js` `execFile` env variables.

---

## Verification Plan

### Manual Verification
1. Remove any local `C:\Users\Public\ai-video-app-runtime` directory to simulate a fresh installation.
2. Re-build the application using `npm run build:dir`.
3. Launch the packaged application and verify that the extraction splash screen opens, extracts the zipped Python runtime + HF cache, and starts the backend.
4. Verify that the Settings UI works and the offline voice cloner works immediately without internet access.
