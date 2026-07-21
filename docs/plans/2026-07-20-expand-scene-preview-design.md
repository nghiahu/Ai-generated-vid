# Expand Scene Preview Screen Design

**Goal:** Increase the width and height of the inline scene preview player cards inside the Storyboard Editor list view to improve readability and detail of the layout designs.

## Background Context
Now that the editor menu sidebar has been removed, the editor workspace has significantly more horizontal space. The current scene preview card is hardcoded to a width of `192px`, resulting in a tiny video player. The user wants the preview to be expanded so they can clearly inspect layout styles and text inside each scene.

## Proposed Design
In `frontend/src/components/StoryboardEditor.jsx`, locate the `Left Side: 9:16 Layout Preview Card` wrapper div (around line 1839).
Change `width: "192px"` to `width: "280px"`.
Since the card has `aspectRatio: "9/16"`, the height will dynamically scale from `341px` to `497px`.

## Success Criteria / Verification
1. The inline scene preview player is noticeably larger in the editor list.
2. Text and layout designs inside the preview are clearly legible.
3. Right-side inputs still fit comfortably and scale gracefully in the remaining workspace.
