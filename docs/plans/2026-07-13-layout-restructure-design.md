# Design: Layout Restructure with Sidebar Navigation and Frontend Draft Mode

This design document outlines the layout restructuring of the Kisafes/Hyperframes application. It introduces a left-side navigation sidebar, changes the logo branding, and modifies the project creation flow to support a seamless setup experience without prompt modals.

## Key Changes

### 1. Branding & Sidebar Layout
- **Brand Name**: Change the logo name from `HYPERFRAMES` to `kisafes` with custom styling (Montserrat font, gradient colors).
- **Layout Structure**: 
  - A left sidebar (260px wide) fixed on all major pages.
  - The sidebar will contain:
    - The `kisafes` logo at the top.
    - Navigation items: Home, Studio, Hàng loạt, Dự án.
  - Secondary/footer menus and profile indicators are excluded as requested.
- **Projects Page**: The project list will no longer feature a "Tạo Video Mới" button. New video/project creation is triggered exclusively via the "Studio" page.

### 2. View States (`App.jsx`)
- `view = "PROJECTS"` (Default): Displays the existing projects page (the old `DASHBOARD`).
- `view = "STUDIO"`: Renders a client-side draft setup screen. No project is saved to the database yet.
- `view = "BATCH"`: Renders a batch setup placeholder screen.
- `view = "WORKSPACE_EDITOR"`: Renders the active project editing workspace (as before).

### 3. Creation Logic (Studio Draft -> Saved Project)
1. When clicking **Studio**, `view` is set to `"STUDIO"` and `selectedProjectId` is cleared. A local draft configuration state is maintained.
2. The user inputs their script and styles.
3. Upon clicking **Tạo storyboard**:
   - The system extracts the first sentence or first few words of the script (up to 40 characters) as the project title.
   - If the script is short or empty, a timestamp-based title is generated (e.g. `Dự án Studio 13/07/2026 15:08`).
   - The app calls `api.createProject(title)` to persist the project.
   - Using the newly generated `projectId`, the app calls `api.generateStoryboard(...)`.
   - On success, `selectedProjectId` is set to the new ID, and `view` transitions to `"WORKSPACE_EDITOR"`.

---

## Approvals
- Layout changes and simplified sidebar approved by the user.
- Frontend draft approach approved by the user.
