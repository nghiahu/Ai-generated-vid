# Design Document: Font Rendering Fix in Exported Videos

## Goal & Background
When previewing the video in the browser player, the fonts look correct because they inherit global fonts loaded in the main frontend player app (like Space Grotesk or Be Vietnam Pro). However, when exporting/rendering using headless Chrome via Remotion (`npx remotion render`), the font family falls back to the system serif font (like Times New Roman) for body texts and headings that use un-downloaded fonts or missing weights (like regular `400` or `500`). 

This document proposes importing and loading missing font assets (Space Grotesk, weights 400/500 for existing fonts), mapping font configurations to loaded variables dynamically, and enforcing inheritance of `fontFamily` from the top-level layout wrapper.

## Proposed Changes

### [my-video/src/styles/fonts.ts](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/styles/fonts.ts)
* Load `Space Grotesk` font family since it is configured in `vde_themes.json` but never loaded.
* Load `400` and `500` weights for `Be Vietnam Pro`, `Montserrat`, and `Space Grotesk` to support regular body text rendering.

### [my-video/src/styles/themes.ts](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/styles/themes.ts)
* Map theme-configured font family strings (like `"Space Grotesk, sans-serif"`, `"Be Vietnam Pro"`, etc.) dynamically to the loaded font variables.

### [my-video/src/compositions/layouts/TemplateLayout.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/TemplateLayout.tsx)
* Pass `styles.fontFamily` to the wrapper `div` of `TemplateLayout` content (`containerStyle`) so child layout components inherit the correct font.

## Verification Plan
1. Check the local Remotion Studio preview to ensure fonts render correctly.
2. Render/export a video locally to confirm the final `.mp4` file does not suffer from fallback serif font errors for headings, paragraph text, and badges.
