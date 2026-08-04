# Signal Rail Bullet Redesign Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Redesign `SignalRailBullet` into a premium two-column layout. The left column contains the scaled-up vertical signal list. The right column displays an animated glassmorphic macOS-style code terminal.

**Architecture:** Update the `isSignalRail` rendering block inside `VerticalListMode.tsx`. Replace the single-column container style with a row flex wrapper. Wrap the list items in a left-column div, and add a glassmorphic terminal panel on the right side. Enhance font sizes and spacing.

**Tech Stack:** React, Remotion, CSS Flexbox, Glassmorphism, CSS keyframes.

---

### Task 1: Redesign VerticalListMode.tsx for SignalRailBullet

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/VerticalListMode.tsx`

**Step 1: Write minimal implementation**
We will rewrite the `isSignalRail` block:
1. Update `containerStyle` to use flex row.
2. Group the items into a left column.
3. Build the right column with macOS window controls, a glowing border, backdrop blur, mock JSON syntax-highlighted code, and a laser scanning line animation.
4. Scale up the font sizes, spacing, dot sizes, and center lines of the list items.

Code replacement outline for `isSignalRail` block:
```typescript
  const isSignalRail = t.id === "SignalRailBullet";
  if (isSignalRail) {
    const visibleComps = otherComps.slice(0, 4);

    const containerStyle: React.CSSProperties = {
      width: "100%",
      maxWidth: t.container?.maxWidth || "960px",
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "48px",
      background: "transparent",
      boxSizing: "border-box",
      zIndex: 5,
      position: "relative"
    };

    const getBlendedColor = (idx: number, total: number) => {
      if (total <= 1) return accentColor;
      const factor = 1.0 - (idx / (total - 1)) * 0.75;
      const blendedRgb = rgb.split(',').map(n => {
        const val = parseInt(n.trim());
        return Math.round(val * factor + 255 * (1 - factor));
      }).join(',');
      return `rgba(${blendedRgb}, 1.0)`;
    };

    return (
      <div style={containerStyle}>
        {/* Style tag for CSS animations */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scanLine {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 0.8; }
            90% { opacity: 0.8; }
            100% { top: 100%; opacity: 0; }
          }
          @keyframes cursorBlink {
            0%, 100% { opacity: 0; }
            50% { opacity: 1; }
          }
        `}} />

        {/* Left Column: Vertical Signal Rail List */}
        <div style={{ flex: 1.1, display: "flex", flexDirection: "column", width: "100%" }}>
          {visibleComps.map((comp, idx) => {
            const animConfig = getAnimationConfig(comp, idx, "slide-up", 0.3 * idx, t);
            const itemColor = getBlendedColor(idx, visibleComps.length);

            const text = comp.data?.text || "";
            const parts = text.split(/[:\-]/);
            let badgeLabel = "";
            let cleanText = "";
            if (parts.length >= 2) {
              badgeLabel = parts[0].trim().toUpperCase();
              cleanText = parts.slice(1).join(":").trim();
            } else {
              badgeLabel = `STEP 0${idx + 1}`;
              cleanText = text.trim();
            }
            if (!cleanText) cleanText = text;

            const itemStyle: React.CSSProperties = {
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              paddingLeft: "76px",
              paddingBottom: idx === visibleComps.length - 1 ? "0px" : "48px",
              minHeight: "90px",
              boxSizing: "border-box",
              width: "100%"
            };

            const dotStyle: React.CSSProperties = {
              position: "absolute",
              left: "11px",
              top: "4px",
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              background: itemColor,
              boxShadow: `0 0 16px ${itemColor}`,
              zIndex: 10
            };

            const lineStyle: React.CSSProperties = {
              position: "absolute",
              left: "22px",
              top: "14px",
              bottom: "-14px",
              width: "4px",
              background: `linear-gradient(180deg, ${itemColor}, ${getBlendedColor(idx + 1, visibleComps.length)})`,
              zIndex: 5,
              transformOrigin: "top center"
            };

            return (
              <div key={comp.id || idx} style={{ position: "relative", width: "100%" }}>
                {idx < visibleComps.length - 1 && <div style={lineStyle} />}

                <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay}>
                  <div style={itemStyle}>
                    <div style={dotStyle} />
                    <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                      <span style={{
                        fontSize: "15px",
                        fontWeight: 900,
                        letterSpacing: "0.15em",
                        color: itemColor,
                        textTransform: "uppercase",
                        marginBottom: "6px",
                        fontFamily: styles.fontFamily
                      }}>
                        {badgeLabel}
                      </span>
                      <span style={{
                        fontSize: getDynamicFontSize(cleanText, 32, fontScale),
                        lineHeight: 1.25,
                        fontWeight: 700,
                        color: isLight ? "#1f2937" : "#ffffff",
                        fontFamily: styles.fontFamily,
                        textTransform: "uppercase"
                      }}>
                        {cleanText}
                      </span>
                    </div>
                  </div>
                </AnimatedBlock>
              </div>
            );
          })}
        </div>

        {/* Right Column: Glassmorphic macOS Terminal */}
        <div style={{
          flex: 1.3,
          height: "380px",
          position: "relative",
          borderRadius: "24px",
          background: isLight
            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(240, 240, 240, 0.7) 100%)"
            : "linear-gradient(135deg, rgba(8, 17, 37, 0.72) 0%, rgba(3, 7, 18, 0.85) 100%)",
          border: isLight ? `1.5px solid rgba(0, 0, 0, 0.08)` : `1.5px solid rgba(255, 255, 255, 0.08)`,
          boxShadow: isLight
            ? "rgba(0, 0, 0, 0.08) 0px 24px 60px, rgba(0, 0, 0, 0.03) 0px 0px 1px inset"
            : `rgba(0, 0, 0, 0.5) 0px 24px 60px, rgba(${rgb}, 0.15) 0px 0px 30px, rgba(255, 255, 255, 0.04) 0px 0px 1px inset`,
          backdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box"
        }}>
          {/* Scanning Line overlay */}
          <div style={{
            position: "absolute",
            left: 0,
            width: "100%",
            height: "4px",
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 12px ${accentColor}`,
            animation: "scanLine 4s infinite linear",
            pointerEvents: "none",
            zIndex: 10
          }} />

          {/* Terminal Titlebar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: isLight ? "1px solid rgba(0, 0, 0, 0.06)" : "1px solid rgba(255, 255, 255, 0.06)",
            background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.01)"
          }}>
            {/* macOS Buttons */}
            <div style={{ display: "flex", gap: "8px", marginRight: "20px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ff5f56" }} />
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ffbd2e" }} />
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#27c93f" }} />
            </div>
            <div style={{
              fontSize: "12px",
              fontWeight: 600,
              color: isLight ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.4)",
              fontFamily: "monospace",
              letterSpacing: "0.05em"
            }}>
              settings.json — VS Code
            </div>
          </div>

          {/* Code Area */}
          <div style={{
            padding: "24px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
            fontSize: "15px",
            lineHeight: 1.5,
            textAlign: "left"
          }}>
            <div style={{ color: isLight ? "#65a30d" : "#84cc16", marginBottom: "4px" }}>
              {"{"}
            </div>
            <div style={{ paddingLeft: "20px", marginBottom: "4px" }}>
              <span style={{ color: accentColor }}>"editor.formatOnSave"</span>
              <span style={{ color: isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)" }}>: </span>
              <span style={{ color: "#38bdf8" }}>true</span>,
            </div>
            <div style={{ paddingLeft: "20px", marginBottom: "4px" }}>
              <span style={{ color: accentColor }}>"linter.autoFix"</span>
              <span style={{ color: isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)" }}>: </span>
              <span style={{ color: isLight ? "#d97706" : "#f59e0b" }}>"always"</span>,
            </div>
            <div style={{ paddingLeft: "20px", marginBottom: "4px" }}>
              <span style={{ color: accentColor }}>"ai.assistant.mode"</span>
              <span style={{ color: isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)" }}>: </span>
              <span style={{ color: isLight ? "#d97706" : "#f59e0b" }}>"agent"</span>,
            </div>
            <div style={{ paddingLeft: "20px", marginBottom: "4px" }}>
              <span style={{ color: accentColor }}>"error.recovery"</span>
              <span style={{ color: isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)" }}>: </span>
              <span style={{ color: isLight ? "#d97706" : "#f59e0b" }}>"auto_catch"</span>
            </div>
            <div style={{ paddingLeft: "20px", display: "flex", alignItems: "center" }}>
              <span style={{
                width: "8px",
                height: "15px",
                background: accentColor,
                display: "inline-block",
                animation: "cursorBlink 1s infinite",
                marginLeft: "2px"
              }} />
            </div>
            <div style={{ color: isLight ? "#65a30d" : "#84cc16", marginTop: "auto" }}>
              {"}"}
            </div>
          </div>
        </div>
      </div>
    );
  }
```

**Step 2: Commit**

```bash
git add my-video/src/compositions/layouts/modes/VerticalListMode.tsx
git commit -m "feat: redesign SignalRailBullet layout with two-column glassmorphic macOS terminal"
```

---

### Task 2: Verification

**Files:**
- Test: none (visual verification)

**Step 1: Verify compilation & lint**

Run: `npm run lint` in `my-video`
Expected: Passes without errors in `VerticalListMode.tsx`

**Step 2: Commit**

```bash
git commit --allow-empty -m "chore: verify layout compiles successfully"
```
