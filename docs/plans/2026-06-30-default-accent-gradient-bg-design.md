# Design Doc: Default Background Accent Gradient Selection

## Goal
Add a default background selection option for scenes that replaces background images/videos with an animated glassmorphic gradient utilizing the scene's current Accent Color (Accent HEX).

## Background & Rationale
Currently, each scene requires a background image (fetched from Unsplash). If no image is selected, it falls back to a plain checkerboard pattern in the editor UI, and the video renders with a static, generic theme background. 
This feature adds a premium "Default Accent HEX Gradient" option. It allows scenes to display an animated gradient color scheme driven by the Accent HEX color input, creating a transparent, glowing aura that feels modern and matches the visual theme.

## Proposal

### 1. Database Schema
Ensure the `scenes` table persists the `theme` and `accent_color` properties, which were previously missing from DB synchronization.
*   **Columns to add:**
    *   `theme` VARCHAR(100) DEFAULT 'default'
    *   `accent_color` VARCHAR(50) DEFAULT '#FFB7C5'
*   **Alter queries in `initDb()` (`backend/services/db.js`):**
    ```sql
    ALTER TABLE scenes ADD COLUMN IF NOT EXISTS theme VARCHAR(100) DEFAULT 'default';
    ALTER TABLE scenes ADD COLUMN IF NOT EXISTS accent_color VARCHAR(50) DEFAULT '#FFB7C5';
    ```

### 2. Frontend UI
In `StoryboardEditor.jsx`:
*   In the media list carousel, prepend a virtual option representing "Default (Accent HEX)".
*   If selected, set `scene.selectedMediaIndex = -1`.
*   In the 9:16 Preview, if `selectedMediaIndex === -1`, display a CSS gradient preview:
    ```css
    background: linear-gradient(180deg, #090d1a 0%, ${accentColor}44 100%)
    ```
    with a glowing circular element inside.

### 3. Video Render (Remotion)
Create `my-video/src/components/overlays/AccentGlowBackground.tsx`:
*   Converts HEX accent color to RGBA using a helper.
*   Renders a base dark container (`#090d1a` or theme equivalent) with two absolutely positioned circles blurring outward (`filter: blur(130px)`) with opacity around 15%.
*   Animates the positions and scale of these circles using `useCurrentFrame` and `interpolate` to produce a slow, flowing/transitioning visual effect.
*   Integrate this background into all layout compositions (`IntroProfile`, `SplitGrid`, `GithubStatusHook`) when `selectedMediaIndex === -1`.
