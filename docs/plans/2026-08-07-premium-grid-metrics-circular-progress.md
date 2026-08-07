# Premium Grid Metrics in Circular Progress Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Redesign the cards in the Circular Progress layout mode to look like premium dashboard metric cards with colored Lucide icons, large numbers, and custom count-up animations.

**Architecture:**
1. Import Lucide icons in `CircularProgressMode.tsx`.
2. Add helper `parseCardContent` to separate raw text into `value`, `title`, and `subtext`.
3. Animate card numbers by parsing digits with `parseNumbers` and interpolating with stagger delays.
4. Update the card element structure to match the premium metrics style (centered alignment, icon badge, large colorized digits).

**Tech Stack:** React, TypeScript, Remotion, Lucide-React

---

### Task 1: Update CircularProgressMode to Premium Metrics Style

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/CircularProgressMode.tsx`

**Step 1: Inspect code**
Review current code in `CircularProgressMode.tsx`.

**Step 2: Modify code**
Update `CircularProgressMode.tsx` with:
- Imports:
  ```typescript
  import { Terminal, Layers, Cpu, Target, Zap } from "lucide-react";
  import { parseNumbers as parseNumbersUtil } from "../../../utils/numberParser";
  ```
- Helpers:
  ```typescript
  const parseCardContent = (comp: any) => {
    const text = comp.data?.text || "";
    const value = comp.data?.value || "";
    const subtext = comp.data?.subtext || "";

    if (value || subtext) {
      return { value, title: text, subtext };
    }

    const metricRegex = /^([+-]?\d+(?:\.\d+)?%?[+-°]?|[a-zA-Z]{1,3}\s*\d+)\s+([^-—:(]+)(?:[-—:(]+(.*)\)?)?$/i;
    const match = text.match(metricRegex);
    if (match) {
      return {
        value: match[1].trim(),
        title: match[2].trim(),
        subtext: match[3] ? match[3].replace(/\)$/, "").trim() : ""
      };
    }

    const splitMatch = text.match(/^([^—:-]+)\s*[—:-]\s*(.*)$/);
    if (splitMatch) {
      return {
        value: "",
        title: splitMatch[1].trim(),
        subtext: splitMatch[2].trim()
      };
    }

    return { value: "", title: text, subtext: "" };
  };

  const getCardTheme = (idx: number, isLight: boolean) => {
    switch (idx) {
      case 0:
        return {
          color: "#f97316",
          icon: <Terminal size={24} color="#f97316" />,
          bg: isLight ? "rgba(249, 115, 22, 0.05)" : "rgba(249, 115, 22, 0.08)",
          border: isLight ? "rgba(249, 115, 22, 0.2)" : "rgba(249, 115, 22, 0.3)"
        };
      case 1:
        return {
          color: "#3b82f6",
          icon: <Layers size={24} color="#3b82f6" />,
          bg: isLight ? "rgba(59, 130, 246, 0.05)" : "rgba(59, 130, 246, 0.08)",
          border: isLight ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.3)"
        };
      case 2:
        return {
          color: "#0d9488",
          icon: <Cpu size={24} color="#0d9488" />,
          bg: isLight ? "rgba(13, 148, 136, 0.05)" : "rgba(13, 148, 136, 0.08)",
          border: isLight ? "rgba(13, 148, 136, 0.2)" : "rgba(13, 148, 136, 0.3)"
        };
      case 3:
        return {
          color: "#eab308",
          icon: <Target size={24} color="#eab308" />,
          bg: isLight ? "rgba(234, 179, 8, 0.05)" : "rgba(234, 179, 8, 0.08)",
          border: isLight ? "rgba(234, 179, 8, 0.2)" : "rgba(234, 179, 8, 0.3)"
        };
      default:
        return {
          color: "#a855f7",
          icon: <Zap size={24} color="#a855f7" />,
          bg: isLight ? "rgba(168, 85, 247, 0.05)" : "rgba(168, 85, 247, 0.08)",
          border: isLight ? "rgba(168, 85, 247, 0.2)" : "rgba(168, 85, 247, 0.3)"
        };
    }
  };
  ```
- Change `cardStyle` to a central aligned card style:
  ```typescript
  const cardStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: "28px",
    padding: "28px",
    background: isLight ? "rgba(255, 255, 255, 0.88)" : "rgba(255, 255, 255, 0.03)",
    border: `1px solid ${isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.12)"}`,
    boxShadow: `0 14px 34px rgba(0, 0, 0, 0.15)`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    boxSizing: "border-box",
    minHeight: "220px",
  };
  ```
- Inline dynamic counting animation inside `cardComps.map`:
  ```typescript
  const { value, title, subtext } = parseCardContent(comp);
  const theme = getCardTheme(idx, isLight);

  // Parse digits for current card
  const { n1, suffix } = parseNumbersUtil(value);
  const hasDigits = /\d+/.test(value);

  // Stagger delays for count-up animations
  const cardStartFrame = countStart + 12 + (idx * 8);
  const cardProgress = interpolate(frame - cardStartFrame, [0, 25], [0, n1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 1, 0.5, 1),
  });

  const animatedValue = Math.round(cardProgress);
  ```
- Add custom icon badge rendering, dynamic number, title, and subtext inside the return statement of `cardComps.map`.

**Step 3: Run verify compilation**
Run: `npx eslint src/compositions/layouts/modes/CircularProgressMode.tsx`
Expected: PASS

**Step 4: Commit**
```bash
git add my-video/src/compositions/layouts/modes/CircularProgressMode.tsx
git commit -m "feat: upgrade Circular Progress cards to premium metrics grid style with animations"
```
