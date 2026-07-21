# Remove Sidebar from Storyboard Editor Design

**Goal:** Remove the redundant sidebar (SideNavBar) containing "Projects", "Media", "Timeline", "Effects", "Audio" from the Storyboard Editor layout in `App.jsx` to maximize workspace area and expand the scene preview player screen.

## Background Context
Inside the `Biên tập Storyboard` (WORKSPACE_EDITOR) view, there is a left sidebar menu (`SideNavBar`) that has no function because editing is done directly in the storyboard editor list. The user wants to remove this sidebar entirely so that the storyboard editor cards (with their inline scene previews) can expand and utilize the extra horizontal space for better visibility.

## Proposed Design
In `frontend/src/App.jsx`, delete the `<nav>` component and its contents inside the `WORKSPACE_EDITOR` conditional block (lines 605-645).
The layout wrapper uses `flex: 1` on the StoryboardEditor column, which will automatically expand to occupy the space vacated by the 256px wide sidebar.

## Success Criteria / Verification
1. The sidebar menu is no longer visible in the Editor mode.
2. The storyboard editor takes up the entire space between the left edge and the right preview player column.
3. The inline scene preview players are larger and clearly visible.
4. The page compiles and renders without errors.
