# MetricFocusShowcase Layout Mode Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement the new `MetricFocusShowcase` layout mode with a huge orange metric number, stacked side text, multi-row badges, and a bottom progress card.

**Architecture:** Integrate the new layout into the backend AI generator contract, create a new Remotion layout mode component `MetricFocusShowcaseMode`, register the layout template JSON, and wire it up in the layout switcher `TemplateLayout.tsx`.

**Tech Stack:** React, TypeScript, Remotion, Node.js (Express backend)

---

### Task 1: AI Backend Contract and Hint Registration

**Files:**
- Modify: [contractLoader.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/contractLoader.js)
- Modify: [ai.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/ai.js)

**Step 1: Write contract loader modification**
Add `MetricFocusShowcase` layout contract to `contractLoader.js`.

In `backend/services/contractLoader.js`, around line 110, add:
```javascript
  MetricFocusShowcase: {
    layoutId: 'MetricFocusShowcase',
    family: 'Opening / Headline',
    headingMaxChars: 45,
    pointsCount: { min: 1, max: 6, default: 4 },
    pointMaxChars: 50,
    allowedPointTypes: ['badge_row', 'metric', 'card'],
    aiHint: 'Layout chỉ số bảo mật/kỹ thuật cao, có số lớn màu cam kèm nhãn bên phải, hàng loạt pill chi tiết ở giữa và thẻ bảng tiến trình/chi phí ở dưới cùng.'
  },
```

**Step 2: Add AI Hint for layout selection**
In `backend/services/ai.js`, around lines 53 and 250, update the prompt rules lists:
Add `MetricFocusShowcase` to the allowed layout list inside `PLANNER_SCHEMA.items.properties.layoutId.description` and under the key metrics prompt rule.
E.g., update descriptions to mention `MetricFocusShowcase`.

**Step 3: Verify backend loading**
Verify that the backend contract loads successfully without throwing exceptions.
We can run a simple Node check on `contractLoader.js`.
Run: `node -e "require('./backend/services/contractLoader.js')"`
Expected: Exit code 0 (no syntax/runtime errors).

**Step 4: Commit**
```bash
git add backend/services/contractLoader.js backend/services/ai.js
git commit -m "feat: register MetricFocusShowcase layout contract and AI hints in backend"
```

---

### Task 2: Layout Template Configuration and Registry

**Files:**
- Create: [metric_focus_showcase.json](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/templates/Opening-Headline/metric_focus_showcase.json)
- Modify: [index.ts](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/index.ts)

**Step 1: Create metric_focus_showcase.json**
Write the layout configuration matching the component needs:
```json
{
  "id": "MetricFocusShowcase",
  "name": "Metric Focus Showcase",
  "family": "opening",
  "layoutMode": "metric_focus_showcase",
  "container": {
    "paddingTop": "260px",
    "maxWidth": "940px",
    "gap": "24px"
  },
  "categoryPill": null,
  "accentDivider": null,
  "title": {
    "fontSize": "96px",
    "fontWeight": "950",
    "letterSpacing": "-0.06em",
    "marginBottom": "40px",
    "useAccentTextShadow": true
  },
  "positions": [
    {
      "left": "0px",
      "top": "0px",
      "width": "100%",
      "height": "720px",
      "zIndex": "1",
      "nestedStructure": null
    }
  ],
  "items": {
    "rotations": [0],
    "itemStyles": [
      {
        "v2": true,
        "fontSize": "22px",
        "fontWeight": "800",
        "borderRadius": "24px",
        "padding": "12px 24px"
      }
    ]
  },
  "subtitle": null
}
```

**Step 2: Add static registration in index.ts**
Import and add `metricFocusShowcaseJson` to the static templates registration.
In `my-video/src/compositions/layouts/index.ts`, add:
```typescript
import metricFocusShowcaseJson from "./templates/Opening-Headline/metric_focus_showcase.json";
```
And add `metricFocusShowcaseJson` inside `staticTemplates` array.

**Step 3: Verification**
Run TypeScript check in `my-video` directory:
Run: `npx tsc --noEmit --skipLibCheck --types react`
Expected: PASS

**Step 4: Commit**
```bash
git add my-video/src/compositions/layouts/templates/Opening-Headline/metric_focus_showcase.json my-video/src/compositions/layouts/index.ts
git commit -m "feat: create metric_focus_showcase template JSON and register in layout index"
```

---

### Task 3: Layout Mode Switch Integration

**Files:**
- Modify: [TemplateLayout.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/TemplateLayout.tsx)

**Step 1: Import new layout mode component**
In `my-video/src/compositions/layouts/TemplateLayout.tsx`, import `MetricFocusShowcaseMode` (to be created in Task 4):
```typescript
import { MetricFocusShowcaseMode } from "./modes/MetricFocusShowcaseMode";
```

**Step 2: Add case in switch**
Around line 253, inside `renderLayoutContent()` function, add the case:
```typescript
      case "metric_focus_showcase":
        return <MetricFocusShowcaseMode {...modeProps} />;
```

**Step 3: Verify TypeScript compilation**
Run: `npx tsc --noEmit --skipLibCheck --types react`
Note: This might fail temporarily because `MetricFocusShowcaseMode` does not exist yet. We will write a placeholder file first if needed or compile after Task 4. Let's create a placeholder component file at `my-video/src/compositions/layouts/modes/MetricFocusShowcaseMode.tsx` to keep the build passing:
```typescript
import React from "react";
import { ModeRendererProps } from "./LayoutModeTypes";
export const MetricFocusShowcaseMode: React.FC<ModeRendererProps> = () => {
  return <div>MetricFocusShowcase placeholder</div>;
};
```

**Step 4: Run typecheck**
Run: `npx tsc --noEmit --skipLibCheck --types react`
Expected: PASS

**Step 5: Commit**
```bash
git add my-video/src/compositions/layouts/TemplateLayout.tsx
git commit -m "feat: add case switch for metric_focus_showcase layout in TemplateLayout"
```

---

### Task 4: Complete Implementation of MetricFocusShowcaseMode

**Files:**
- Modify: [MetricFocusShowcaseMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/MetricFocusShowcaseMode.tsx)

**Step 1: Write complete code for MetricFocusShowcaseMode**
Implement the component with full details:
- Detect the metric point (`type === 'metric'`), separate value and subtext.
- Animate number counter from 0 to metric value using `interpolate` and `Bezier` curves starting around frame 24.
- Render Category Pill at the top with bullet indicator.
- Render huge orange number on the left and left-aligned stacked subtext on the right.
- Filter and group badge rows, render them as rounded pills with color accents (orange/teal).
- Group other cards, render them as progress bars in a dark glass card container.
- Parse progress bar percentages dynamically from values (e.g. `$10` or `70%`), with visual fallback values (70% and 95%) if not numbers.

**Step 2: Run verification**
Validate code correctness.
Run: `npx tsc --noEmit --skipLibCheck --types react`
Expected: PASS

**Step 3: Commit**
```bash
git add my-video/src/compositions/layouts/modes/MetricFocusShowcaseMode.tsx
git commit -m "feat: implement full UI structure, styling, and animation for MetricFocusShowcaseMode"
```
