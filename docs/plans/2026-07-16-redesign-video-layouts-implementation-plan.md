# Redesign Video Layouts Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Upgrade and dọn dẹp the visual layouts in `my-video` and implement the missing `centered_text` layout mode using the taste-skill redesign principles.

**Architecture:** We will implement a new React component `CenteredTextMode.tsx` to handle centered typography scenes (like quotes and message cards). We will then register it in `TemplateLayout.tsx` and refactor existing layout renderers (like `IntroEvidenceScanlineMode.tsx`) to align with desaturated, high-end styling rules.

**Tech Stack:** React, Remotion, TypeScript, CSS (inline styles).

---

### Task 1: Install Taste-Skill Redesign Skill Locally

**Files:**
- Create: `.agents/skills/redesign-existing-projects/SKILL.md`

**Step 1: Run installation command**
Run: `npx skills add https://github.com/Leonxlnx/taste-skill --skill "redesign-existing-projects"`
Expected: The CLI downloads the `redesign-existing-projects` skill and saves it under the `.agents/skills/` directory.

**Step 2: Commit**
```bash
git add .agents/skills/redesign-existing-projects/
git commit -m "chore: add redesign skill locally"
```

---

### Task 2: Create CenteredTextMode Component

**Files:**
- Create: `my-video/src/compositions/layouts/modes/CenteredTextMode.tsx`

**Step 1: Write the React component code**
Write the code in `my-video/src/compositions/layouts/modes/CenteredTextMode.tsx`:
```tsx
import React from "react";
import { useCurrentFrame, spring } from "remotion";
import { ModeRendererProps } from "./LayoutModeTypes";

export const CenteredTextMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  titleText,
  category
}) => {
  const frame = useCurrentFrame();

  // Spring animations for staggered entry
  const springValue = spring({
    frame,
    fps: 30,
    config: { stiffness: 100, damping: 20 }
  });

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      maxWidth: t.container?.maxWidth || "920px",
      minHeight: "450px",
      textAlign: "center",
      padding: "48px",
      boxSizing: "border-box",
      opacity: springValue,
      transform: `translateY(${15 * (1 - springValue)}px)`,
      zIndex: 5
    }}>
      {category && (
        <div style={{
          fontSize: "14px",
          fontWeight: "700",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: accentColor,
          marginBottom: "24px"
        }}>
          {category}
        </div>
      )}

      {titleText && (
        <h1 style={{
          fontSize: `${t.title?.fontSize || 80}px`,
          fontWeight: t.title?.fontWeight || "800",
          letterSpacing: t.title?.letterSpacing || "-0.04em",
          lineHeight: 1.15,
          color: isLight ? "#0f172a" : "#f8fafc",
          margin: "0 0 32px 0",
          fontFamily: styles.fontFamily,
          textWrap: "balance" as const
        }}>
          {titleText}
        </h1>
      )}

      {t.accentDivider && (
        <div style={{
          width: t.accentDivider.width || "94px",
          height: t.accentDivider.height || "6px",
          backgroundColor: accentColor,
          borderRadius: "999px",
          marginBottom: "32px",
          boxShadow: `0 0 16px rgba(${rgb}, 0.3)`
        }} />
      )}

      {otherComps.map((comp, idx) => (
        <div
          key={idx}
          style={{
            fontSize: "24px",
            lineHeight: 1.5,
            color: isLight ? "#475569" : "#cbd5e1",
            maxWidth: "680px",
            fontFamily: styles.fontFamily
          }}
        >
          {comp.data?.text}
        </div>
      ))}
    </div>
  );
};
```

**Step 2: Commit**
```bash
git add my-video/src/compositions/layouts/modes/CenteredTextMode.tsx
git commit -m "feat: add CenteredTextMode component for centered_text layout"
```

---

### Task 3: Map CenteredTextMode in TemplateLayout

**Files:**
- Modify: `my-video/src/compositions/layouts/TemplateLayout.tsx`

**Step 1: Update imports and switch cases**
Modify `my-video/src/compositions/layouts/TemplateLayout.tsx` to import `CenteredTextMode` and add a case for `"centered_text"`:
```tsx
import { CenteredTextMode } from "./modes/CenteredTextMode";
```
and:
```tsx
      case "centered_text":
        return <CenteredTextMode {...modeProps} />;
```

**Step 2: Commit**
```bash
git add my-video/src/compositions/layouts/TemplateLayout.tsx
git commit -m "feat: map centered_text mode in TemplateLayout"
```

---

### Task 4: Refactor and Beautify IntroEvidenceScanlineMode

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/IntroEvidenceScanlineMode.tsx`

**Step 1: Update borders, shadows, and fonts**
Refactor the styling sections in `my-video/src/compositions/layouts/modes/IntroEvidenceScanlineMode.tsx` to use desaturated colors, whisper borders, and tinted shadows:
```tsx
          if (isHighlighted) {
            cardBg = isLight
              ? `linear-gradient(90deg, #ffffff, rgba(${rgb}, 0.12))`
              : `linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(${rgb}, 0.16))`;
            cardBorder = `1.5px solid ${accentColor}`; // Thinner, desaturated accent border
            cardShadow = isLight 
              ? `rgba(15, 23, 42, 0.08) 0px 24px 48px, rgba(${rgb}, 0.1) 0px 0px 16px`
              : `rgba(0, 0, 0, 0.44) 0px 24px 62px, rgba(${rgb}, 0.2) 0px 0px 24px, rgba(255, 255, 255, 0.04) 0px 0px 0px 1px inset`;
            cardTextColor = isLight ? "#0f172a" : "rgb(249, 247, 255)";
          } else {
            cardBg = isLight 
              ? "rgba(255, 255, 255, 0.98)"
              : "rgba(15, 23, 42, 0.96)";
            cardBorder = isLight 
              ? `1px solid rgba(${rgb}, 0.15)` // Whisper border
              : `1px solid rgba(255, 255, 255, 0.06)`; // Whisper border
            cardShadow = isLight 
              ? "rgba(15, 23, 42, 0.04) 0px 18px 40px"
              : `rgba(0, 0, 0, 0.44) 0px 20px 48px, rgba(255, 255, 255, 0.04) 0px 0px 0px 1px inset`;
            cardTextColor = isLight ? "#1e293b" : "rgb(249, 247, 255)";
          }
```

**Step 2: Commit**
```bash
git add my-video/src/compositions/layouts/modes/IntroEvidenceScanlineMode.tsx
git commit -m "style: polish shadows and borders in IntroEvidenceScanlineMode"
```

---

### Task 5: Verify rendering in Remotion Preview

**Step 1: Check build**
Expected: The TypeScript build should pass successfully.

**Step 2: Visual verification**
Expected: Check the Remotion preview player to verify that:
1. Quote templates using `centered_text` layout render beautifully in center screen.
2. `IntroEvidenceScanlineMode` cards have cleaner, less saturated visual aesthetics.
