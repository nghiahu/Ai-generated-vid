| Task | Status | Description |
| --- | --- | --- |
| Task 1: Update extraction path and environment variables in Electron main.js | [ ] | Relocate extraction path to C:\Users\Public\ai-video-app-runtime and inject process.env.HF_HOME and OMNIVOICE_INFER_PATH in electron/main.js |
| Task 2: Inject HF_HOME into subprocess environment inside tts.js | [ ] | Pass HF_HOME explicitly inside the env block of execFileAsync inside backend/services/tts.js |
| Task 3: Package application and verify end-to-end extraction and execution | [ ] | Re-build directory using npm run build:dir, clear existing runtime, verify successful extraction and backend boot |
