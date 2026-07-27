# Design: Dynamic User Watermark & Remove Hardcoded "AI LAB" Override

**Date:** 2026-07-23  
**Status:** Approved  
**Topic:** Honor user watermark settings (enabled/disabled, custom text, position) in Remotion `MainComposition.tsx` and eliminate hardcoded `"AI LAB"` watermark overrides.

---

## 1. Problem Statement

In `my-video/src/compositions/MainComposition.tsx`, lines 346–367 contained hardcoded watermark override logic:
```tsx
{(!config?.watermark?.text || config.watermark.text === "yupclip.com") 
  ? "AI LAB" 
  : config.watermark.text}
```
When viewing Master Preview with theme `ai_hub_grid`, if `watermark.text` was `"yupclip.com"` or default, the composition forcibly rendered `"AI LAB"` in cyan/blue font at the bottom center of the video regardless of user intent.

---

## 2. Proposed Architecture & System Design

### Component A: Clean Conditional Watermark Overlay (`MainComposition.tsx`)
- In `my-video/src/compositions/MainComposition.tsx`:
  - Check `config?.watermark?.enabled`. If `false`, render `null` (100% hidden).
  - Remove all `"AI LAB"` hardcoded strings.
  - Render user's explicit `config?.watermark?.text` (or fallback to empty if none set).
  - Support positional placement (`top-right`, `top-left`, `bottom-right`, `bottom-left`).

### Component B: Watermark State Passing (`StudioAIGen.jsx`)
- Ensure `config.watermark` object in `StudioAIGen.jsx` (including `enabled`, `text`, `position`) is correctly included in the project configuration passed to `MainComposition.tsx` during Master Preview rendering.

---

## 3. Verification Plan
1. **Disabled Watermark Test**:
   - Set `watermark.enabled = false` and verify Master Preview renders 0 watermark elements.
2. **Custom Text Test**:
   - Set `watermark.text = "My Channel Brand"`, verify Master Preview displays "My Channel Brand" without any "AI LAB" text.
