# Rescaled Video UI Components Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Scale up all video layout UI blocks and overall layout spacings by ~1.8x to 2.2x to make them legible and visually proportional on a vertical HD video (1080x1920) and in the scaled-down player preview.

**Architecture:** Modify pixel-based style values (fontSizes, paddings, gaps, and sizes) in `UIBlocks.tsx`, update structural heights in `layoutResolver.ts` to prevent premature truncation/omission by the layout resolver, and adjust gaps and layout margins in `DynamicLayout.tsx`.

**Tech Stack:** React, TypeScript, Remotion

---

### Task 1: Update UI Block Styles

**Files:**
*   Modify: `my-video/src/components/layout/UIBlocks.tsx`

**Step 1: Write target modifications**
Modify `getThemeStyles`, `TitleBlock`, `TerminalBlock`, `HeroMetricBlock`, `FeatureCardBlock`, and `BadgeRowBlock` to scale up fonts, paddings, and borders.

Below is the complete replacements to apply:

```typescript
// Replace lines 10-41 (cardStyle inside getThemeStyles)
    cardStyle: {
      padding: "32px 40px",
      width: "100%",
      boxSizing: "border-box" as const,
      transition: "all 0.2s ease-in-out",
      ...(isBrutalist ? {
        backgroundColor: "#ffffff",
        border: "5px solid #000000",
        boxShadow: "10px 10px 0px 0px #000000",
        borderRadius: "0px",
        color: "#000000"
      } : isCyber ? {
        backgroundColor: "rgba(2, 2, 6, 0.85)",
        border: `2.5px solid ${accentColor}`,
        boxShadow: `0 0 20px ${accentColor}25`,
        borderRadius: "8px",
        color: "#ffffff"
      } : isMinimal ? {
        backgroundColor: "#fafafa",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        color: "#0f172a"
      } : {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 16px 48px 0 rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: "24px",
        color: "#ffffff"
      })
    }

// Replace TitleBlock styling (lines 53-81)
      <div style={{ display: "flex" }}>
        <span style={{
          fontSize: "22px",
          fontFamily: "Space Grotesk, monospace",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "5px",
          padding: "10px 22px",
          borderRadius: isBrutalist ? "0px" : "36px",
          border: isBrutalist ? "3px solid #000000" : `2.5px solid ${accentColor}`,
          color: isBrutalist ? "#000000" : accentColor,
          backgroundColor: isBrutalist ? "#ffffff" : `${accentColor}15`,
        }}>
          • FEATURE INFO •
        </span>
      </div>

      <h1 style={{
        fontSize: text.length > 25 ? "80px" : "105px",
        lineHeight: 0.95,
        margin: 0,
        color: isBrutalist ? "#000000" : "#ffffff",
        fontWeight: 900,
        fontFamily: styles.fontFamily,
        textTransform: "uppercase",
        letterSpacing: "-0.01em",
        textShadow: isBrutalist ? "none" : `0 8px 30px rgba(0,0,0,0.5), 0 0 20px ${accentColor}15`
      }}>
        {text}
      </h1>

// Replace TerminalBlock styling (lines 92-113)
    <div style={{
      ...styles.cardStyle,
      backgroundColor: isBrutalist ? "#ffffff" : "#020308",
      border: isBrutalist ? "5px solid #000000" : `2.5px solid ${accentColor}`,
      padding: "28px",
      display: "flex",
      flexDirection: "column",
      gap: "14px"
    }}>
      {/* Top Header */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", borderBottom: `2.5px solid ${isBrutalist ? "#000" : "rgba(255,255,255,0.08)"}`, paddingBottom: "14px" }}>
        <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: isBrutalist ? "#000" : "#ff5f56" }} />
        <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: isBrutalist ? "#000" : "#ffbd2e" }} />
        <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: isBrutalist ? "#000" : "#27c93f" }} />
        <span style={{ fontSize: "18px", color: isBrutalist ? "#000" : "rgba(255,255,255,0.3)", marginLeft: "14px", fontFamily: "JetBrains Mono, monospace" }}>bash</span>
      </div>
      {/* Code Area */}
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "28px", color: isBrutalist ? "#000000" : "#00FF66", textAlign: "left", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
        <span style={{ color: isBrutalist ? "#555" : "rgba(255,255,255,0.35)", marginRight: "16px" }}>$</span>
        {cleanCode}
        <span style={{ display: "inline-block", width: "14px", height: "26px", backgroundColor: isBrutalist ? "#000000" : "#00FF66", marginLeft: "6px" }} />
      </div>
    </div>

// Replace HeroMetricBlock styling (lines 129-156)
      <div style={{
        fontSize: "128px",
        fontWeight: 900,
        color: isBrutalist ? "#000000" : accentColor,
        fontFamily: "Space Grotesk, Impact, sans-serif",
        lineHeight: 1
      }}>
        {value}
      </div>
      {subtext && (
        <div style={{
          fontSize: "32px",
          fontWeight: 600,
          color: isBrutalist ? "#333333" : "rgba(255,255,255,0.6)",
          textAlign: "left",
          lineHeight: 1.2,
          fontFamily: styles.fontFamily
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

// Replace FeatureCardBlock styling (lines 166-184)
    <div style={{
      ...styles.cardStyle,
      display: "flex",
      alignItems: "center",
      gap: "24px",
      fontSize: "32px",
      fontWeight: 700,
      textAlign: "left",
      lineHeight: 1.4
    }}>
      <span style={{
        width: "12px",
        height: "12px",
        backgroundColor: isBrutalist ? "#000000" : accentColor,
        flexShrink: 0
      }} />
      <span style={{ fontFamily: styles.fontFamily }}>{text}</span>
    </div>

// Replace BadgeRowBlock styling (lines 192-211)
    <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", width: "100%", justifyContent: "flex-start" }}>
      {badges.map((bg, idx) => (
        <span
          key={idx}
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            padding: "12px 24px",
            borderRadius: isBrutalist ? "0px" : "12px",
            border: isBrutalist ? "3px solid #000000" : "1px solid rgba(255,255,255,0.08)",
            backgroundColor: isBrutalist ? "#ffffff" : "rgba(255,255,255,0.03)",
            boxShadow: isBrutalist ? "4px 4px 0px 0px #000000" : "none",
            color: isBrutalist ? "#000" : "#ffffff",
            fontFamily: styles.fontFamily
          }}
        >
          {bg}
        </span>
      ))}
    </div>
```

**Step 2: Verify compilation and syntax**
Run: `npm run lint` in `c:\Users\nghia\OneDrive\Máy tính\AI-grenerated vid-hyperframe\my-video`
Expected: Passes without typescript/lint errors in `UIBlocks.tsx`.

**Step 3: Commit changes**
Run:
```bash
git add my-video/src/components/layout/UIBlocks.tsx
git commit -m "style: scale up UI blocks typography and padding for 1080x1920 viewport"
```

---

### Task 2: Update Constraint Height Estimates in Layout Resolver

**Files:**
*   Modify: `my-video/src/utils/layoutResolver.ts`

**Step 1: Write target modifications**
Modify `parseSceneToComponents` heights to reflect rescaled block heights:
*   `title` height: `180` $\rightarrow$ `280`
*   `terminal` height: `140` $\rightarrow$ `220`
*   `badge_row` height: `80` $\rightarrow$ `130`
*   `hero_metric` height: `180` $\rightarrow$ `260`
*   `feature_card` height: `100` $\rightarrow$ `150`
*   `media` height: `380` $\rightarrow$ `450`

**Step 2: Verify compilation**
Run: `npm run lint` in `my-video`
Expected: PASS

**Step 3: Commit changes**
Run:
```bash
git add my-video/src/utils/layoutResolver.ts
git commit -m "feat: adjust layout resolver height bounds to accommodate scaled components"
```

---

### Task 3: Adjust Layout Container Spacing and Margins

**Files:**
*   Modify: `my-video/src/compositions/DynamicLayout.tsx`

**Step 1: Write target modifications**
Modify `DynamicLayout` component container padding, item gaps, and layout specific widths/gaps:
*   Default layout absolute container `padding`: `60px 40px` $\rightarrow$ `100px 60px`
*   Default layout absolute container `gap`: `30px` $\rightarrow$ `50px`
*   `SplitScreen`: container padding `50px 30px` $\rightarrow$ `80px 40px`, gap `24px` $\rightarrow$ `40px`
*   `FeatureGrid`: gap `16px` $\rightarrow$ `28px`
*   `Timeline`: padding `60px 40px` $\rightarrow$ `100px 60px`, gap `30px` $\rightarrow$ `50px`, line indent `paddingLeft: "35px" -> "55px"`, `marginLeft: "15px" -> "25px"`, circle node size `30px` $\rightarrow$ `50px` (and adjust circle line-height / position offsets), dashed line `left: "-51px"` $\rightarrow$ `"-83px"`, circle font size `12px` $\rightarrow$ `22px`.
*   `Comparison`: gap `20px` $\rightarrow$ `35px`, header tag labels font-size `12px` $\rightarrow$ `22px`
*   `Dashboard`: gap `16px` $\rightarrow$ `28px`
*   `Gallery`: image container `height: "380px" -> "450px"`, gap `30px` $\rightarrow$ `50px`

**Step 2: Verify compilation**
Run: `npm run lint` in `my-video`
Expected: PASS

**Step 3: Commit changes**
Run:
```bash
git add my-video/src/compositions/DynamicLayout.tsx
git commit -m "style: expand layout containers and gap sizes in DynamicLayout"
```

---

### Task 4: Visual Integration Testing & Completion

**Step 1: Open Remotion preview**
Confirm Remotion Player preview or Remotion Studio shows correctly scaled blocks.
Expected: Larger elements, legible category badges, comfortable spacing.
Run: Build package bundle verification to ensure full artifact production runs fine.
Run: `npm run build` in `my-video`
Expected: Passes bundling.
