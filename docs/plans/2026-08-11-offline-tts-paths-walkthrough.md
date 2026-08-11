# Offline TTS Path and Model Cache Resolution Walkthrough

## Changes Made
- **Relocated Runtime Extraction Path:** Changed the portable Python extraction directory in `electron/main.js` from AppData to `C:\Users\Public\ai-video-app-runtime` to prevent path syntax/Unicode errors caused by non-ASCII characters or spaces in Windows user profile directories.
- **Configured & Passed `HF_HOME`:** Registered `process.env.HF_HOME = path.join(omnivoiceDir, 'hf_cache')` on startup in the main process and forwarded it to the child process spawning the Express backend.
- **Injected `HF_HOME` in Subprocesses:** Updated `backend/services/tts.js` to inherit `process.env.HF_HOME` inside `execFileAsync` environment configurations when running `omnivoice-infer.exe` to guarantee offline lookup of cached models.
- **Fixed Packaging Config:** Added `setup-loading.html` to the `files` array inside `electron/package.json` to prevent crashes when displaying the decompression splash screen in the packaged app.

## What was Tested
- Ran a clean, end-to-end build using `node build.js --dir` within the `electron` directory.
- Terminated lingering background/zombie application processes on the client machine to avoid port/cache locking.
- Launched the packaged executable `electron/dist/win-unpacked/AI Video Creator.exe` under a clean environment (no preexisting public runtime folder).
- Monitored extraction command execution and logs.

## Validation Results
- **Success:** The application created `C:\Users\Public\ai-video-app-runtime` and decompressed `Python311` successfully.
- **Success:** `omnivoice-infer.exe` was verified present at `C:\Users\Public\ai-video-app-runtime\Python311\Scripts\omnivoice-infer.exe`.
- **Success:** The application logged correct environment path parameters:
  - `[Main] AppData OmniVoice path registered: C:\Users\Public\ai-video-app-runtime\Python311\Scripts\omnivoice-infer.exe`
  - `[Main] AppData HF_HOME cache path registered: C:\Users\Public\ai-video-app-runtime\hf_cache`
- **Success:** The Express backend booted successfully on port 5000 and the Electron window loaded the frontend interface correctly.
