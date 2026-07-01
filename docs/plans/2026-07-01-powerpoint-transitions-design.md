# Design Doc: PowerPoint-Style Block Animations & AI-Driven Synchronized Transitions

## Goal
Implement a system of customizable, PowerPoint-style entrance animations (e.g., Slide Up, Scale In, Fade In, Blur In, Slide Left/Right) for text and UI blocks in Remotion. The transitions will be automatically suggested and timed by the Gemini AI based on the voiceover text, and users will be able to manually edit the animation type and timing/delay for each block directly from the frontend editor.

## Background & Rationale
Currently, all elements in a scene (e.g. Title, Terminal commands, Metrics, Badge rows, Feature cards) render statically at the start of the scene. In high-quality vertical videos (like the OmniVoice Studio introduction video), elements appear progressively (staggered) as they are mentioned in the voiceover audio, using smooth animation curves (like spring-physics slides and scales). This design outlines how to add preset animation effects, enable Gemini to configure them, update Remotion to render them, and build a slide-editor-like interface for user customization.

## Proposal

### 1. Data Schema & Compatibility
No database migration is required. The `points` column in the `scenes` table is a `JSONB` array. We will support both existing text array formats (backward compatibility) and a new object-based format:

**New format for elements in the `points` array:**
```json
{
  "text": "Nội dung chữ hiển thị",
  "animation": "slide-up" | "scale-in" | "fade-in" | "blur-in" | "slide-left" | "slide-right",
  "delay": 1.5 // offset in seconds from the start of the scene (float)
}
```

*   **Heuristic Fallback**: When reading points in the frontend or rendering them in Remotion, if a point is a string rather than an object, it will be treated as:
    ```javascript
    {
      text: pointString,
      animation: "slide-up",
      delay: index * 1.5
    }
    ```

### 2. Gemini AI Prompt Updates
Modify `backend/services/ai.js` to change the requested schema for the `points` array.
*   **Prompt Specification**: Update the prompt to ask Gemini to output `points` as objects with `text`, `animation`, and `delay` fields.
*   **Timing Optimization**: Instruct Gemini to distribute the `delay` values based on when those points are mentioned in the `voiceover` text, ensuring that `delay` is less than `duration` of the scene.

### 3. Remotion Animation Engine
Create a reusable component [AnimatedBlock](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/components/layout/AnimatedBlock.tsx) in the Remotion project:
*   Utilize Remotion's `spring` and `interpolate` APIs for frame-by-frame styling.
*   Implement 6 animation styles:
    *   `slide-up`: translate y from `80` to `0` with spring stiffness, combined with spring opacity.
    *   `scale-in`: scale from `0.5` to `1` with a bouncy spring config, combined with spring opacity.
    *   `fade-in`: smooth linear opacity transition over 15 frames.
    *   `blur-in`: blur filter transition from `25px` to `0px` over 15 frames, combined with linear opacity.
    *   `slide-left`: translate x from `150` to `0` with spring.
    *   `slide-right`: translate x from `-150` to `0` with spring.

In [DynamicLayout.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/DynamicLayout.tsx), wrap each UI block item (except the scene title which can have its own default slide-up/fade animation) inside `AnimatedBlock` using the block's `animation` and `delay` fields.

### 4. Frontend UI (Storyboard Editor)
In [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx):
*   Replace the raw points textarea with an interactive list of blocks.
*   For each block, render:
    *   A text input to change `text`.
    *   A select dropdown to choose `animation`.
    *   A slider input to adjust `delay` (range `0` to `scene.duration` seconds, step `0.1`s) with a real-time number display.
    *   Buttons to delete a block, add a new block, or drag/reorder blocks (optional, simple up/down buttons).

## Verification Plan

### Automated Verification
*   Verify that backend storyboard API successfully runs and parses the updated scene objects schema returned by Gemini.
*   Ensure that the Remotion preview does not crash when parsing both string-based and object-based points.

### Manual Verification
*   Verify in the frontend editor that sliders and dropdowns successfully update the state and database.
*   Play the video inside the Remotion preview and confirm that elements stagger-animate into the frame exactly according to their set delay and selected animation type.
