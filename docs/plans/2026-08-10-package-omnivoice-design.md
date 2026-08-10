# Design: Package OmniVoice Offline TTS in Electron App

## Background

Currently, the offline TTS feature (OmniVoice) requires the user to manually install Python 3.11, set up the OmniVoice dependencies, and configure the path to `omnivoice-infer.exe` in the application settings. To make the application plug-and-play and fully offline, we will bundle the portable Python environment and model weights directly in the application package using a hybrid ZIP-based installer.

We also updated the API Settings page to have a clean, light-mode background and removed the fields for Cloudinary configuration, OmniVoice paths, and Gemini model choice (defaulting to `gemini-3.1-flash-lite`), simplifying configuration.

## Proposed Architecture: ZIP-based Hybrid Installer

To prevent `electron-builder` from slowing down or crashing due to packaging tens of thousands of small Python dependencies, we will package the portable environment as a single compressed zip file.

### 1. Build and Packaging Phase
- A compressed ZIP file containing the portable Python environment (including PyTorch, OmniVoice CLI, and model weights) must be prepared at `electron/runtimes/omnivoice-runtime.zip`.
- `electron/package.json` will copy this ZIP into the resources folder using `extraResources`:
  ```json
  "extraResources": [
    {
      "from": "runtimes/omnivoice-runtime.zip",
      "to": "omnivoice-runtime.zip"
    }
  ]
  ```
- `electron/build.js` will ensure this file is synced properly during the build cycle.

### 2. Startup & Extraction Flow (Main Process)
When the application starts:
1. Electron checks if `omnivoice-infer.exe` exists in the local AppData folder:
   `const extractDest = path.join(app.getPath('userData'), 'omnivoice-runtime');`
2. If it is already extracted, the Main process sets the environment variable:
   `process.env.OMNIVOICE_INFER_PATH = path.join(extractDest, 'Scripts', 'omnivoice-infer.exe');`
   and boots the Node.js backend.
3. If it is NOT present:
   - Hide the main application window and show a premium Setup Splash Screen.
   - Extract `omnivoice-runtime.zip` from `process.resourcesPath` to `extractDest`.
   - Update UI status during extraction.
   - On completion, write a marker file and boot the backend.

## UI Cleanups Done
- Switch API Settings page layout in `frontend/src/components/SettingsPage.jsx` to slate light mode (`#f8fafc`).
- Remove input forms for Cloudinary credentials (retrieved directly from backend config).
- Remove input form for OmniVoice Path (automatically set from extracted package runtime).
- Remove input form for Gemini Model (defaults to `gemini-3.1-flash-lite`).

## Verification Plan

### Manual Verification
1. Build the application or run in dev mode with environment simulation.
2. Confirm the Settings page loads with the bright light theme and only shows Gemini API key, VBEE API key, and App ID.
3. Delete the local `userData/omnivoice-runtime` folder.
4. Verify the extraction dialog displays, successfully decompresses the portable runtime, and automatically starts the backend.
5. Verify voice cloning works without manually specifying paths.
