# Premium Metric Cards Grid for Circular Progress Layout Design

## Overview
This design document specifies the layout, styles, and animation mechanics for the premium 2x2 grid cards section rendered below the main circular progress indicator in `CircularProgressMode.tsx`. The design replicates the grid metrics look with clean glassmorphism cards, specialized icons, large numbers, and custom count-up animations.

## Goals
- Parse metric values, titles, and subtexts from the point content using a robust parser helper.
- Render 4 cards in a 2x2 grid layout.
- Bind color schemes (Orange, Blue, Green, Yellow) and corresponding Lucide-react icons (Terminal, Layers, Cpu, Target) to each card.
- Implement independent, sequential count-up animations for each numeric card value starting after the main progress circle finishes.

## Detailed Architecture

### 1. Smart Card Content Parser
We will implement `parseCardContent` helper within `CircularProgressMode.tsx` to handle both structured point data (`pt.value`, `pt.text`, `pt.subtext`) and unstructured plain strings:
```typescript
const parseCardContent = (comp: any) => {
  const text = comp.data?.text || "";
  const value = comp.data?.value || "";
  const subtext = comp.data?.subtext || "";

  if (value || subtext) {
    return { value, title: text, subtext };
  }

  // Matches metrics like "+100%", "2025", "360°", "100+"
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
```

### 2. Styling and Aesthetic Structure
Each card in `CircularProgressMode.tsx` will feature:
- A centered flex container with `padding: "28px"`, glassmorphism background, and custom borders.
- An upper icon container badge: `width: "60px", height: "60px"` with blurred background, enclosing a colored Lucide icon.
- A large value counter with custom colors (`#ff7a00`, `#3b82f6`, `#0d9488`, `#eab308`).
- A prominent title and subtle muted subtext description.

### 3. Sequential Card Animations
For each card index `idx`:
- Slide-up entrance animation using `AnimatedBlock` starts with a delay.
- Number count-up animation parses the metric `value` using `parseNumbers`, then interpolates `cardProgress` starting at `fps * 0.8 + idx * 8` frames over `25` frames.

## Verification Plan
We will verify that:
- Plain strings like `"100+ MCP Servers — Hàng trăm MCP Server"` correctly separate into metric `100+`, title `MCP Servers`, and subtext `Hàng trăm MCP Server`.
- Icons (Terminal, Layers, Cpu, Target) display with correct colors.
- Numbers count up sequentially without glitching.
- The layout is stable and passes ESLint rules.
