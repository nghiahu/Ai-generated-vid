# Design: Remove Manual Studio & Simplify Project Editor

We are removing the manual "Studio" page/view (which is for manual storyboard/script editing) from the application. We will preserve the "Studio AI Gen" page for initial script input and generation. Once generated, the app redirects the user to the Storyboard Editor. The Dashboard is simplified to show only "Video AI Gen" projects and hide the manual "Biên tập Storyboard" tab/projects.

Additionally, we are updating the Project Editor Workspace:
1. Remove all tabs (Thiết lập & Kịch bản, Biên tập Storyboard) and preview tabs inside StudioAIGen.
2. Jump directly to `WORKSPACE_EDITOR` when loading/creating a project.
3. Clean up the `StoryboardEditor` scene cards:
   - Left side: keep ONLY the 9:16 layout preview player. Remove background media suggestions, uploads, and search.
   - Right side: remove all layout inputs (Layout Family, Visual Layout, Duration, Heading, Highlight words, Themes, Points list). Keep only the Voiceover Script textarea.
   - Below the textarea, add two buttons: "Sinh lại video bằng AI" (regenerate video code using AI) and "Tạo lại giọng đọc (TTS)".

## Proposed Changes

### Frontend Component & App Routing

#### [MODIFY] [App.jsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/frontend/src/App.jsx)
- Pass `onGenerationSuccess` callback prop to `StudioAIGen` so that after AI generates the video, it redirects the view to `WORKSPACE_EDITOR`.
- Always route AIGen projects directly to `WORKSPACE_EDITOR` in `fetchProjectDetail`.
- Add `handleRegenerateSceneCode` and `regeneratingCodeSceneId` state, passing them as props to `StoryboardEditor`.
- Remove the tab navigation button elements in the Header.
- Remove the `view === "WORKSPACE_SETUP"` conditional workspace renderer block, and always render the Storyboard Editor and Master Player layout.

#### [MODIFY] [Dashboard.jsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/frontend/src/components/Dashboard.jsx)
- Remove the selector tabs (`Biên tập Storyboard` and `Video AI Gen`).
- Filter projects to only show AI Gen projects:
  ```js
  const filteredProjects = projects.filter(p => p.type === "AIGEN");
  ```
- Update the empty state text to direct the user to the Studio AI Gen page if no projects exist.

#### [MODIFY] [StudioAIGen.jsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/frontend/src/components/StudioAIGen.jsx)
- Remove tabs container (`✏️ Biên soạn Kịch bản` and `👁️ Xem trước Video`).
- Remove the `{editorMode === "preview" && ( ... )}` view block.
- Upon successful video generation, call `onGenerationSuccess(newProj.id)`.

#### [MODIFY] [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/frontend/src/components/StoryboardEditor.jsx)
- Add `onRegenerateSceneCode` and `regeneratingCodeSceneId` to components props.
- Left column of scene card: remove the entire `Unsplash Search & Suggestion Panel` and `Background Media` search/upload inputs.
- Right column of scene card: remove all fields (`Layout Family`, `Visual Layout`, `Duration`, `Heading`, `Highlight words`, `Theme`, `Accent color`, `Points list`).
- Keep the `Voiceover Script` textarea.
- Add `⚡ Sinh lại video bằng AI` and `🔊 Tạo lại giọng đọc (TTS)` buttons below the textarea.

## Verification Plan

### Manual Verification
- Run the app using `npm run dev`.
- Verify the Dashboard lists only AI Gen projects.
- Verify clicking on a project in the Dashboard opens the project editor, showing the minimized scene cards directly.
- Verify clicking `⚡ Sinh lại video bằng AI` updates the scene visuals/layout and re-renders successfully.
