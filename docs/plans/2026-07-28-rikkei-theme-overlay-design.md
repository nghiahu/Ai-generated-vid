# Design Doc: Removing Dark Overlay from Rikkei Theme Video Background

Date: 2026-07-28

## Context & Problem
In the video player mockup for the "rikkei" theme, the background image is covered by a muddy, dark overlay gradient. This happens because:
1. In `vde_themes.json`, `rikkei` defines its background as a gradient string: `"background": "linear-gradient(135deg, #FFFFFF 0%, #FFF2F4 50%, #FFE6E9 100%)"`.
2. `hexToRgb` inside `DynamicLayout.tsx` fails to parse gradient strings and falls back to a very dark color (`"6, 8, 19"`).
3. The renderer applies this fallback color as a dark overlay with `mixBlendMode: "multiply"` because Rikkei is classified as a light theme, resulting in a dark muddy look.

## Proposed Changes

### [my-video](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video)

#### [MODIFY] [DynamicLayout.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/DynamicLayout.tsx)
1. Skip rendering the overlay `AbsoluteFill` element when the theme is `"rikkei"`.
2. Enhance `hexToRgb` to search for and extract the first hex color from gradient strings, so it correctly falls back to white or the gradient's start color instead of a dark default.

```tsx
// Exclude overlay for Rikkei theme
{layoutType.toLowerCase() !== "blank" && !isRikkei && (
  <AbsoluteFill style={{ 
    background: overlayGradient, 
    zIndex: 1,
    mixBlendMode: isFullImageBg ? undefined : (isLight ? "multiply" : "normal")
  }} />
)}
```

## Verification Plan
1. Check the frontend preview of a video generated with the "rikkei" theme.
2. Confirm the background image is bright, clear, and doesn't have any dark gradient overlay.
