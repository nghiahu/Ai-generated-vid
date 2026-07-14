# Design Spec: Custom AI Hub Grid Layouts (VDE Templates 1, 2, 3)

**Date**: July 14, 2026  
**Topic**: Implement three custom layouts based on visual mockups in `media/image` matching the tech/futuristic "AI Hub Grid" theme.

---

## 1. Proposed Layout Designs

### Layout 1: AIHubGrid1 (Emotion Column)
- **Visual Reference**: `media/image/20260713-211403.png`
- **Structure**:
  - Main title at the top of the video canvas.
  - A left column containing a vertical list card with detailed points (`vertical_item_list` type).
  - A right column containing a highlighted callout card (`card_simple` type) using the glowing neon accent background.
- **Integration**: Registered as template ID `"AIHubGrid1"` in the `list` family.

### Layout 2: AIHubGrid2 (Winding Roadmap)
- **Visual Reference**: `media/image/20260713-211406.png`
- **Structure**:
  - Left side: A vertically winding SVG Bezier curve path connecting 5 circular numbered step markers. An animated SVG `strokeDashoffset` draws the line dynamically from Step 1 to Step 5.
  - Right of step markers: 5 small glassmorphic capsule cards (`card_simple` type with rounded borders) containing step description text.
  - Right side of canvas: Large, clean Title and Description block positioned absolutely to fit the layout balance.
- **Integration**: Registered as template ID `"AIHubGrid2"` in the `timeline` family. Bypasses the default top-centered title rendering in `TemplateLayout` to allow custom absolute placement.

### Layout 3: AIHubGrid3 (Benefits Card Stack)
- **Visual Reference**: `media/image/20260713-211409.png`
- **Structure**:
  - Title centered at the top.
  - A single large centered glassmorphic card (1000px width) with 24px corner radius and thick backdrop blur rendering a vertical stack of up to 4 benefit items with icons/badges.
  - Subtitle centered at the bottom.
- **Integration**: Registered as template ID `"AIHubGrid3"` in the `list` family.

---

## 2. Technical Implementation Details

### A. Template JSON Definitions
Created three template files:
1. `my-video/src/compositions/layouts/templates/List-Step/ai_hub_grid_1.json`
2. `my-video/src/compositions/layouts/templates/Timeline/ai_hub_grid_2.json`
3. `my-video/src/compositions/layouts/templates/List-Step/ai_hub_grid_3.json`

### B. Renderer Modifications (`AbsoluteCardsMode.tsx`)
- Added check for `isWindingRoadmap` (matching `"AIHubGrid2"`).
- Rendered the SVG path and circles:
  ```xml
  <path d="M 180 185 C 280 185, 280 335, 180 335 C 80 335, 80 485, 180 485 C 280 485, ... " ... />
  ```
- Rendered step numbers `1` to `5` pulsing/scaling in sequentially using Remotion `interpolate`.
- Rendered the Title and Subtitle block absolutely on the right column.

### C. Web Editor Integration (`StoryboardEditor.jsx`)
- Registered `AIHubGrid1` and `AIHubGrid3` under the `"List / Steps"` family options.
- Registered `AIHubGrid2` under the `"Timeline"` family options.

---

## 3. Verification Plan

### Manual Verification
1. Run Remotion Studio and inspect layouts visually.
2. Verify that `AIHubGrid2` displays the winding path and numbered steps sequentially.
3. Open Storyboard Editor and verify that all three custom templates appear in the layout dropdown selector.
