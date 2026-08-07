# Design Doc: Metric Showcase Hook Header Spacing and Subtitle Enhancements

**Date:** 2026-08-07
**Author:** Antigravity

## Context & Requirements
In the `MetricShowcaseHook` layout:
1. **Header Spacing/Clipping:** The header text line height is too small (`0.95`), causing line overlaps and clipping the top of uppercase characters with Vietnamese accents/diacritics (e.g., `Ỷ`, `Ê`, `Ấ`).
2. **Subtitle Size:** The subtitle font size at the bottom needs to be larger for better readability.
3. **Subtitle Color:** The active highlighted word in the subtitle should match the dynamic theme color of the video (e.g. blue for `ai_hub_grid`) rather than hardcoded or static values.

---

## Proposed Changes

### 1. Header Layout Styling Fixes
We will increase the `lineHeight` of the title text in `MetricShowcaseHookMode.tsx` to `1.15` and add a small top padding to give diacritics ample room to render without getting clipped at the top of the line box.

**File:** [MetricShowcaseHookMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/MetricShowcaseHookMode.tsx)
- Change `lineHeight` inside the title style block from `0.95` to `1.15`.
- Add `paddingTop: "12px"` to the title style block.

### 2. Subtitle Font Size Increase
We will update the template configuration to increase the subtitle font size to `56px`.

**File:** [metric_showcase_hook.json](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/templates/Opening-Headline/metric_showcase_hook.json)
- Change `"subtitle": { "fontSize": "44px" }` to `"fontSize": "56px"`.

### 3. Dynamic Subtitle Color Integration
We will update `MainComposition.tsx` to pass the resolved VDE theme accent color dynamically to `DynamicSubtitle` in both render branches.

**File:** [MainComposition.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/MainComposition.tsx)
- Pass `vdeTokens.colors.accent` to `DynamicSubtitle`'s `accentColor` prop in both standard and custom rendering branches.

---

## Verification Plan

### Manual Verification
1. Run the local composition server using `npm run dev` in the frontend and `my-video` directory.
2. Verify in the Remotion preview player that:
   - The header text lines in `MetricShowcaseHook` do not overlap, and diacritics are completely visible.
   - The crawling subtitle text is larger (`56px`).
   - The active word highlight color updates dynamically and matches the theme (e.g., bright blue/cyan for `ai_hub_grid`).
