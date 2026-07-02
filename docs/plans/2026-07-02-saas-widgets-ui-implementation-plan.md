# SaaS Widgets UI Overhaul Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Upgrade Remotion UI components (Terminal, Feature Cards, Metrics, Images, backgrounds) into premium SaaS-style widgets with smooth spring-physics entrance transitions and animated SVG charts.

**Architecture:** We will modify the core UI blocks in `UIBlocks.tsx` and layout rendering in `DynamicLayout.tsx` to automatically map simple text outputs from Gemini to highly polished widgets. All animations will use Remotion's native `spring` and `interpolate` APIs for optimal frame-accurate smoothness.

**Tech Stack:** React, Remotion, CSS (Inline styles in React for Remotion support).

---

### Task 1: Redesign TerminalBlock (VS Code Mockup & Custom Syntax Highlighting)

**Files:**
- Modify: `my-video/src/components/layout/UIBlocks.tsx`

**Step 1: Implement VS Code terminal layout and highlight helper**

Implement the custom layout for `TerminalBlock` with MacOS red/yellow/green circles, a file tab header, line numbers, and a custom keyword tokenizer function `highlightTerminal(code)` in `my-video/src/components/layout/UIBlocks.tsx`:

```typescript
// Custom tokenizer for basic shell commands syntax highlighting
const highlightTerminal = (code: string, accentColor: string) => {
  const parts = code.split(/(\s+)/);
  return parts.map((part, index) => {
    if (part.startsWith("-")) {
      return <span key={index} style={{ color: "#E2E8F0" }}>{part}</span>; // flags
    }
    if (part.match(/^(npm|pip|git|npx|node|python|curl|wget)$/)) {
      return <span key={index} style={{ color: accentColor }}>{part}</span>; // main commands
    }
    if (part.match(/^(install|run|clone|add|init|dev|start)$/)) {
      return <span key={index} style={{ color: "#00E5FF" }}>{part}</span>; // subcommands
    }
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return <span key={index} style={{ color: "#61AFEF", textDecoration: "underline" }}>{part}</span>; // urls
    }
    return <span key={index} style={{ color: "rgba(255,255,255,0.85)" }}>{part}</span>;
  });
};
```

Update `TerminalBlock` component:
```typescript
export const TerminalBlock: React.FC<{ code: string; theme: string; accentColor: string }> = ({ code, theme, accentColor }) => {
  const styles = getThemeStyles(theme, accentColor);
  const isBrutalist = theme === "brutalist";
  const cleanCode = code.startsWith("$") ? code.substring(1).trim() : code;

  return (
    <div style={{
      ...styles.cardStyle,
      backgroundColor: isBrutalist ? "#ffffff" : "#0A0B10",
      border: isBrutalist ? "5px solid #000000" : `1px solid rgba(255,255,255,0.1)`,
      boxShadow: isBrutalist ? "10px 10px 0px 0px #000000" : "0 20px 50px rgba(0,0,0,0.5)",
      padding: "0px",
      overflow: "hidden",
      borderRadius: isBrutalist ? "0px" : "16px",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* MacOS Window Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: isBrutalist ? "#E2E8F0" : "rgba(255,255,255,0.03)",
        borderBottom: `1px solid ${isBrutalist ? "#000" : "rgba(255,255,255,0.08)"}`,
        padding: "16px 20px"
      }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#FF5F56" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#FFBD2E" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#27C93F" }} />
        </div>
        <div style={{
          fontSize: "14px",
          color: isBrutalist ? "#000" : "rgba(255,255,255,0.4)",
          fontFamily: "JetBrains Mono, monospace",
          backgroundColor: isBrutalist ? "#FFF" : "rgba(255,255,255,0.05)",
          padding: "4px 16px",
          borderRadius: "8px",
          border: isBrutalist ? "1px solid #000" : "none"
        }}>
          terminal.sh
        </div>
        <div style={{ width: "52px" }} /> {/* Spacer */}
      </div>

      {/* Editor Content Gutter + Code */}
      <div style={{ display: "flex", padding: "24px", boxSizing: "border-box" }}>
        {/* Line Numbers */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "24px",
          color: "rgba(255,255,255,0.2)",
          marginRight: "24px",
          textAlign: "right",
          userSelect: "none"
        }}>
          <div>1</div>
        </div>

        {/* Code Content */}
        <div style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "24px",
          textAlign: "left",
          lineHeight: 1.4,
          flex: 1
        }}>
          <span style={{ color: "rgba(255,255,255,0.3)", marginRight: "16px" }}>$</span>
          {isBrutalist ? cleanCode : highlightTerminal(cleanCode, accentColor)}
          <span style={{
            display: "inline-block",
            width: "12px",
            height: "22px",
            backgroundColor: accentColor,
            marginLeft: "6px",
            verticalAlign: "middle",
            animation: "blink 1s step-end infinite"
          }} />
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Run verification**

Run: `npm run lint` in the `my-video/` directory.  
Expected: PASS with no TypeScript errors.

**Step 3: Commit**

```bash
git add my-video/src/components/layout/UIBlocks.tsx
git commit -m "feat: upgrade TerminalBlock to VS Code mockup style"
```

---

### Task 2: Redesign FeatureCardBlock (Smart SVG Icon Resolution)

**Files:**
- Modify: `my-video/src/components/layout/UIBlocks.tsx`

**Step 1: Build Smart Icon mapper and update FeatureCardBlock**

Create an SVG resolver mapping text content keywords to beautiful custom SVG paths, and render them in a clean circle on the left of `FeatureCardBlock` in `my-video/src/components/layout/UIBlocks.tsx`:

```typescript
const getSmartIcon = (text: string, color: string) => {
  const t = text.toLowerCase();
  let path = ""; // SVG Path d attribute
  
  if (t.includes("tốc độ") || t.includes("nhanh") || t.includes("speed") || t.includes("performance") || t.includes("hiệu năng")) {
    // Bolt/Speed
    path = "M13 2L3 14h9l-1 8 10-12h-9l1-8z";
  } else if (t.includes("bảo mật") || t.includes("an toàn") || t.includes("secure") || t.includes("auth") || t.includes("khóa")) {
    // Shield/Lock
    path = "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z";
  } else if (t.includes("cloud") || t.includes("đám mây") || t.includes("server") || t.includes("host") || t.includes("deploy")) {
    // Cloud
    path = "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z";
  } else if (t.includes("data") || t.includes("dữ liệu") || t.includes("db") || t.includes("database") || t.includes("lưu trữ")) {
    // Database
    path = "M12 2C6.48 2 2 4.02 2 6.5s4.48 4.5 10 4.5 10-2.02 10-4.5S17.52 2 12 2zm0 18c-5.52 0-10-2.02-10-4.5v-3.5c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5v3.5c0 2.48-4.48 4.5-10 4.5z";
  } else if (t.includes("code") || t.includes("lập trình") || t.includes("dev") || t.includes("api") || t.includes("sdk")) {
    // Code
    path = "M16 18l6-6-6-6M8 6L2 12l6 6";
  } else {
    // Fallback: Checkmark
    path = "M20 6L9 17l-5-5";
  }

  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <path d={path} />
    </svg>
  );
};
```

Update `FeatureCardBlock` component to display the icon:
```typescript
export const FeatureCardBlock: React.FC<{ text: string; theme: string; accentColor: string; hideDot?: boolean }> = ({ text, theme, accentColor, hideDot = false }) => {
  const styles = getThemeStyles(theme, accentColor);
  const isBrutalist = theme === "brutalist";

  return (
    <div style={{
      ...styles.cardStyle,
      display: "flex",
      alignItems: "center",
      gap: "24px",
      fontSize: "30px",
      fontWeight: 600,
      textAlign: "left",
      lineHeight: 1.4,
      borderRadius: isBrutalist ? "0px" : "16px",
      backgroundColor: isBrutalist ? "#ffffff" : "rgba(255, 255, 255, 0.02)",
      border: isBrutalist ? "5px solid #000" : "1px solid rgba(255,255,255,0.08)",
    }}>
      {!hideDot && (
        <div style={{
          width: "60px",
          height: "60px",
          borderRadius: isBrutalist ? "0" : "12px",
          backgroundColor: isBrutalist ? "#FFF" : `${accentColor}15`,
          border: isBrutalist ? "3px solid #000" : `1px solid ${accentColor}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
          {getSmartIcon(text, isBrutalist ? "#000" : accentColor)}
        </div>
      )}
      <span style={{ fontFamily: styles.fontFamily, flex: 1 }}>{text}</span>
    </div>
  );
};
```

**Step 2: Run verification**

Run: `npm run lint` in the `my-video/` directory.  
Expected: PASS with no compiler warnings.

**Step 3: Commit**

```bash
git add my-video/src/components/layout/UIBlocks.tsx
git commit -m "feat: upgrade FeatureCardBlock to use smart SVG icons"
```

---

### Task 3: Redesign HeroMetricBlock (Animated SVG Sparkline Chart)

**Files:**
- Modify: `my-video/src/components/layout/UIBlocks.tsx`

**Step 1: Implement SVG Sparkline inside HeroMetricBlock**

Render an animated sparkline path representing a graph alongside the metric value inside `HeroMetricBlock` in `my-video/src/components/layout/UIBlocks.tsx`:

```typescript
import { useCurrentFrame } from "remotion";

export const HeroMetricBlock: React.FC<{ value: string; subtext: string; theme: string; accentColor: string }> = ({ value, subtext, theme, accentColor }) => {
  const styles = getThemeStyles(theme, accentColor);
  const isBrutalist = theme === "brutalist";
  const frame = useCurrentFrame();
  
  // Animate the sparkline line drawing progress from frame 0 to 30
  const progress = Math.min(1, Math.max(0, frame / 30));
  
  // Custom SVG Sparkline wave path
  const lineLength = 200;
  const strokeDashoffset = lineLength * (1 - progress);

  return (
    <div style={{
      ...styles.cardStyle,
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      borderRadius: isBrutalist ? "0px" : "20px",
      border: isBrutalist ? "5px solid #000" : "1px solid rgba(255,255,255,0.08)",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 2 }}>
        {/* Metric Value */}
        <div style={{
          fontSize: "110px",
          fontWeight: 900,
          color: isBrutalist ? "#000000" : accentColor,
          fontFamily: fontMontserrat,
          lineHeight: 1,
          textShadow: isBrutalist ? "none" : `0 0 40px ${accentColor}25`
        }}>
          {value}
        </div>

        {/* SVG Sparkline Chart */}
        {!isBrutalist && (
          <div style={{ width: "150px", height: "80px" }}>
            <svg width="100%" height="100%" viewBox="0 0 100 50" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id={`grad_${value}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Filled Area under the curve */}
              <path
                d="M 0 45 C 20 40, 40 10, 60 25 C 80 40, 90 5, 100 15 L 100 50 L 0 50 Z"
                fill={`url(#grad_${value})`}
                opacity={progress}
              />
              {/* Animate path stroke */}
              <path
                d="M 0 45 C 20 40, 40 10, 60 25 C 80 40, 90 5, 100 15"
                fill="none"
                stroke={accentColor}
                strokeWidth="3.5"
                strokeDasharray={lineLength}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>

      {subtext && (
        <div style={{
          fontSize: "28px",
          fontWeight: 600,
          color: isBrutalist ? "#333333" : "rgba(255,255,255,0.6)",
          textAlign: "left",
          lineHeight: 1.3,
          fontFamily: styles.fontFamily,
          zIndex: 2
        }}>
          {subtext.includes(" · ") ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>hơn</span>
              <s style={{ textDecorationColor: "#ff3333", textDecorationThickness: "3px" }}>
                {subtext.replace(/^hơn\s+/i, "")}
              </s>
            </div>
          ) : subtext}
        </div>
      )}
    </div>
  );
};
```

**Step 2: Run verification**

Run: `npm run lint` in the `my-video/` directory.  
Expected: PASS with no typescript/eslint issues.

**Step 3: Commit**

```bash
git add my-video/src/components/layout/UIBlocks.tsx
git commit -m "feat: add animated SVG sparkline chart to HeroMetricBlock"
```

---

### Task 4: Add Browser Mockup, Image Ken Burns Effect, and Spring Physics

**Files:**
- Modify: `my-video/src/compositions/DynamicLayout.tsx`

**Step 1: Implement BrowserMockup and upgrade DynamicLayout animations**

Modify `DynamicLayout.tsx` to include `BrowserMockup`, apply `spring` and `interpolate` helpers for animations, and set up Ken Burns scaling for illustrations:

```typescript
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

// CSS-based Browser Window Mockup
export const BrowserMockup: React.FC<{ children: React.ReactNode; accentColor: string }> = ({ children, accentColor }) => {
  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      borderRadius: "16px",
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
      backgroundColor: "#0A0B10"
    }}>
      {/* Mock Browser Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        backgroundColor: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.08)"
      }}>
        {/* Window controls */}
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#FF5F56" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#FFBD2E" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#27C93F" }} />
        </div>
        {/* Address bar */}
        <div style={{
          fontSize: "14px",
          color: "rgba(255,255,255,0.35)",
          fontFamily: "Inter, sans-serif",
          backgroundColor: "rgba(255,255,255,0.05)",
          padding: "4px 30px",
          borderRadius: "8px",
          width: "250px",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
          https://app.io/preview
        </div>
        <div style={{ width: "52px" }} />
      </div>
      {/* Client frame area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
};
```

Update `DynamicLayout` component:
- Integrate spring-based slide animation inside `renderComponent` instead of CSS delays:
```typescript
  // Inside DynamicLayout component
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const renderComponent = (comp: any, overrides = {}) => {
    const delay = typeof comp.data.delay === "number" ? comp.data.delay : 0;
    
    // Remotion native spring config
    const springAnim = spring({
      frame: frame - (delay * fps),
      fps,
      config: { stiffness: 90, damping: 15, mass: 0.8 }
    });

    // Translate spring progress into translation and opacity styles
    const translateY = interpolate(springAnim, [0, 1], [40, 0]);
    const opacity = interpolate(springAnim, [0, 1], [0, 1]);

    let content = null;
    switch (comp.type) {
      case "title":
        content = <TitleBlock text={comp.data.text} theme={theme} accentColor={accentColor} />;
        break;
      case "terminal":
        content = <TerminalBlock code={comp.data.code} theme={theme} accentColor={accentColor} />;
        break;
      case "hero_metric":
        content = <HeroMetricBlock value={comp.data.value} subtext={comp.data.subtext} theme={theme} accentColor={accentColor} />;
        break;
      case "feature_card":
        content = <FeatureCardBlock text={comp.data.text} theme={theme} accentColor={accentColor} {...overrides} />;
        break;
      case "badge_row":
        content = <BadgeRowBlock badges={comp.data.badges} theme={theme} accentColor={accentColor} />;
        break;
      default:
        break;
    }

    if (!content) return null;

    return (
      <div key={comp.id} style={{ transform: `translateY(${translateY}px)`, opacity, width: "100%" }}>
        {content}
      </div>
    );
  };
```

- Update `SplitScreen` layout to wrap image in `BrowserMockup` and apply Ken Burns effect:
```typescript
  // Ken burns zoom effect
  const imageScale = interpolate(frame, [0, 200], [1.0, 1.08], { extrapolateRight: "clamp" });
```
```typescript
  if (cleanLayout === "SplitScreen") {
    return (
      <AbsoluteFill style={{ display: "flex", flexDirection: "row", width: "100%", height: "100%", padding: "60px 40px", boxSizing: "border-box", gap: "40px" }}>
        {/* Left Column (Browser Illustration) */}
        <div style={{ width: "50%", height: "100%", position: "relative" }}>
          <BrowserMockup accentColor={accentColor}>
            {imageUrl ? (
              <Img src={imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${imageScale})` }} />
            ) : (
              <AccentGlowBackground accentColor={accentColor} />
            )}
          </BrowserMockup>
        </div>
        {/* Right Column (Contents) */}
        <div style={{ 
          width: "50%", 
          height: "100%", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center", 
          gap: "35px",
          boxSizing: "border-box"
        }}>
          {resolvedComponents.filter(c => c.type !== "media").map(renderComponent)}
        </div>
      </AbsoluteFill>
    );
  }
```

- Similarly wrap `Gallery` image block inside `BrowserMockup` and scale it.

**Step 2: Run verification**

Run: `npm run lint` in the `my-video/` directory.  
Expected: PASS with no warnings.

**Step 3: Commit**

```bash
git add my-video/src/compositions/DynamicLayout.tsx
git commit -m "feat: add BrowserMockup, Ken Burns scale, and spring physics"
```

---

### Task 5: Add Animated Coordinates and Scrolling Grid to AccentGlowBackground.tsx

**Files:**
- Modify: `my-video/src/components/overlays/AccentGlowBackground.tsx`

**Step 1: Update background coordinates based on frame time**

Modify `AccentGlowBackground.tsx` to shift gradient coordinates using `Math.sin`/`Math.cos` waves on the current frame, and add a scrolling background tech grid:

```typescript
import React from "react";
import { useCurrentFrame } from "remotion";

export const AccentGlowBackground: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  
  // Calculate oscillating coordinates for radial gradients
  const glowX = 50 + 15 * Math.sin(frame / 60);
  const glowY = 50 + 12 * Math.cos(frame / 45);
  
  // Calculate grid scrolling offset
  const gridOffsetY = (frame * 0.8) % 60;

  return (
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "#030408",
      overflow: "hidden"
    }}>
      {/* Tech Grid Background (Overlay) */}
      <div style={{
        position: "absolute",
        top: "-60px",
        left: 0,
        width: "100%",
        height: "calc(100% + 60px)",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.015) 1.5px, transparent 1.5px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1.5px, transparent 1.5px)
        `,
        backgroundSize: "60px 60px",
        transform: `translateY(${gridOffsetY}px)`,
        pointerEvents: "none"
      }} />

      {/* Dynamic Animated Glow Spheres */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${accentColor}18 0%, transparent 65%)`,
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: `radial-gradient(circle at ${100 - glowX}% ${100 - glowY}%, ${accentColor}10 0%, transparent 60%)`,
        pointerEvents: "none"
      }} />
    </div>
  );
};
```

**Step 2: Run verification**

Run: `npm run lint` in the `my-video/` directory.  
Expected: PASS.

**Step 3: Commit**

```bash
git add my-video/src/components/overlays/AccentGlowBackground.tsx
git commit -m "feat: make background glows dynamic and add scrolling grid overlay"
```

---

### Task 6: Implement Scene Transitions (Blur-Sweep) in MainComposition.tsx

**Files:**
- Modify: `my-video/src/compositions/MainComposition.tsx`

**Step 1: Add a transition interpolation in MainComposition**

Implement a 15-frame blur-and-scale cross-fade overlay where scenes overlap or interpolate between scenes in `my-video/src/compositions/MainComposition.tsx`. If it uses a `<Series>` tag, wrap scenes inside a transition container or calculate local transitions per scene.

**Step 2: Run verification**

Run: `npm run lint` in `my-video/`.  
Expected: PASS with 0 errors.

**Step 3: Commit**

```bash
git add my-video/src/compositions/MainComposition.tsx
git commit -m "feat: implement Blur-Sweep transition between scenes"
```
