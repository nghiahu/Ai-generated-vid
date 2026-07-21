# Design Document: Layout Intent Auto-Matching & Strict 50% Delay Clamp

**Date:** 2026-07-21  
**Status:** Approved  
**Target Modules:** `backend/services/ai.js`, `backend/services/contractLoader.js`

---

## 1. Problem Analysis

From the user's feedback and screenshot:
1. **Delay Still Exceeding 50%**:
   - `contractLoader.js` previously preserved `pt.delay` if it was already defined (`pt.delay !== undefined ? pt.delay : computedDelay`). If AI generated a late delay (e.g. 5.5s out of 7.2s), `contractLoader.js` kept it, causing cards to stay invisible until the very end of the scene.
2. **Layout Mis-matching Scene Intent**:
   - In Scene 3 ("Agent Memory không phải là RAG"), the AI selected `AppCardConcept` (a single mobile app card layout) instead of a comparison layout (`BeforeAfterPanel`, `SplitProofBullet`, or `VersusArena`).

---

## 2. Technical Solution

### 2.1 Enforce Strict 50% Hard Clamp on All Point Delays (`contractLoader.js` & `ai.js`)
- Calculate `maxLastDelay = Number((sceneDuration * 0.5).toFixed(1))`.
- For ANY point, calculate `computedDelay = Number((0.3 + idx * step).toFixed(1))`.
- Hard clamp: `finalDelay = Math.min(pt.delay !== undefined ? pt.delay : computedDelay, maxLastDelay)`.
- **Result**: NO point delay will ever be allowed to exceed 50% of the scene duration, ensuring all elements appear early and remain visible for the entire 2nd half of the scene!

### 2.2 Layout Intent Matching Rules & Auto-Correction Engine
1. **AI Phase 1 Prompt Rules (`ai.js`)**:
   - Add explicit mapping table in Phase 1 system instruction:
     - **Comparison/Versus** (keywords: *"không phải là"*, *"so sánh"*, *"khác với"*, *"vs"*, *"versus"*): MUST select `BeforeAfterPanel`, `VersusArena`, `SplitProofBullet`, `SplitBandChecklist`.
     - **Radar/Monitoring** (keywords: *"thanh tra"*, *"giám sát"*, *"radar"*, *"quét"*, *"ops"*): MUST select `IntroRadarSignal`, `IntroMapPins`, `OpsMonitorHook`.
     - **Metrics/Stats** (keywords: *"%"*, *"tăng trưởng"*, *"tỷ lệ"*, *"doanh thu"*): MUST select `HeroMetricCards`, `MetricCards`, `GridMetrics`.
     - **Timeline/Steps** (keywords: *"bước 1"*, *"quy trình"*, *"lịch trình"*, *"giai đoạn"*): MUST select `TimelineBeamRail`, `IntroSignalSteps`.

2. **Backend Auto-Correction (`contractLoader.js`)**:
   - Add semantic text checks in `validateAndFormatSceneContent`:
   - If heading/voiceover contains comparison keywords (*"không phải là"*, *"so với"*, *"khác biệt"*, *"versus"*) AND `layoutId` is a single card layout (like `AppCardConcept` or `IntroBriefingCard`), automatically correct `layoutId` to `BeforeAfterPanel` or `SplitProofBullet`!

---

## 3. Verification Plan
- Test scene validation logic with comparison text.
- Verify point delays are clamped <= 50% duration.
