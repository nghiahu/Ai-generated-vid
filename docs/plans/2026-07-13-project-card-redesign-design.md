# Design: Project Card Redesign

This design document outlines the visual and functional enhancements to the Project Card component within the Kisafes application dashboard.

## Key Changes

### 1. Backend API Extension
- **Route**: `GET /api/projects` in `backend/server.js`.
- **Modification**: Return full project objects (including `scenes` and `config`) rather than mapping a thin list of properties. This provides the frontend with immediate access to script texts and scene media for rendering thumbnails.

### 2. Project Card Layout Redesign
- **Component**: `Dashboard.jsx`.
- **Grid Layout**: Restructure the project list grid to support wide horizontal cards instead of small grid blocks.
- **Left Column: Media Player / Thumbnail**:
  - Displays a vertical (9:16 aspect ratio, ~200px width) image block.
  - Background image set to the first media item of the first scene.
  - Features a large play button overlay in the center.
  - Clicking play replaces the thumbnail with an `<audio>` / `<video>` element playing `/downloads/output_[projectId].mp4` directly inside the thumbnail block.
- **Right Column: Metadata & Controls**:
  - **Title**: Large bold text linking or opening in the studio workspace.
  - **Script Excerpt**: A joined text of all scene `voiceover` contents, truncated to around 200 characters with an ellipsis `...`.
  - **Timestamp**: Rendered in a small gray format: `done - MM/DD/YYYY, HH:MM GMT+7`.
  - **Downloads Section**:
    - Header: `DOWNLOADS` in small bold uppercase.
    - Pill buttons: `MP4` (points to video URL), `Thumbnail` (points to first scene image), `Voice` (points to voiceover URL), `Subtitles` (points to subtitles file, if available).
  - **Publish Section**:
    - Header: `PUBLISH TO PLATFORMS` in small bold uppercase.
    - Placeholder text: `"Connect at least one social platform first."`
- **Actions Area (Top-Right)**:
  - **Open in Studio Button**: Placed at the top right of the card, triggers opening the workspace editor.
  - **✕ (Delete) Button**: Placed directly above the Studio button for quick deletion.

---

## Approvals
- Layout and video playback behaviour approved by the user.
