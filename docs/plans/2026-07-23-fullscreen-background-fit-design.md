# Design Document: Fullscreen Background Height & Cover Fix

**Date**: 2026-07-23  
**Status**: Proposed / Pending Approval  

---

## 1. Overview & Problem Statement

In video composition scenes (specifically Scene 1), background images and mode containers do not stretch to fill the full 1080x1920 portrait canvas (9:16). Instead, they are cut off around the upper ~50% of the viewport height, leaving a stark white area in the bottom half.

### Root Causes
1. **`objectFit: "contain"` on Landscape Images**: In [DynamicLayout.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/DynamicLayout.tsx#L138-L153), the primary background image uses `objectFit: "contain"`. When a 16:9 landscape image is loaded on a 9:16 portrait viewport (1080x1920), its height scales down to ~607px, leaving ~1313px of empty white canvas below.
2. **Hardcoded Height Restrictions in Mode Renderers**: In mode renderers such as [HustXRikkeiMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/HustXRikkeiMode.tsx#L75-L88), background container height is hardcoded to `1621px` instead of spanning the full `1920px` canvas (`100%`).

---

## 2. Proposed Changes & Technical Architecture

### Component 1: `DynamicLayout.tsx` Background Renderer
- Change `objectFit: "contain"` to `objectFit: "cover"` for scene background images.
- Enforce full-bleed positioning: `position: "absolute"`, `inset: 0`, `width: "100%"`, `height: "100%"`.
- Maintain `objectFit: "cover"` on blurred backdrops to guarantee 100% canvas coverage under all aspect ratios.

### Component 2: Mode Renderers (`HustXRikkeiMode.tsx` & layout modes)
- Remove hardcoded height limits (`height: "1621px"`).
- Set background container dimensions to `width: "100%"`, `height: "100%"`, `inset: 0`.

### Component 3: Gradient Contrast Overlay (`TemplateLayout.tsx` & `DynamicLayout.tsx`)
- Ensure contrast overlays (`linear-gradient`) cover `inset: 0` (`100% height`) so text elements are legible over full-height background images.

---

## 3. Verification Plan

### Manual Verification
1. Open the Remotion Master Player in the web application.
2. Preview Scene 1 with 16:9 landscape images as well as portrait images.
3. Confirm that the background image and overlay stretch smoothly across the entire 1080x1920 vertical canvas with zero white gaps at the bottom.
