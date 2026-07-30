# Metric Layouts Missing Templates Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Create the missing template files for `GridMetrics`, `MetricCards`, and `HeroMetricCards` to prevent them from displaying blank screens in the video preview.

**Architecture:** 
- Add three new JSON configuration files under `my-video/src/compositions/layouts/templates/Data-Metrics/`:
  1. `grid_metrics.json`
  2. `metric_cards.json`
  3. `hero_metric_cards.json`
- All three templates will use the existing `grid_metrics` layout mode (rendered by `GridMetricsMode.tsx`), but will differ in their visual card styling (e.g. HeroMetricCards will highlight the first card as a hero card with the accent background color).

**Tech Stack:** JSON, Remotion Layout Templates

---

### Task 1: Create the template files

**Files:**
- Create: `my-video/src/compositions/layouts/templates/Data-Metrics/grid_metrics.json`
- Create: `my-video/src/compositions/layouts/templates/Data-Metrics/metric_cards.json`
- Create: `my-video/src/compositions/layouts/templates/Data-Metrics/hero_metric_cards.json`

**Step 1: Write `grid_metrics.json`**
```json
{
  "id": "GridMetrics",
  "name": "Grid Metrics",
  "family": "data",
  "layoutMode": "grid_metrics",
  "container": {
    "paddingTop": "320px",
    "maxWidth": "920px",
    "gap": "24px"
  },
  "categoryPill": null,
  "accentDivider": null,
  "title": {
    "fontSize": "84px",
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

**Step 2: Write `metric_cards.json`**
```json
{
  "id": "MetricCards",
  "name": "Metric Cards",
  "family": "data",
  "layoutMode": "grid_metrics",
  "container": {
    "paddingTop": "320px",
    "maxWidth": "920px",
    "gap": "24px"
  },
  "categoryPill": null,
  "accentDivider": null,
  "title": {
    "fontSize": "84px",
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
        "useAccentShadow": true,
        "useSubtleThemeBg": true,
        "useThemeBorder": false
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

**Step 3: Write `hero_metric_cards.json`**
```json
{
  "id": "HeroMetricCards",
  "name": "Hero Metric Cards",
  "family": "data",
  "layoutMode": "grid_metrics",
  "container": {
    "paddingTop": "320px",
    "maxWidth": "920px",
    "gap": "24px"
  },
  "categoryPill": null,
  "accentDivider": null,
  "title": {
    "fontSize": "84px",
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
        "useAccentBg": true,
        "useAccentBorder": true,
        "useAccentShadow": true,
        "useSubtleThemeBg": false,
        "useThemeBorder": false
      },
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

### Task 2: Verify compiling and registry mapping

**Files:**
- Modify: `my-video/src/compositions/layouts/index.ts` (touch to force reload)

**Step 1: Verify dynamic compilation**
Run: `npm run build` inside `my-video` folder to ensure it bundles with no errors.

**Step 2: Commit**
```bash
git add my-video/src/compositions/layouts/templates/Data-Metrics/
git commit -m "feat: add grid_metrics, metric_cards, and hero_metric_cards layout templates"
```
