# Font Rendering Fix Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Fix font rendering fallback issues in exported Remotion videos by ensuring all required fonts and weight subsets are loaded and inherited correctly in layout templates.

**Architecture:** Load Space Grotesk via `@remotion/google-fonts`, expand existing fonts to load regular weights (`400`, `500`), map theme configuration keys to loaded variables dynamically in the theme styles generator, and enforce font inheritance by adding the CSS font-family style to the root TemplateLayout container.

**Tech Stack:** React, Remotion, @remotion/google-fonts, CSS

---

### Task 1: Add Space Grotesk and Missing Font Weights

**Files:**
- Modify: [my-video/src/styles/fonts.ts](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/styles/fonts.ts)

**Step 1: Write minimal implementation**
We will add `SpaceGrotesk` Google Font loading and expand weights for `Be Vietnam Pro` and `Montserrat` to include `"400"` and `"500"`.

Modify `my-video/src/styles/fonts.ts` to look like this:
```typescript
import { loadFont as loadBeVietnamPro } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";

// Be Vietnam Pro – heading chính cho nội dung tiếng Việt
export const { fontFamily: fontBeVietnamPro } = loadBeVietnamPro("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "vietnamese"],
});

// Alias fontOutfit => fontBeVietnamPro để không phải đổi code ở các file khác
export const fontOutfit = fontBeVietnamPro;

// Inter – dùng cho body text, bullet points
export const { fontFamily: fontInter } = loadInter("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin", "vietnamese"],
});

// Montserrat – dùng cho Brutalist theme heading
export const { fontFamily: fontMontserrat } = loadMontserrat("normal", {
  weights: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "vietnamese"],
});

// JetBrains Mono – dùng cho Cyberpunk theme & code blocks (latin only)
export const { fontFamily: fontJetBrainsMono } = loadJetBrainsMono("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

// Space Grotesk – dùng cho Minimal, Light, Anime themes
export const { fontFamily: fontSpaceGrotesk } = loadSpaceGrotesk("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
});

import { loadFont as loadLora } from "@remotion/google-fonts/Lora";

// Lora - Serif font for Claude Editorial theme with 100% perfect Vietnamese diacritics support
export const { fontFamily: fontPlayfairDisplay } = loadLora("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
});

import { loadFont as loadChakraPetch } from "@remotion/google-fonts/ChakraPetch";

// Chakra Petch - Futuristic square-angled font with Vietnamese support for HUST X RIKKEI ending layout
export const { fontFamily: fontChakraPetch } = loadChakraPetch("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
});
```

**Step 2: Commit**
```bash
git add my-video/src/styles/fonts.ts
git commit -m "style: load Space Grotesk and regular weights for Be Vietnam Pro & Montserrat"
```

---

### Task 2: Map Font Config Keys to Loaded Font Variables

**Files:**
- Modify: [my-video/src/styles/themes.ts](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/styles/themes.ts)

**Step 1: Write minimal implementation**
Import `fontSpaceGrotesk` and `fontChakraPetch` in `themes.ts`, and update the `fontFamily` mapping in `getThemeStyles` to dynamically map `tokens.fonts?.title` to their loaded variables.

Modify `my-video/src/styles/themes.ts`:
```typescript
import React from "react";
import { fontOutfit, fontMontserrat, fontPlayfairDisplay, fontBeVietnamPro, fontInter, fontJetBrainsMono, fontSpaceGrotesk, fontChakraPetch } from "./fonts";
import { getVDETokens } from "./vdeTokens";
...
export const getThemeStyles = (themeName: string, accentColor: string): ThemeStyles => {
  const tokens = getVDETokens(themeName);
  
  let fontFamily = fontOutfit;
  const titleFont = tokens.fonts?.title || "";
  if (titleFont.includes("Playfair") || titleFont.includes("Lora")) {
    fontFamily = fontPlayfairDisplay;
  } else if (titleFont.includes("Space Grotesk")) {
    fontFamily = fontSpaceGrotesk;
  } else if (titleFont.includes("Be Vietnam Pro")) {
    fontFamily = fontBeVietnamPro;
  } else if (titleFont.includes("Inter")) {
    fontFamily = fontInter;
  } else if (titleFont.includes("Montserrat")) {
    fontFamily = fontMontserrat;
  } else if (titleFont.includes("JetBrains Mono") || titleFont.includes("monospace")) {
    fontFamily = fontJetBrainsMono;
  } else if (titleFont.includes("Chakra Petch")) {
    fontFamily = fontChakraPetch;
  }

  const backgroundColor = tokens.colors?.background || "#090d1a";
...
```

**Step 2: Commit**
```bash
git add my-video/src/styles/themes.ts
git commit -m "style: map config font strings to registered remotion font variables in themes"
```

---

### Task 3: Enforce Font Family Inheritance in Layout Container

**Files:**
- Modify: [my-video/src/compositions/layouts/TemplateLayout.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/TemplateLayout.tsx)

**Step 1: Write minimal implementation**
Inject `fontFamily: styles.fontFamily` to the container `div` wrapping the layout modes on line 240.

Modify `my-video/src/compositions/layouts/TemplateLayout.tsx`:
```tsx
      {/* Content layer — carries containerStyle (flex/padding) and sits above overlay via zIndex: 1 */}
      <div style={{ ...containerStyle, position: "relative", zIndex: 1, fontFamily: styles.fontFamily }}>
```

**Step 2: Commit**
```bash
git add my-video/src/compositions/layouts/TemplateLayout.tsx
git commit -m "style: pass fontFamily to main content container to enable font inheritance in layout modes"
```

---

### Task 4: Verify the Font Rendering Fix

**Step 1: Run Remotion Studio preview verification**
Verify that the preview works correctly without compilation errors.
Check fonts inside the Remotion Studio interface.

**Step 2: Render a test video**
Start the backend render process to export a video, and verify that the exported video displays the correct font family (such as Be Vietnam Pro or Lora) for the body texts, without falling back to ugly serif system fonts.
