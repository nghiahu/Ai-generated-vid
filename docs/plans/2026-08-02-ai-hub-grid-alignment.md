# AI Hub Grid Flywheel Alignment Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Correct the alignment of the Flywheel layout (`AIHubGrid1` or `Flywheel`) by removing padding on the parent container and aligning all SVG circles, paths, and HTML cards to a single, consistent $1080 \times 1920$ canvas coordinate space.

**Architecture:** We will set padding/padding-top/padding-bottom to `0px` in `TemplateLayout.tsx` for Flywheel layouts. This aligns the `Content layer` coordinates exactly with the screen. Then we will revert `AbsoluteCardsMode.tsx` to a simple `relative` wrapper (filling $1080 \times 1920$ space), add `viewBox="0 0 1080 1920"` to the SVG, and fine-tune Card 1's position to `top: 842px`.

**Tech Stack:** React, Remotion, CSS absolute/relative positioning.

---

### Task 1: Update TemplateLayout.tsx

**Files:**
- Modify: `my-video/src/compositions/layouts/TemplateLayout.tsx`

**Step 1: Write minimal implementation**
We will update `containerStyle` in `TemplateLayout.tsx` to set `padding`, `paddingTop`, and `paddingBottom` to `0px` if `isFlywheel` is true.

```typescript
  const isCenteredLayout = layoutMode === "centered_text";
  const isFlywheel = t.id === "AIHubGrid1" || t.id === "Flywheel";
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: isCenteredLayout ? "center" : (isBottomAligned ? "flex-start" : "center"),
    padding: isFlywheel ? "0px" : (isCenteredLayout ? "0 64px" : "86px"),
    justifyContent: isCenteredLayout ? "center" : (isBottomAligned ? "flex-end" : "flex-start"),
    paddingTop: isFlywheel 
      ? "0px"
      : (isCenteredLayout
        ? "0px"
        : (isBottomAligned
          ? "0px"
          : (layoutMode === "fintech_edu" || layoutMode === "hust_x_rikkei" ? "0px" : (t.container?.paddingTop || "380px")))),
    paddingBottom: isFlywheel ? "0px" : (isCenteredLayout ? "0px" : (isBottomAligned ? "480px" : "86px")),
    boxSizing: "border-box",
    position: "relative",
    width: "100%",
    height: "100%"
  };
```

**Step 2: Commit**

```bash
git add my-video/src/compositions/layouts/TemplateLayout.tsx
git commit -m "style: set padding to 0px for flywheel layouts in TemplateLayout"
```

---

### Task 2: Update AbsoluteCardsMode.tsx

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/AbsoluteCardsMode.tsx`

**Step 1: Write minimal implementation**
We will:
1. Revert the wrapper div to `position: "relative", width: "100%", height: "100%"`.
2. Add `viewBox="0 0 1080 1920"` to the SVG.
3. Change Card 1 `top` to `842` in `circleConfigs`.

```typescript
    // Circle coordinate definitions centered at (540, 1247) with radius 265px (using absolute screen coordinates)
    const circleConfigs = [
      { left: 400, top: 842, size: 280, floatPhase: 0 },
      { left: 630, top: 1240, size: 280, floatPhase: 2 },
      { left: 170, top: 1240, size: 280, floatPhase: 4 }
    ];

    const arrowProgress = interpolate(frame, [25, 80], [300, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    return (
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "visible" }}>
        {/* Defs for arrow marker */}
        <svg style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <marker id="flywheel-arrow" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={accentColor} />
            </marker>
          </defs>
        </svg>

        {/* 1. Header Group (Title & Subtitle) */}
        {titleText && (
          <div style={{
            position: "absolute",
            left: "126px",
            top: "380px",
            width: "828px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            textAlign: "left"
          }}>
            <AnimatedBlock animation="slide-up" delaySeconds={0.15}>
              <h1 style={{
                fontSize: `${Math.round(86 * fontScale)}px`,
                lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.05,
                fontWeight: 900,
                color: isLight ? "#111827" : "#ffffff",
                fontFamily: styles.fontFamily,
                textTransform: "uppercase",
                margin: 0,
                letterSpacing: "-0.04em",
                textShadow: isLight ? "none" : `0 0 20px rgba(${rgb}, 0.25)`
              }}>
                {highlightHeadingText(titleText, accentColor, theme, highlightWords)}
              </h1>
            </AnimatedBlock>

            <AnimatedBlock animation="slide-up" delaySeconds={0.25}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Orange Divider */}
                <div style={{
                  width: "120px",
                  height: "5px",
                  borderRadius: "999px",
                  background: `linear-gradient(90deg, ${accentColor}, transparent)`
                }} />
                {voiceover && (
                  <p style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: isLight ? "rgba(17, 24, 39, 0.88)" : "rgba(255, 255, 255, 0.58)",
                    fontFamily: styles.fontFamily,
                    textTransform: "uppercase",
                    margin: 0,
                    letterSpacing: "0.08em",
                    lineHeight: theme === "ai_hub_grid" ? 1.5 : undefined
                  }}>
                    {voiceover}
                  </p>
                )}
              </div>
            </AnimatedBlock>
          </div>
        )}

        {/* 2. Central Flywheel Loop SVGs */}
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}>
```

**Step 2: Commit**

```bash
git add my-video/src/compositions/layouts/modes/AbsoluteCardsMode.tsx
git commit -m "style: revert Flywheel wrapper to relative and adjust Card 1 top vertical position"
```

---

### Task 3: Verification

**Files:**
- Test: none (visual verification)

**Step 1: Verify compilation & lint**

Run: `npm run lint` in `my-video`
Expected: Passes without errors in `TemplateLayout.tsx` or `AbsoluteCardsMode.tsx`

**Step 2: Commit**

```bash
git commit --allow-empty -m "chore: verify layout compiles successfully"
```
