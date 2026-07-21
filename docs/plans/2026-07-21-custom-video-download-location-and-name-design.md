# Design Document: Custom Video Download Filename and Save Location

## Problem Statement
Previously, clicking "📥 Tải Video MP4" opened a raw link in a new browser tab (`http://localhost:5000/downloads/output_xxx.mp4`), preventing users from picking a custom save location or having a filename matching the video/project title.

## Technical Solution
1. **Suggested Filename**:
   - Derive default filename from `projectTitle` / `config.title` / first scene heading (e.g. `Cong_Thuc_Noi_Dau_AI.mp4`).
   - Sanitize invalid OS characters (`/ \ ? % * : | " < >`).
2. **Native Save File Picker (`showSaveFilePicker`)**:
   - When available, invoke `window.showSaveFilePicker({ suggestedName, types: [{ accept: { 'video/mp4': ['.mp4'] } }] })`.
   - Allows users to pick any directory and customize the filename.
   - Stream video blob directly to selected file handle.
3. **Fallback Anchor Download**:
   - If `showSaveFilePicker` is unavailable or throws fallback, fetch blob and trigger `a.download = defaultFilename`.

## Verification Plan
1. Render a video.
2. Click "📥 Tải Video MP4".
3. Verify file save dialog opens with default filename matching video title.
