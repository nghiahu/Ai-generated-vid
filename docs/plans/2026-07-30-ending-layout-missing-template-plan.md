# Ending Layout Missing Template Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Create the missing `ending.json` template file to restore the default CTA screen layout so that selecting the Ending / CTA Screen option does not result in a blank screen.

**Architecture:** Add a new JSON configuration file representing the standard Outro/CTA layout under `my-video/src/compositions/layouts/templates/Ending/ending.json` using `centered_text` layout mode. This file will be dynamically registered by the glob importer in `index.ts` under the key `"Ending"`.

**Tech Stack:** JSON, Remotion Layout Templates

---

### Task 1: Create the missing ending.json template

**Files:**
- Create: `my-video/src/compositions/layouts/templates/Ending/ending.json`

**Step 1: Write the JSON template**
Create the file with the following contents:

```json
{
  "id": "Ending",
  "name": "Ending / CTA Screen",
  "family": "ending",
  "layoutMode": "centered_text",
  "container": {
    "paddingTop": "340px",
    "maxWidth": "1000px",
    "gap": "30px"
  },
  "categoryPill": null,
  "accentDivider": {
    "width": "180px",
    "height": "4px"
  },
  "title": {
    "fontSize": "94px",
    "fontWeight": "950",
    "letterSpacing": "-0.06em",
    "marginBottom": "80px",
    "useAccentTextShadow": true
  },
  "positions": [],
  "items": {
    "rotations": [0],
    "itemStyles": [
      {
        "v2": true,
        "fontSize": "26px",
        "fontWeight": "900",
        "borderRadius": "999px",
        "padding": "14px 28px",
        "scale": 1.0,
        "backdropBlur": "12px",
        "useAccentBg": true,
        "useAccentBorder": true,
        "useAccentShadow": true,
        "useSubtleThemeBg": false,
        "useThemeBorder": false
      }
    ]
  },
  "subtitle": {
    "bottom": "300px",
    "fontSize": "46px",
    "fontWeight": "950",
    "useThemeTextShadow": true
  }
}
```

**Step 2: Verify the template is loaded**
Build the layout module to ensure the template JSON parses and compiles successfully.
Run: `npm run build` inside `my-video` folder to ensure it bundles with no errors.

**Step 3: Commit**
```bash
git add my-video/src/compositions/layouts/templates/Ending/ending.json
git commit -m "feat: add ending.json layout template for default CTA screen"
```
