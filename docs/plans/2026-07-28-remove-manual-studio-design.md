# Design: Remove Manual Studio & Filter AI Gen Only

We are removing the manual "Studio" page/view (which is for manual storyboard/script editing) from the application. We will preserve the "Studio AI Gen" page and keep its editing/generation flow fully functional. The Dashboard will be simplified to show only "Video AI Gen" projects and hide the manual "Biên tập Storyboard" tab/projects.

## User Review Required

> [!IMPORTANT]
> The manual Studio page will be completely removed from the sidebar. Standard/non-AI Gen projects will no longer be visible or accessible from the Dashboard. Only AI Gen projects will be shown.

## Proposed Changes

### Frontend Component & App Routing

#### [MODIFY] [App.jsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/frontend/src/App.jsx)
- Remove `🎥 Studio` list item from navigation sidebar.
- Remove the `view === "STUDIO"` conditional render block from the Content Area.
- Keep the `view === "STUDIO_AI_GEN"` view conditional render block, along with `view === "BATCH"` and the `Dashboard` fall-through.

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
- Verify clicking on a project in the Dashboard still opens in `STUDIO_AI_GEN` mode.
- Verify Studio AI Gen generates projects and they display on the Dashboard correctly.
