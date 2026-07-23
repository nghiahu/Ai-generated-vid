# Design: Auto Switch to Workspace Editor on AI Generation Complete

## Overview
Currently, after AI video generation completes in `StudioAIGen`, the interface remains in `StudioAIGen` (Image 1) showing a compact scene list and side preview. 
This design updates the application flow so that upon completing AI video generation, the UI automatically transitions to the full **Workspace Editor (`WORKSPACE_EDITOR`)** view (Image 2), giving users immediate access to individual scene parameters, full timeline controls, TTS regeneration, and Master Preview rendering.

## Design Details

### 1. `StudioAIGen.jsx`
- Add callback prop `onComplete` (or `onOpenEditor`).
- In `handleGenerate()`, after successfully generating all scenes for the project plan:
  ```js
  if (onComplete) {
    onComplete(activeProjId);
  }
  ```

### 2. `App.jsx`
- Pass `onComplete` prop to `<StudioAIGen />`:
  ```jsx
  <StudioAIGen
    projectId={selectedProjectId}
    onBack={() => { setSelectedProjectId(null); setView("PROJECTS"); }}
    onUpdateProjectsList={fetchProjects}
    onComplete={async (projId) => {
      await fetchProjects();
      setSelectedProjectId(projId);
      await fetchProjectDetail(projId);
      setView("WORKSPACE_EDITOR");
    }}
  />
  ```
- Update `fetchProjectDetail(id)`:
  When opening an existing `AIGEN` project that already has scenes generated (`project.scenes && project.scenes.length > 0`), route to `"WORKSPACE_EDITOR"` instead of staying in `"STUDIO_AI_GEN"`.

## Verification Plan
1. Trigger AI video generation from `StudioAIGen`.
2. Ensure that once generation finishes, the app seamlessly transitions to the full Storyboard Editor view (Image 2).
3. Ensure selecting an AI-generated project from the Projects list opens directly in the Storyboard Editor view.
