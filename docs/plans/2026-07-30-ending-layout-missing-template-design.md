# Design Document: Missing Ending Layout Template

## Overview
When users select the **Ending / CTA Screen** layout (value `"Ending"`) in the storyboard editor, the preview screen appears completely empty (showing only the background and subtitles). 

This issue is caused by a missing template definition file `ending.json` under the directory `my-video/src/compositions/layouts/templates/Ending/`. Because the template is missing, the layout lookup helper fallback matches the first alphabetical layout, which is `Blank` (mapping to a blank screen layout).

This design document outlines the structure of the new `ending.json` template to restore the default CTA layout functionality.

## Proposed Changes

### Video Templates

#### [NEW] [ending.json](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/templates/Ending/ending.json)
Create the missing layout template JSON file to define the layout configuration for the default Ending screen:

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

## Verification Plan

### Manual Verification
1. Launch the editor and select **Ending / CTA Screen** for the Ending slide layout.
2. Confirm that the preview updates to show the centered heading text and the call to action button ("Follow AI LAB ngay") as styled pills, rather than remaining empty.
