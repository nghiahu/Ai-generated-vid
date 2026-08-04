# Design: Split Video Background and Content Media

Separates the project-wide video background image (`config.bgImage`) from scene-specific content media (like phone screen or browser mockups).

## 1. Problem Description

Currently, when a user uploads/selects an image for a scene, it is automatically rendered as the full-screen background of that scene in the video. This causes two issues:
1. The background of the video changes scene-by-scene, making the overall video look disjointed.
2. In mockups (such as the smartphone in `MediaShowcaseCard` or browser mockup in `IntroMediaHero`), the image is stretched in the background instead of being shown nicely inside the mockup itself, or it is duplicated in both the mockup and the background.

## 2. Proposed Design (Approach 1: Custom Event + Unified Modal)

We will cleanly split these two concerns:
- **Foreground/Content Media** will be selected in the individual scene cards and rendered *inside* the mockup components (e.g. phone screen, browser frame).
- **Background Image** will be chosen in the Video Setup config sidebar on the right and rendered as the global background of the video screen.

### 2.1. Frontend Changes

1. **`SidebarConfig.jsx`**:
   - Render a new "Video Background Image" section below BGM and above Watermark.
   - If a background image is set, display its thumbnail with "Change" and "Remove" buttons.
   - Clicking "Change" triggers a custom event: `window.dispatchEvent(new CustomEvent("open-bg-image-modal"))`.
   - Clicking "Remove" sets `config.bgImage` to `null`/`""`.

2. **`StoryboardEditor.jsx`**:
   - Listen to `"open-bg-image-modal"` via a React `useEffect` listener.
   - When triggered, open the existing media selection modal with `mediaModalContext = "project-background"`.
   - Initialize the modal's `selectedMedia` with the current `config.bgImage` if present.
   - Add `onUpdateConfig` prop to `StoryboardEditor`.
   - In `handleMediaModalConfirm`, if `mediaModalContext === "project-background"`, update the configuration via `onUpdateConfig({ ...config, bgImage: selectedUrl })`.

3. **`App.jsx`**:
   - Pass `onUpdateConfig={handleUpdateConfig}` (or `setDraftConfig` for new drafts) to `<StoryboardEditor />` instances.

### 2.2. Video Renderer (`my-video`) Changes

1. **`MainComposition.tsx`**:
   - Pass the global `config` object to the `<DynamicLayout />` instance rendering each scene.

2. **`DynamicLayout.tsx`**:
   - Add `config?: any` to `DynamicLayoutProps`.
   - In `renderBackground()`, retrieve `const globalBgImage = config?.bgImage;`.
   - If `globalBgImage` is set, render it as the full-screen background image.
   - Stop using the scene-specific `imageUrl` as the screen background.

3. **`IntroMediaHeroMode.tsx`**:
   - Update macOS mockup container: if `imageUrl` is set (and is not a default background/invalid url), render the image inside the macOS browser mock content area.
   - Fall back to the default `renderMockWebUI()` app interface if no image is present.

4. **`MediaShowcaseCardMode.tsx`**:
   - Update smartphone mockup container: if `imageUrl` is set (and is not a default background/invalid url), render the image inside the smartphone screen area.
   - Fall back to the default `renderMockAppUI()` interface if no image is present.
