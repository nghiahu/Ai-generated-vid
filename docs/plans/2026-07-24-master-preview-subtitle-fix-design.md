# Design: Master Preview Subtitle Fix

**Date:** 2026-07-24  
**Status:** Approved  
**Topic:** Render central `<DynamicSubtitle />` layer for AI-generated TSX scene components in Remotion `MainComposition.tsx` (Master Preview).

---

## 1. Problem Statement

In `my-video/src/compositions/MainComposition.tsx`, when `(scene as any).Component` (the AI-generated TSX component) was defined, `MainComposition.tsx` executed `return <Comp ... />` early, skipping the `<DynamicSubtitle />` layer rendered below. As a result, Master Preview displayed subtitles for legacy static scenes, but skipped subtitles for AI-generated scenes.

---

## 2. Proposed Architecture & System Design

### Component A: Support `<DynamicSubtitle />` for AI Components in `MainComposition.tsx`
- In `my-video/src/compositions/MainComposition.tsx`:
  - Update `if ((scene as any).Component)` block to return a React Fragment containing both `<Comp />` and `<DynamicSubtitle />`:
    ```tsx
    if ((scene as any).Component) {
      const Comp = (scene as any).Component;
      return (
        <>
          <Comp fps={30} scene={scene} subtitlesJson={scene.subtitlesJson || (scene as any).voiceoverTtsJson} />
          <DynamicSubtitle
            voiceover={scene.voiceover}
            durationSeconds={safeParseFloat(scene.duration)}
            voiceoverDuration={(scene as any).voiceoverDuration}
            subtitlesJson={scene.subtitlesJson || (scene as any).voiceoverTtsJson}
            accentColor={scene.accentColor || "#f97316"}
            visualStyle={config?.visualStyle}
          />
        </>
      );
    }
    ```

### Component B: Pass `subtitlesJson` in Master Player Mapping (`StudioAIGen.jsx`)
- In `frontend/src/components/StudioAIGen.jsx`:
  - Include `subtitlesJson: sc.subtitlesJson || sc.voiceoverTtsJson` in the scene objects passed to `MainComposition` for `previewType === "MASTER"`.

---

## 3. Verification Plan
1. **Master Preview Verification**:
   - Switch to Master Preview in Studio AI Gen, play multi-scene video, and verify synchronized Karaoke subtitles render at the bottom of every AI-generated scene.
