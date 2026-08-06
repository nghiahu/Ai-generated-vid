# MetricShowcaseHook Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Create a new visual layout mode named `MetricShowcaseHook` supporting dual range counters (running from 0) and optional secondary cards/command prompt.

**Architecture:** 
1. Register template JSON under `Opening-Headline` family.
2. Add registry override mapping in layout index.
3. Handle component selection in `TemplateLayout` to direct to the new mode.
4. Implement `MetricShowcaseHookMode` component with parallel count-up interpolations for single and double values.
5. Register data validation contracts and AI prompts in backend, and add layout option in frontend selector.

**Tech Stack:** React, Remotion, TypeScript, Node.js, Express, Gemini SDK

---

### Task 1: Create Template JSON File

**Files:**
- Create: [metric_showcase_hook.json](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/my-video/src/compositions/layouts/templates/Opening-Headline/metric_showcase_hook.json)

**Step 1: Write the template JSON file**
Create the template specification:
```json
{
  "id": "MetricShowcaseHook",
  "name": "Metric Showcase Hook",
  "family": "opening",
  "layoutMode": "metric_showcase_hook",
  "container": {
    "paddingTop": "320px",
    "maxWidth": "960px",
    "gap": "24px"
  },
  "categoryPill": null,
  "accentDivider": null,
  "title": {
    "fontSize": "92px",
    "fontWeight": "950",
    "letterSpacing": "-0.06em",
    "marginBottom": "80px",
    "useAccentTextShadow": true
  },
  "positions": [
    {
      "left": "0px",
      "top": "0px",
      "width": "100%",
      "height": "720px",
      "zIndex": "1",
      "nestedStructure": {
        "type": "card_with_nested_pills",
        "badgeText": "",
        "titleText": "",
        "pills": []
      }
    }
  ],
  "items": {
    "rotations": [0],
    "itemStyles": [
      {
        "v2": true,
        "fontSize": "26px",
        "fontWeight": "800",
        "borderRadius": "32px",
        "padding": "36px 40px",
        "scale": 1.0,
        "backdropBlur": "8px",
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
    "fontSize": "44px",
    "fontWeight": "950",
    "useThemeTextShadow": true
  }
}
```

**Step 2: Commit template**
```bash
git add my-video/src/compositions/layouts/templates/Opening-Headline/metric_showcase_hook.json
git commit -m "feat: add template JSON for MetricShowcaseHook"
```

---

### Task 2: Register Layout in Index and Template Layout

**Files:**
- Modify: [index.ts](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/my-video/src/compositions/layouts/index.ts)
- Modify: [TemplateLayout.tsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/my-video/src/compositions/layouts/TemplateLayout.tsx)

**Step 1: Modify layout index.ts to import template**
Import `metricShowcaseHookJson` statically and add to `staticTemplates` to ensure fast reload:
```typescript
import metricShowcaseHookJson from "./templates/Opening-Headline/metric_showcase_hook.json";

// Add to staticTemplates array:
const staticTemplates = [
  introMediaHeroJson,
  vignelliQuoteJson,
  mediaShowcaseCardJson,
  metricShowcaseHookJson
];
```

**Step 2: Modify TemplateLayout.tsx to import and map layoutMode**
Import `MetricShowcaseHookMode` and add `case "metric_showcase_hook"` in switch statement:
```typescript
import { MetricShowcaseHookMode } from "./modes/MetricShowcaseHookMode";

// Inside renderLayoutContent():
case "metric_showcase_hook":
  return <MetricShowcaseHookMode {...modeProps} />;
```

**Step 3: Verify TypeScript compilation**
Run compiler to verify registration compiles without errors.
Run: `npm run lint` inside `my-video` folder.
Expected: Fail only because `MetricShowcaseHookMode` component file doesn't exist yet.

---

### Task 3: Implement MetricShowcaseHookMode Component

**Files:**
- Create: [MetricShowcaseHookMode.tsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/my-video/src/compositions/layouts/modes/MetricShowcaseHookMode.tsx)

**Step 1: Write the React Remotion component**
Write full React component parsing double range counter and animating them:
```tsx
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding, getAnimationConfig } from "./LayoutNestedRenderers";

function parseNumbers(valueStr: string): { n1: number; n2: number | null; suffix: string } {
  if (!valueStr) return { n1: 0, n2: null, suffix: "" };
  
  // Look for range "X - Y" or "X-Y" (with decimals/dots)
  const rangeRegex = /(\d+(?:[\.,]\d+)?)\s*-\s*(\d+(?:[\.,]\d+)?)/;
  const match = valueStr.match(rangeRegex);
  
  if (match) {
    const rawN1 = parseFloat(match[1].replace(/\./g, "").replace(/,/g, "."));
    const rawN2 = parseFloat(match[2].replace(/\./g, "").replace(/,/g, "."));
    const suffix = valueStr.replace(match[0], "").trim();
    return {
      n1: isNaN(rawN1) ? 0 : rawN1,
      n2: isNaN(rawN2) ? 0 : rawN2,
      suffix
    };
  }
  
  // Single number case
  const singleRegex = /(\d+(?:[\.,]\d+)?)/;
  const singleMatch = valueStr.match(singleRegex);
  if (singleMatch) {
    const rawN = parseFloat(singleMatch[1].replace(/\./g, "").replace(/,/g, "."));
    const suffix = valueStr.replace(singleMatch[0], "").trim();
    return {
      n1: isNaN(rawN) ? 0 : rawN,
      n2: null,
      suffix
    };
  }
  
  return { n1: 0, n2: null, suffix: valueStr };
}

export const MetricShowcaseHookMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale,
  titleText
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find components based on their parsed role
  const badgeComp = otherComps.find((c: any) => c.data?.type === "badge_row" || c.type === "badge_row");
  const highlightComp = otherComps.find((c: any) => c.data?.type === "subheader" || c.type === "subheader");
  const metricComp = otherComps.find((c: any) => c.data?.type === "metric" || c.type === "metric");
  const cardComp = otherComps.find((c: any) => c.data?.type === "card" || c.type === "card");
  const terminalComp = otherComps.find((c: any) => c.data?.type === "terminal" || c.type === "terminal");

  // Animations start config
  const countStart = Math.round(0.8 * fps);
  
  const rawValue = metricComp?.data?.value || "";
  const { n1, n2, suffix } = parseNumbers(rawValue);

  // Number counting interpolation
  const animN1 = Math.round(interpolate(frame - countStart, [0, 30], [0, n1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  }));

  const animN2 = n2 !== null ? Math.round(interpolate(frame - countStart, [0, 30], [0, n2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  })) : null;

  const cardStyle: React.CSSProperties = {
    borderRadius: "38px",
    background: isLight
      ? "rgba(255, 255, 255, 0.9)"
      : "linear-gradient(rgba(24, 18, 8, 0.45), rgba(2, 6, 23, 0.28))",
    border: isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.22)",
    boxShadow: isLight
      ? "0 28px 70px rgba(0,0,0,0.08)"
      : `rgba(0,0,0,0.24) 0px 28px 70px, rgba(255,255,255,0.06) 0px 0px 0px 1px inset, rgba(${rgb},0.094) 0px 0px 34px`,
    backdropFilter: "blur(8px) saturate(1.08)",
    padding: resolvePadding("42px 46px 36px", paddingScale),
    width: "100%",
    maxWidth: t.container?.maxWidth || "940px",
    display: "flex",
    flexDirection: "column",
    gap: "28px",
    boxSizing: "border-box",
    zIndex: 5
  };

  return (
    <AnimatedBlock animation="scale-in" delaySeconds={0.1}>
      <div style={cardStyle}>
        {/* Title / Heading */}
        {titleText && (
          <div style={{
            fontSize: `${Math.round(84 * fontScale)}px`,
            lineHeight: 1.1,
            fontWeight: 950,
            letterSpacing: "-0.05em",
            textAlign: "center",
            color: isLight ? "#1e293b" : "rgb(248,250,252)",
            fontFamily: styles.fontFamily,
            textShadow: isLight ? "none" : `0 4px 16px rgba(${rgb}, 0.2)`
          }}>
            {titleText}
          </div>
        )}

        {/* Badges */}
        {badgeComp && badgeComp.data?.badges && (
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
            {badgeComp.data.badges.map((badge: string, idx: number) => (
              <span key={idx} style={{
                borderRadius: "20px",
                padding: "8px 16px",
                background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.08)",
                border: `1px solid ${isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)"}`,
                color: accentColor,
                fontWeight: 700,
                fontSize: "18px",
                fontFamily: styles.fontFamily
              }}>
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Subheader / Highlight Alert Bar */}
        {highlightComp && (
          <div style={{
            alignSelf: "center",
            borderRadius: "16px",
            border: `1px solid ${accentColor}`,
            boxShadow: `0 0 15px rgba(${rgb}, 0.25)`,
            padding: "12px 24px",
            background: `rgba(${rgb}, 0.04)`,
            color: isLight ? "#1e293b" : "rgb(248,250,252)",
            fontSize: "20px",
            fontWeight: 700,
            textAlign: "center",
            fontFamily: styles.fontFamily
          }}>
            🔥 {highlightComp.data.text}
          </div>
        )}

        {/* Metric Area */}
        {metricComp && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "10px 0" }}>
            <div style={{
              fontSize: `${Math.round(108 * fontScale)}px`,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: "-0.07em",
              color: accentColor,
              fontFamily: styles.fontFamily,
              display: "flex",
              alignItems: "baseline",
              gap: "10px"
            }}>
              {/* Values */}
              <span>
                {n2 !== null ? `${animN1.toLocaleString("vi-VN")} - ${animN2.toLocaleString("vi-VN")}` : animN1.toLocaleString("vi-VN")}
              </span>
              {suffix && (
                <span style={{
                  fontSize: `${Math.round(48 * fontScale)}px`,
                  fontWeight: 800,
                  color: isLight ? "#475569" : "#94a3b8",
                  letterSpacing: "normal",
                  marginLeft: "8px"
                }}>
                  {suffix}
                </span>
              )}
            </div>
            {metricComp.data?.subtext && (
              <div style={{
                fontSize: "20px",
                fontWeight: 800,
                color: isLight ? "#64748b" : "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginTop: "12px",
                fontFamily: styles.fontFamily
              }}>
                {metricComp.data.subtext}
              </div>
            )}
          </div>
        )}

        {/* Card Component */}
        {cardComp && (
          <div style={{
            borderRadius: "24px",
            padding: "24px",
            background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
            border: isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.12)",
            boxShadow: "rgba(0,0,0,0.12) 0px 10px 24px",
            color: isLight ? "#334155" : "#e2e8f0",
            fontSize: "22px",
            fontWeight: 700,
            fontFamily: styles.fontFamily,
            lineHeight: 1.3
          }}>
            💡 {cardComp.data.text}
          </div>
        )}

        {/* Terminal Command Prompt */}
        {terminalComp && (
          <div style={{
            borderRadius: "14px",
            padding: "16px 20px",
            background: "#090d16",
            border: "1px solid #1e293b",
            fontFamily: "monospace",
            fontSize: "18px",
            color: "#38bdf8",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            boxSizing: "border-box"
          }}>
            <span style={{ color: "#f43f5e" }}>$</span>
            <span>{terminalComp.data.text}</span>
          </div>
        )}
      </div>
    </AnimatedBlock>
  );
};
```

**Step 2: Run build linting**
Run `npm run lint` in `my-video` workspace.
Expected: PASS (No TypeScript or ESLint compile errors).

**Step 3: Commit component**
```bash
git add my-video/src/compositions/layouts/modes/MetricShowcaseHookMode.tsx my-video/src/compositions/layouts/index.ts my-video/src/compositions/layouts/TemplateLayout.tsx
git commit -m "feat: implement MetricShowcaseHookMode layout component"
```

---

### Task 4: Register Contract and Prompts in Backend

**Files:**
- Modify: [contractLoader.js](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/backend/services/contractLoader.js:93-101)
- Modify: [ai.js](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/backend/services/ai.js:51-54)

**Step 1: Write backend contract**
Add `MetricShowcaseHook` contract entry to `LAYOUT_CONTRACTS` in `contractLoader.js`:
```javascript
  MetricShowcaseHook: {
    layoutId: 'MetricShowcaseHook',
    family: 'Opening / Headline',
    headingMaxChars: 45,
    pointsCount: { min: 1, max: 5, default: 3 },
    pointMaxChars: 50,
    allowedPointTypes: ['badge_row', 'subheader', 'metric', 'card', 'terminal'],
    aiHint: 'Layout báo cáo chỉ số danh tiếng, repo hoặc lương dạng dashboard có hiệu ứng chạy số đôi hoặc số đơn.'
  },
```

**Step 2: Modify prompt instruction in ai.js**
Add `MetricShowcaseHook` to layoutId examples and rules in `backend/services/ai.js` to ensure the AI knows to choose it:
```javascript
// Around line 53 (PLANNER_SCHEMA properties.layoutId description):
description: "The explicit Remotion Layout ID matching scene intent. Examples: 'IntroBriefingCard', 'IntroBubbleImage', 'BeforeAfterPanel', 'RankedImpactBullet', 'SplitProofBullet', 'HeroMetricCards', 'MetricCards', 'VersusArena', 'SplitBandChecklist', 'Pullquote', 'TimelineBeamRail', 'CircularProgress', 'MetricShowcaseHook', 'Ending'."

// Around line 250 (PLANNER_SCHEMA instruction layout selection rules):
- **Metrics / Statistics / Numbers** (heading/voiceover contains "%", "tỷ đô", "con số", "tăng", "giảm", "doanh thu", "triệu"): MUST select HeroMetricCards, MetricCards, GridMetrics, CircularProgress, MetricShowcaseHook, or OpsMonitorHook.
```

**Step 3: Commit backend changes**
```bash
git add backend/services/contractLoader.js backend/services/ai.js
git commit -m "feat: add MetricShowcaseHook to backend AI contracts and planner instructions"
```

---

### Task 5: Add selector option in Frontend editor

**Files:**
- Modify: [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/frontend/src/components/StoryboardEditor.jsx:205-207)

**Step 1: Modify StoryboardEditor.jsx**
Add `MetricShowcaseHook` selector option in visual styles list under `Opening / Headline`:
```javascript
    { value: "FearGreedHook", label: "Fear Greed Hook" },
    { value: "MetricShowcaseHook", label: "Metric Showcase Hook" },
    { value: "FeedScrollHook", label: "Feed Scroll Hook" },
```

**Step 2: Commit editor change**
```bash
git add frontend/src/components/StoryboardEditor.jsx
git commit -m "feat: add MetricShowcaseHook option to visual layout editor select"
```

---

## Verification Plan

### Automated Checks
- Verify typescript linting passes: `npm run lint` in `my-video`.

### Manual Visual Verification
- Open Remotion Studio (`npm run dev` in `my-video`).
- Create/edit a scene to use layout: `Opening / Headline` -> `Metric Showcase Hook`.
- Input a range metric point (e.g. `value: "15 - 20 triệu", subtext: "lương khởi điểm"`) and see both numbers count up in parallel.
- Input a single metric point (e.g. `value: "4.600 sao", subtext: "stars"`) and verify single number counting.
