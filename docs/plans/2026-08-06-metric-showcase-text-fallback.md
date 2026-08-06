# Metric Showcase text fallback with sequential character pop-in Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement a text fallback featuring a staggered letter-by-letter zoom animation for the center area of Metric Showcase Hook layout when no numbers are found in the scene data, and resolve safety array-guards on preview player scenes.

**Architecture:** Detect presence of numbers in resolved metric value. If no numbers are present, fall back to first highlight keyword and render staggered inline character pop-in blocks. Add safety guards in the parent composition to verify scene points array type before executing array prototype operations.

**Tech Stack:** React, TypeScript, Remotion

---

### Task 1: MainComposition Safety Guards

**Files:**
- Modify: [MainComposition.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/MainComposition.tsx#L394-L396)
- Modify: [MainComposition.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/MainComposition.tsx#L506-L510)

**Step 1: Write safety guards**
Change `.some` calls in `MainComposition.tsx` to verify `Array.isArray(scene.points)` first.

```tsx
// Around Line 394
const hasMetrics = Array.isArray(scene.points) && scene.points.some(p => p && p.type === "metric") || false;
const hasTerminal = Array.isArray(scene.points) && scene.points.some(p => p && p.type === "terminal") || false;

// Around Line 506
const hasMetric = Array.isArray(scene.points) && scene.points.some((p) => {
  const item = p as { type?: string; data?: { text?: string } };
  return item && (item.type === "metric" || (item.data?.text && /\d+/.test(item.data.text)));
});
```

**Step 2: Run verification**
Run: `npx tsc --noEmit --skipLibCheck --types react`
Expected: PASS

**Step 3: Commit**
```bash
git add my-video/src/compositions/MainComposition.tsx
git commit -m "fix: add points array-type guards in MainComposition to prevent preview player crashes"
```

---

### Task 2: Highlight Word Fallback in MetricShowcaseHookMode

**Files:**
- Modify: [MetricShowcaseHookMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/MetricShowcaseHookMode.tsx#L91-L94)

**Step 1: Modify fallback block**
Update the fallback logic so it resolves highlightWords even when no digits are present.

```typescript
  // 3. Fallback to highlightWords if metric is still not resolved
  if (!metricValue && highlightWords && highlightWords.length > 0) {
    metricValue = highlightWords[0];
    metricSubtext = /\d+/.test(highlightWords[0]) ? "Thông số nổi bật" : "Từ khóa nổi bật";
  }
```

**Step 2: Run verification**
Run: `npx tsc --noEmit --skipLibCheck --types react`
Expected: PASS

**Step 3: Commit**
```bash
git add my-video/src/compositions/layouts/modes/MetricShowcaseHookMode.tsx
git commit -m "feat: add keyword fallback to metricValue in MetricShowcaseHookMode when no digits exist"
```

---

### Task 3: Character Pop-in Rendering and Animation

**Files:**
- Modify: [MetricShowcaseHookMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/MetricShowcaseHookMode.tsx#L125-L125)
- Modify: [MetricShowcaseHookMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/MetricShowcaseHookMode.tsx#L271-L325)

**Step 1: Declare hasDigits flag and split rendering**
Add `hasDigits` check and rewrite the metric area renderer:

```tsx
  // Around line 125
  const { n1, n2, suffix } = parseNumbers(metricValue);
  const hasDigits = /\d+/.test(metricValue);
```

```tsx
      {/* Around line 271 */}
      {metricValue && (
        <AnimatedBlock animation="scale-in" delaySeconds={0.6}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            marginTop: "15px",
            marginBottom: "15px",
            width: "100%"
          }}>
            <div style={{
              fontSize: `${Math.round(124 * fontScale)}px`,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: "-0.06em",
              color: metricColor,
              fontFamily: styles.fontFamily,
              display: "flex",
              alignItems: "baseline",
              justifyContent: "flex-start",
              width: "100%",
              textShadow: `0 8px 30px rgba(${metricRgb}, 0.25)`
            }}>
              {hasDigits ? (
                <>
                  <span>
                    {n2 !== null && animN2 !== null ? `${animN1.toLocaleString("vi-VN")} - ${animN2.toLocaleString("vi-VN")}` : animN1.toLocaleString("vi-VN")}
                  </span>
                  {suffix && (
                    <span style={{
                      fontSize: `${Math.round(72 * fontScale)}px`,
                      fontWeight: 900,
                      color: metricColor,
                      letterSpacing: "-0.02em",
                      marginLeft: "12px",
                      textTransform: "lowercase"
                    }}>
                      {suffix}
                    </span>
                  )}
                </>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {metricValue.split("").map((char, charIdx) => {
                    const charFrame = frame - countStart - (charIdx * 3);
                    const charOpacity = interpolate(charFrame, [0, 10], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp"
                    });
                    const charScale = interpolate(charFrame, [0, 10], [0.7, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.bezier(0.16, 1, 0.3, 1)
                    });
                    return (
                      <span
                        key={charIdx}
                        style={{
                          display: "inline-block",
                          opacity: charOpacity,
                          transform: `scale(${charScale})`,
                          transformOrigin: "center bottom",
                          color: metricColor,
                          whiteSpace: char === " " ? "pre" : "normal"
                        }}
                      >
                        {char}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            {metricSubtext && (
              <div style={{
                fontSize: "22px",
                fontWeight: 800,
                color: isLight ? "#475569" : "#94a3b8",
                letterSpacing: "0.05em",
                marginTop: "14px",
                fontFamily: styles.fontFamily,
                textAlign: "left"
              }}>
                {metricSubtext}
              </div>
            )}
          </div>
        </AnimatedBlock>
      )}
```

**Step 2: Run verification**
Run type checking and bundle checking:
`npx tsc --noEmit --skipLibCheck --types react`
`npm run build` (inside `my-video` folder)
Expected: PASS

**Step 3: Commit**
```bash
git add my-video/src/compositions/layouts/modes/MetricShowcaseHookMode.tsx
git commit -m "feat: implement sequential pop-in staggered letters animation for keyword fallback"
```
