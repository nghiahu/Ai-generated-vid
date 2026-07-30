# Timeline Layouts Missing Templates Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Create the missing template files for `TimelineBeamRail` and `TimelineChapters` and fix the key overrides registration so they render properly in the video preview instead of showing a blank screen.

**Architecture:**
- Remove the legacy override key `timelinechapters: "Timeline"` from `my-video/src/compositions/layouts/index.ts` so that `TimelineChapters` registers with its correct ID.
- Create two new JSON templates under `my-video/src/compositions/layouts/templates/Timeline/`:
  1. `timeline_beam_rail.json` (ID: `TimelineBeamRail`, layoutMode: `evidence_timeline`)
  2. `timeline_chapters.json` (ID: `TimelineChapters`, layoutMode: `timeline_shift`)

---

### Task 1: Fix registry overrides and create templates

**Files:**
- Modify: `my-video/src/compositions/layouts/index.ts` (remove `timelinechapters: "Timeline"`)
- Create: `my-video/src/compositions/layouts/templates/Timeline/timeline_beam_rail.json`
- Create: `my-video/src/compositions/layouts/templates/Timeline/timeline_chapters.json`

**Step 1: Write `timeline_beam_rail.json`**
```json
{
  "id": "TimelineBeamRail",
  "name": "Timeline Beam Rail",
  "family": "timeline",
  "layoutMode": "evidence_timeline",
  "container": {
    "paddingTop": "220px",
    "maxWidth": "920px",
    "gap": "28px"
  },
  "categoryPill": null,
  "accentDivider": null,
  "title": {
    "fontSize": "86px",
    "fontWeight": "950",
    "letterSpacing": "-0.05em",
    "marginBottom": "60px",
    "useAccentTextShadow": true
  },
  "positions": [],
  "items": {
    "rotations": [0],
    "itemStyles": [
      {
        "v2": true,
        "fontSize": "24px",
        "fontWeight": "800",
        "borderRadius": "24px",
        "padding": "24px",
        "scale": 1.0,
        "backdropBlur": "12px",
        "useAccentBg": false,
        "useAccentBorder": false,
        "useAccentShadow": false,
        "useSubtleThemeBg": true,
        "useThemeBorder": true
      }
    ]
  },
  "subtitle": {
    "bottom": "28px",
    "fontSize": "46px",
    "fontWeight": "950",
    "useThemeTextShadow": true
  }
}
```

**Step 2: Write `timeline_chapters.json`**
```json
{
  "id": "TimelineChapters",
  "name": "Timeline Chapters",
  "family": "timeline",
  "layoutMode": "timeline_shift",
  "container": {
    "paddingTop": "260px",
    "maxWidth": "960px",
    "gap": "24px"
  },
  "categoryPill": null,
  "accentDivider": null,
  "title": {
    "fontSize": "86px",
    "fontWeight": "950",
    "letterSpacing": "-0.05em",
    "marginBottom": "60px",
    "useAccentTextShadow": true
  },
  "positions": [],
  "items": {
    "rotations": [0],
    "itemStyles": [
      {
        "v2": true,
        "fontSize": "26px",
        "fontWeight": "800",
        "borderRadius": "24px",
        "padding": "24px",
        "scale": 1.0,
        "backdropBlur": "8px",
        "useAccentBg": false,
        "useAccentBorder": true,
        "useAccentShadow": false,
        "useSubtleThemeBg": true,
        "useThemeBorder": true
      }
    ]
  },
  "subtitle": {
    "bottom": "28px",
    "fontSize": "46px",
    "fontWeight": "950",
    "useThemeTextShadow": true
  }
}
```

---

### Task 2: Verify compiling and rendering

**Files:**
- Run `npm run build` inside `my-video` folder to ensure it bundles with no errors.
- Test in the browser by selecting the layout dropdown options.
