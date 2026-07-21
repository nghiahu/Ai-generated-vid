# Design Document: Fix Blank Layout Render & Complete Layout Family Mapping

**Date:** 2026-07-21  
**Status:** Approved  
**Target Files:** `my-video/src/compositions/layouts/modes/*`, `frontend/src/components/StoryboardEditor.jsx`

---

## 1. Root Cause Analysis

1. **Blank Screen Render Bug (`return null`)**:
   - In mode renderers (`SplitHorizontalMode`, `BeforeAfterPanelMode`, `OpsMonitorMode`, `IntroBriefingCardMode`, `IntroRadarSignalMode`, `IntroSignalStepsMode`, `IntroMapPinsMode`), if `otherComps` (points) was empty or loading, the renderer did `if (!leftComp) return null;`.
   - Returning `null` caused the entire layout container to render 0 DOM nodes — resulting in a pitch-black/empty preview screen with only background particles!
   - Manually toggling the dropdown forced frontend state re-evaluation and auto-backfilling of points, which is why manual switching fixed it.

2. **Missing Layout Families in Frontend Dropdown (`StoryboardEditor.jsx`)**:
   - `LAYOUTS_BY_FAMILY` in `StoryboardEditor.jsx` had `Comparison / Table`, `Data / Metrics`, `Timeline` as empty arrays `[]`.
   - When a comparison layout (e.g. `BeforeAfterPanel`) was loaded, `normalizeFamily()` failed to find it in those empty families, defaulting to `Opening / Headline` and causing layout selection bugs.

---

## 2. Technical Solution

### 2.1 Fallback Safe Components in Mode Renderers
- In all mode renderers, replace `if (!leftComp) return null;` with a safe fallback array:
  ```typescript
  const safeComps = otherComps.length > 0
    ? otherComps
    : [{ type: "card", data: { text: heading || "Nội dung phân cảnh" } }];
  ```
- This ensures that NO scene preview will EVER render a blank/empty screen under any circumstances.

### 2.2 Complete `LAYOUTS_BY_FAMILY` Mapping in `StoryboardEditor.jsx`
- Populate `LAYOUTS_BY_FAMILY` with all 39 active layout templates grouped into their proper families:
  - **Comparison / Table**: `BeforeAfterPanel`, `VersusArena`, `SplitProofBullet`, `SplitBandChecklist`.
  - **Data / Metrics**: `OpsMonitorHook`, `HeroMetricCards`, `MetricCards`, `GridMetrics`, `EarningsSnapshotHook`, `CandlestickBreakoutHook`, `IntroMetricPillImage`.
  - **List / Steps**: `AIHubGrid1`, `RankedImpactBullet`, `SelectorWheelRadio`, `SignalRailBullet`.
  - **Timeline / Steps**: `TimelineBeamRail`, `IntroSignalStepsImages`, `IntroEvidenceTimelineImage`, `FlowchartTitle`.
  - **Opening / Headline**: `IntroBriefingCard`, `IntroBubbleImage`, `IntroCutoutHeadlineImage`, `IntroFullImage`, `IntroMapPinsImage`, `IntroRadarSignalImage`, `AppCardConcept`, `AppShowcaseTitle`, `BroadcastLowerThirdTitle`, `CaseStudyEditorial`, `DossierNotes`, `EvidenceBoardConcept`, `FearGreedHook`, `FeedScrollHook`, `IntroChapterStack`, `IntroEvidenceReadlineImage`, `IntroEvidenceScanlineImage`.
  - **Ending**: `BottomAnchorOutro`, `BrandOutro`, `CenterLineOutro`, `HustXRikkei`, `ContactCardEnding`, `Ending`, `Launch`, `Minimal`, `NextStepEnding`.

---

## 3. Verification Plan
- Verify scene with 0 points renders safe card content instead of blank screen.
- Verify `BeforeAfterPanel` appears under `Comparison / Table` in Storyboard Editor dropdown.
- Verify selecting any layout immediately updates video preview.
