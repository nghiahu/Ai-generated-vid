# Selector Wheel Radio Layout Fix Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Correct the Selector Wheel Radio layout to display as a circular wheel in portrait (9:16) mode, with static center text "SELECT" and dynamic options highlighted by prefixing a star `*` in the input data.

**Architecture:** 
1. Exclude the `SelectorWheelRadio` layout ID from the automatic vertical stacking in `areaResolver.ts`.
2. Fix overlapping positions and uncentered middle coordinates in `selector_wheel_radio.json`.
3. Implement a custom render block inside `AbsoluteCardsMode.tsx` for `SelectorWheelRadio` displaying concentric pulse rings, static SELECT center, and 3 option cards with customized radio button styling and dynamic selection checks.

**Tech Stack:** React, Remotion, CSS, TypeScript

---

### Task 1: Stacking Exemption
Exempt the `SelectorWheelRadio` layout ID from portrait mode vertical stacking in [areaResolver.ts](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/utils/areaResolver.ts).

**Files:**
* Modify: [areaResolver.ts](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/utils/areaResolver.ts#L13-L30)

**Step 1: Write the minimal implementation**
Exempt `layoutId === "SelectorWheelRadio"` in the main check of [areaResolver.ts](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/utils/areaResolver.ts#L20-L29):
```typescript
  if (
    !isVertical || 
    layoutId === "IntroMapPinsImage" || 
    layoutId === "MapPinsHook" || 
    layoutId === "AIHubGrid2" || 
    layoutId === "WindingRoadmap" ||
    layoutId === "SelectorWheelRadio"
  ) {
    // Return original positions for map pins, roadmap, and wheel layouts
    return positions;
  }
```

**Step 2: Run linter to verify code compiles**
Run: `npm run lint` in `c:\Users\nghia\OneDrive\Máy tính\AI-grenerated vid-hyperframe\my-video`
Expected: PASS (no typescript errors)

**Step 3: Commit**
```bash
git add src/utils/areaResolver.ts
git commit -m "fix(layout): exempt SelectorWheelRadio from portrait auto-vertical stacking"
```

---

### Task 2: Fix Coordinate Positions in JSON
Correct coordinates in the [selector_wheel_radio.json](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/templates/List-Step/selector_wheel_radio.json) file.

**Files:**
* Modify: [selector_wheel_radio.json](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/templates/List-Step/selector_wheel_radio.json#L22-L75)

**Step 1: Write minimal implementation**
Replace the `positions` array in `selector_wheel_radio.json` with the following:
```json
  "positions": [
    {
      "left": "375px",
      "top": "206px",
      "width": "158px",
      "height": "158px",
      "zIndex": "2",
      "nestedStructure": {
        "type": "card_simple",
        "badgeText": null,
        "titleText": null,
        "pills": []
      }
    },
    {
      "left": "289px",
      "top": "0px",
      "width": "330px",
      "height": "130px",
      "zIndex": "1",
      "nestedStructure": {
        "type": "card_simple",
        "badgeText": "Option A",
        "titleText": "",
        "pills": []
      }
    },
    {
      "left": "0px",
      "top": "220px",
      "width": "360px",
      "height": "148px",
      "zIndex": "1",
      "nestedStructure": {
        "type": "card_simple",
        "badgeText": "Option B",
        "titleText": "",
        "pills": []
      }
    },
    {
      "left": "548px",
      "top": "220px",
      "width": "360px",
      "height": "130px",
      "zIndex": "1",
      "nestedStructure": {
        "type": "card_simple",
        "badgeText": "Option C",
        "titleText": "",
        "pills": []
      }
    }
  ],
```

**Step 2: Commit**
```bash
git add src/compositions/layouts/templates/List-Step/selector_wheel_radio.json
git commit -m "fix(layout): correct coordinates for Selector Wheel Radio options and center circle"
```

---

### Task 3: Implement Wheel & Radio Render Logic
Add custom rendering logic for the layout in [AbsoluteCardsMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/AbsoluteCardsMode.tsx).

**Files:**
* Modify: [AbsoluteCardsMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/AbsoluteCardsMode.tsx#L222-L224)

**Step 1: Write minimal implementation**
Insert custom check and return code for `SelectorWheelRadio` right before `const isFlywheel` declaration:
```typescript
  const isSelectorWheelRadio = t.id === "SelectorWheelRadio";

  if (isSelectorWheelRadio) {
    const optionComps = otherComps.slice(0, 3);
    
    // Concentric pulse rings scaling and opacity based on current video frame
    const ring1Scale = interpolate(frame, [0, 90], [1.0, 1.45], { extrapolateRight: "clamp" });
    const ring1Opacity = interpolate(frame, [0, 90], [0.35, 0], { extrapolateRight: "clamp" });
    
    const ring2Scale = interpolate(frame, [20, 110], [1.0, 1.45], { extrapolateRight: "clamp" });
    const ring2Opacity = interpolate(frame, [20, 110], [0.35, 0], { extrapolateRight: "clamp" });

    return (
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "visible" }}>
        {/* Glowing concentric background rings SVG */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
          <circle
            cx={454}
            cy={285}
            r={79 * ring1Scale}
            fill="none"
            stroke={accentColor}
            strokeWidth={2}
            opacity={ring1Opacity}
          />
          <circle
            cx={454}
            cy={285}
            r={79 * ring2Scale}
            fill="none"
            stroke={accentColor}
            strokeWidth={2}
            opacity={ring2Opacity}
          />
        </svg>

        {/* 1. Static SELECT center circle */}
        {(() => {
          const centerPos = resolvedPositions[0];
          return (
            <div style={{
              position: "absolute",
              left: centerPos.left,
              top: centerPos.top,
              width: centerPos.width,
              height: centerPos.height,
              zIndex: 10
            }}>
              <AnimatedBlock animation="scale-in" delaySeconds={0.15}>
                <div style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "999px",
                  background: isLight 
                    ? "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(243, 244, 246, 0.95))"
                    : "linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.75))",
                  border: `2.5px solid ${accentColor}`,
                  boxShadow: isLight ? `0 8px 30px rgba(${rgb}, 0.15)` : `0 0 25px rgba(${rgb}, 0.45)`,
                  display: "grid",
                  placeItems: "center"
                }}>
                  <span style={{
                    fontSize: "24px",
                    fontWeight: 900,
                    color: isLight ? "#1f2937" : "#ffffff",
                    fontFamily: styles.fontFamily,
                    letterSpacing: "0.08em"
                  }}>
                    SELECT
                  </span>
                </div>
              </AnimatedBlock>
            </div>
          );
        })()}

        {/* 2. Outer dynamic option cards */}
        {optionComps.map((comp, idx) => {
          const optionIdx = idx + 1; // Maps to positions 1, 2, 3
          const pos = resolvedPositions[optionIdx] || { left: "0px", top: "0px", width: "100%", height: "auto" };
          const itemStyleSetting = t.items.itemStyles[optionIdx] || { fontSize: "28px" };
          const rotation = t.items.rotations[optionIdx] || 0;

          const text = comp.data?.text || "";
          const isSelected = text.startsWith("*");
          const cleanText = isSelected ? text.slice(1).trim() : text;

          const cardWrapperStyle: React.CSSProperties = {
            position: "absolute",
            left: pos.left,
            top: pos.top,
            width: pos.width,
            height: pos.height,
            zIndex: parseInt(pos.zIndex || "1"),
            transform: `rotate(${rotation}deg)`,
            boxSizing: "border-box"
          };

          const cardInnerStyle: React.CSSProperties = {
            width: pos.width,
            height: pos.height,
            borderRadius: itemStyleSetting.borderRadius || "26px",
            padding: resolvePadding(itemStyleSetting.padding || "20px 22px", paddingScale),
            background: isSelected
              ? `linear-gradient(135deg, rgba(${rgb}, 0.2), rgba(${rgb}, 0.08))`
              : isLight
                ? "rgba(255, 255, 255, 0.85)"
                : "rgba(255, 255, 255, 0.03)",
            border: isSelected
              ? `2.5px solid ${accentColor}`
              : isLight
                ? "1.5px solid rgba(0, 0, 0, 0.08)"
                : `1.5px solid rgba(${rgb}, 0.22)`,
            boxShadow: isSelected
              ? isLight
                ? `rgba(${rgb}, 0.18) 0px 12px 28px`
                : `rgba(${rgb}, 0.25) 0px 15px 35px, 0px 0px 20px rgba(${rgb}, 0.35)`
              : "none",
            backdropFilter: "blur(16px) saturate(1.15)",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            boxSizing: "border-box",
            overflow: "hidden"
          };

          const animConfig = getAnimationConfig(comp, idx, "scale-in", 0.3, t);
          const badgeLabel = pos.nestedStructure?.badgeText || `Option ${String.fromCharCode(65 + idx)}`;

          return (
            <div key={comp.id || idx} style={cardWrapperStyle}>
              <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay}>
                <div style={cardInnerStyle}>
                  {/* Left Column: Radio button indicator */}
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: `2.5px solid ${isSelected ? accentColor : (isLight ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.45)")}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "18px",
                    flexShrink: 0,
                    boxShadow: isSelected ? `0 0 10px rgba(${rgb}, 0.5)` : "none",
                    background: isLight ? "rgba(255,255,255,0.8)" : "transparent"
                  }}>
                    {isSelected && (
                      <div style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: accentColor,
                        boxShadow: `0 0 8px ${accentColor}`
                      }} />
                    )}
                  </div>

                  {/* Right Column: Text content */}
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    textAlign: "left",
                    justifyContent: "center",
                    overflow: "hidden"
                  }}>
                    <span style={{
                      fontSize: "12px",
                      fontWeight: 900,
                      letterSpacing: "0.15em",
                      color: isSelected ? accentColor : (isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.55)"),
                      textTransform: "uppercase",
                      marginBottom: "4px"
                    }}>
                      {badgeLabel}
                    </span>
                    <span style={{
                      fontSize: getDynamicFontSize(cleanText, 22, fontScale),
                      lineHeight: 1.15,
                      fontWeight: isSelected ? 800 : 700,
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
    );
  }
```

**Step 2: Run linter to verify code compiles**
Run: `npm run lint` in `c:\Users\nghia\OneDrive\Máy tính\AI-grenerated vid-hyperframe\my-video`
Expected: PASS (no typescript errors)

**Step 3: Commit**
```bash
git add src/compositions/layouts/modes/AbsoluteCardsMode.tsx
git commit -m "feat(layout): implement custom layout rendering and dynamic selection checking for SelectorWheelRadio"
```
