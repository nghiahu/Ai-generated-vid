# Rearrange Scene Editor Card Layout Design

**Goal:** Reorganize the elements inside each scene editor card in the Storyboard Editor to optimize spatial usage, eliminate empty space below the scene preview, and make the interface look balanced and professional.

## Background Context
With the menu sidebar removed and the preview player expanded to `280px` width (with a height of `497px`), there is a large empty column of white space below the preview player on the left side of the scene card. Meanwhile, the right column is very tall because it contains all configuration inputs, points, voiceover, and media controls. Moving the Background Media section to the left column (below the preview card) will perfectly balance the layout, as the media search and thumbnails fit a narrow column naturally, while keeping the voiceover script textarea wide on the right.

## Proposed Design
In `frontend/src/components/StoryboardEditor.jsx`, we will:
1. Move the **Background Media** block (Unsplash search panel, upload button, and horizontal scrolling thumbnails list) from the bottom of the right-side inputs column to the left column, directly below the **Preview (9:16)** player container.
2. Group the Left Column elements inside `<div style={{ width: "280px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "16px" }}>`.
3. Keep the Right Column elements (Layout Family, Visual Layout, Duration, Heading, Keywords, Theme, Accent Color, Points list, and Voiceover Script textarea) in the right-hand container with `flex: 1`.

This achieves a highly balanced layout:
- Left Column: Preview (9:16) + Background Media search and list.
- Right Column: Editing settings, Points lists, and Voiceover Script.

## Success Criteria / Verification
1. The large empty space under the preview player is filled with the Background Media search and list controls.
2. The scene editor card layout is balanced and compact, reducing overall card height.
3. Background media search and thumbnail selection work correctly.
