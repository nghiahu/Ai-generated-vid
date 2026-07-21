# Design Document: Rikkei Light Theme Default Fix

## Problem Statement
When viewing video storyboards, the preview unexpectedly defaults to a dark background (`#090d1a`) with dark particle/bokeh overlays, even when users expect the bright Rikkei Academic (`rikkei`) design system (clean `#ffffff` background, `#FAF5F5` card containers, and `#A8232A` crimson accents).

## Root Causes
1. `my-video/src/compositions/MainComposition.tsx` computes `hasOverlayEffects` without excluding `"rikkei"`, causing dark `LightLeaksOverlay` and `EmberSparksOverlay` to draw over the light theme background.
2. `getVDETokens` in `my-video/src/styles/vdeTokens.ts` defaults to `VDE_TOKENS.minimal` when `styleName` is undefined or omitted.
3. Projects missing explicit `visualStyle` properties in their `config` fallback to dark default themes instead of `"rikkei"`.

## Design Decisions

### 1. Remotion MainComposition Overlay Exclusion
In `my-video/src/compositions/MainComposition.tsx`:
Exclude `"rikkei"` from `hasOverlayEffects`:
```tsx
const hasOverlayEffects = vdeStyle !== "claude" && vdeStyle !== "light" && vdeStyle !== "apple" && vdeStyle !== "rikkei";
```

### 2. Token Fallback Alignment
In `my-video/src/styles/vdeTokens.ts`:
Update `getVDETokens`:
```ts
if (!styleName) return VDE_TOKENS.rikkei || VDE_TOKENS.minimal;
```
And in key lookups, ensure `VDE_TOKENS.rikkei` is preferred as the primary default style.

### 3. Frontend App Config Default
In `frontend/src/App.jsx` and project configuration initializers:
Ensure any project missing `config.visualStyle` defaults to `"rikkei"`.

## Verification Plan
1. Launch/Refresh the preview player in `frontend`.
2. Confirm the background renders clean white (`#ffffff`).
3. Verify cards render in Rikkei Academic style with `#A8232A` crimson accents.
4. Confirm no dark particles or ember spark overlays obscure the clean light layout.
