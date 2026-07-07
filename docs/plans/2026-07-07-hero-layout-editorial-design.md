# Design Document: Hero Title Editorial Layout Upgrade
**Date**: 2026-07-07  
**Topic**: Implement a high-fidelity editorial magazine layout for Hero (opening) scenes in 9:16 vertical video mode

## 1. Goal Description
The purpose of this update is to redesign the `HeroLayout` when in vertical (9:16) mode to feel like a premium technology editorial magazine. This involves placing a progress indicator at the top, rendering a very large bold title (72px-80px), drawing a stylized horizontal accent colored line, and positioning subtitle captions cleanly at the bottom.

---

## 2. Proposed Changes

### A. Layout Structure (`my-video/src/compositions/layouts/opening/HeroLayout.tsx`)
In `HeroLayout.tsx`, if the video is vertical (`isVertical = true`):
- Render a header overlay containing:
  - Left: Progress pill indicator `● INTRO`
  - Right: Category tag based on the visual theme (e.g. `DEVELOPMENT`, `MARKETING`).
- Render the `title` and `subheader` components centered but pushed higher.
- Underneath the title, render a stylized horizontal line of 80px width, 4px height, with the theme's `accentColor`.
- Leave the bottom clean for subtitles.

---

## 3. Verification Plan
- **Syntax check**: Verify compilation via `npx tsc --noEmit`.
- **Unit/Scratch Test**: Verify correct rendering via storyboard preview in the frontend.
