# Design: Remove Manual Studio & Filter AI Gen Only

We are removing the manual "Studio" page/view (which is for manual storyboard/script editing) from the application. We will preserve the "Studio AI Gen" page and keep its editing/generation flow fully functional. The Dashboard will be simplified to show only "Video AI Gen" projects and hide the manual "Biên tập Storyboard" tab/projects.

Additionally, we will clean up the Project Workspace Editor:
1. Remove the "Thiết lập & Kịch bản" and "Biên tập Storyboard" tabs from the header.
2. Remove the `WORKSPACE_SETUP` state and rendering code, going straight to `WORKSPACE_EDITOR`.

## Proposed Changes

### Frontend Component & App Routing

#### [MODIFY] [App.jsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/frontend/src/App.jsx)
- Remove `🎥 Studio` list item from navigation sidebar.
- Remove the `view === "STUDIO"` conditional render block from the Content Area.
- In `fetchProjectDetail`, always route to `WORKSPACE_EDITOR` instead of `WORKSPACE_SETUP` if the project is not AI Gen.
- Remove the tab navigation button elements ("Thiết lập & Kịch bản" and "Biên tập Storyboard") from the workspace header.
- Remove the `view === "WORKSPACE_SETUP"` conditional workspace renderer block, and always render the Storyboard Editor and Master Player layout.

#### [MODIFY] [Dashboard.jsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/frontend/src/components/Dashboard.jsx)
- Remove the selector tabs (`Biên tập Storyboard` and `Video AI Gen`).
- Filter projects to only show AI Gen projects:
  ```js
  const filteredProjects = projects.filter(p => p.type === "AIGEN");
  ```
- Update the empty state text to direct the user to the Studio AI Gen page if no projects exist.

## Verification Plan

### Manual Verification
- Run the app using `npm run dev`.
- Verify the sidebar only shows Home, Studio AI Gen, Hàng loạt, and Dự án (and no Studio).
- Verify the Dashboard does not show tabs and only lists AI Gen projects.
- Verify clicking on a project in the Dashboard opens the project editor, which has no tabs in the header and shows the storyboard cards directly.
- Verify Studio AI Gen generates projects and they display on the Dashboard correctly.
