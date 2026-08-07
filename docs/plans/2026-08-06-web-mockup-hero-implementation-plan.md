# WebMockupHero Layout Mode Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement the new `WebMockupHero` layout mode featuring a macOS browser mockup tilted in 3D perspective with floating sways, top pills, and bottom centered subtitles.

**Architecture:** Integrate the new layout into the backend AI planner generator, register the template configuration JSON in `my-video`, add `WebMockupHeroMode` in `modes`, write switch integration inside `TemplateLayout.tsx`, and add it to the frontend `StoryboardEditor.jsx` under the `Media` category.

**Tech Stack:** React, TypeScript, Remotion, Node.js

---

### Task 1: AI Backend Contract and Prompt Guidelines

**Files:**
- Modify: [contractLoader.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/contractLoader.js)
- Modify: [ai.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/ai.js)

**Step 1: Update contractLoader.js**
Add `WebMockupHero` to the layout contracts:
```javascript
  WebMockupHero: {
    layoutId: 'WebMockupHero',
    family: 'Opening / Headline',
    headingMaxChars: 45,
    pointsCount: { min: 1, max: 4, default: 2 },
    pointMaxChars: 50,
    allowedPointTypes: ['badge_row', 'card'],
    aiHint: 'Layout trình diễn trình duyệt web xoay nghiêng 3D bồng bềnh, có các viên thuốc nhỏ chi tiết phía trên và phụ đề căn giữa ở dưới cùng.'
  },
```

**Step 2: Update ai.js**
Add `WebMockupHero` to the allowed layout list inside `PLANNER_SCHEMA` description and rules. Add selection rule inside layout diversity rules.
Around lines 53 and 250 in `backend/services/ai.js`.

**Step 3: Verify contract loading**
Run: `node -e "require('./backend/services/contractLoader.js')"`
Expected: Exit code 0.

**Step 4: Commit**
```bash
git add backend/services/contractLoader.js backend/services/ai.js
git commit -m "feat: register WebMockupHero contract and AI hints in backend"
```

---

### Task 2: Layout Template Configuration and Registry

**Files:**
- Create: [web_mockup_hero.json](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/templates/Opening-Headline/web_mockup_hero.json)
- Modify: [index.ts](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/index.ts)

**Step 1: Create web_mockup_hero.json**
Write basic json config:
```json
{
  "id": "WebMockupHero",
  "name": "Web Mockup Hero",
  "family": "media",
  "layoutMode": "web_mockup_hero",
  "container": {
    "paddingTop": "140px",
    "maxWidth": "940px",
    "gap": "24px"
  },
  "categoryPill": null,
  "accentDivider": null,
  "title": {
    "fontSize": "86px",
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

**Step 2: Modify index.ts**
Import and append `webMockupHeroJson` inside static templates array.
```typescript
import webMockupHeroJson from "./templates/Opening-Headline/web_mockup_hero.json";
```

**Step 3: Verification**
Run: `npx tsc --noEmit --skipLibCheck --types react`
Expected: PASS (or no new errors).

**Step 4: Commit**
```bash
git add my-video/src/compositions/layouts/templates/Opening-Headline/web_mockup_hero.json my-video/src/compositions/layouts/index.ts
git commit -m "feat: create web_mockup_hero template JSON and register in layout registry"
```

---

### Task 3: Layout Mode Switch Integration

**Files:**
- Modify: [TemplateLayout.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/TemplateLayout.tsx)

**Step 1: Write placeholder component**
Create a placeholder at `my-video/src/compositions/layouts/modes/WebMockupHeroMode.tsx`:
```typescript
import React from "react";
import { ModeRendererProps } from "./LayoutModeTypes";
export const WebMockupHeroMode: React.FC<ModeRendererProps> = () => {
  return <div>WebMockupHero placeholder</div>;
};
```

**Step 2: Modify TemplateLayout.tsx**
Import and add switch case `"web_mockup_hero"` calling `<WebMockupHeroMode {...modeProps} />`.
Include `"web_mockup_hero"` inside container alignment and title skip exclusions.

**Step 3: Verification**
Run: `npx tsc --noEmit --skipLibCheck --types react`
Expected: PASS (or no new errors).

**Step 4: Commit**
```bash
git add my-video/src/compositions/layouts/TemplateLayout.tsx my-video/src/compositions/layouts/modes/WebMockupHeroMode.tsx
git commit -m "feat: add TemplateLayout case switcher and placeholder for web_mockup_hero"
```

---

### Task 4: Frontend Storyboard Option Integration

**Files:**
- Modify: [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx)

**Step 1: Update StoryboardEditor.jsx**
Add the layout option: `{ value: "WebMockupHero", label: "Web Mockup Hero" }` under `LAYOUTS_BY_FAMILY["Media"]` in `frontend/src/components/StoryboardEditor.jsx`.

**Step 2: Verify git diff**
Confirm it is added inside the correct list.

**Step 3: Commit**
```bash
git add frontend/src/components/StoryboardEditor.jsx
git commit -m "feat: add WebMockupHero to layout options under Media family on frontend"
```

---

### Task 5: Complete Implementation of WebMockupHeroMode

**Files:**
- Modify: [WebMockupHeroMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/WebMockupHeroMode.tsx)

**Step 1: Write WebMockupHeroMode code**
Implement component featuring:
- Destruct `isVertical` and use it to adjust spacing and sizes dynamically.
- Category Pill and dynamic detail Pills using VDE theme tokens (`accentColor`, opacity, high contrast secondary colors).
- 3D perspective wrapper with scaling (`0.85 -> 1.0`) and tilt rotation, sways dynamically using `Math.sin(frame)` and `Math.cos(frame)`.
- Client frame displaying `imageUrl` with mockup image fallback.
- Absolute overlay tag on the bottom-left of the client frame displaying detail text (e.g. `• 89 demo · gallery xem trước`).
- Mock details fallbacks for pills and cards if incoming arrays are empty.

**Step 2: Verification**
Run tsc compile checks.
Expected: PASS (or no new errors).

**Step 3: Commit**
```bash
git add my-video/src/compositions/layouts/modes/WebMockupHeroMode.tsx
git commit -m "feat: implement full 3D layout, floating motion, and token styles for WebMockupHeroMode"
```
