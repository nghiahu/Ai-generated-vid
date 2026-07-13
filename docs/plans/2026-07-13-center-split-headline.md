# Center Constrained Zigzag Split Headline Layout Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Position the zigzag headline block in a horizontally centered 720px container to keep it away from the extreme left/right edges while preserving the zigzag pattern. Keep subcards center-aligned.

**Architecture:** Modify `IntroSplitHeadlineMode.tsx` to set a centered `width: "720px"` on the Headline Group, revert text align/animations to zigzag values, and maintain centered card elements.

**Tech Stack:** React, Remotion, CSS inline styles.

---

### Task 1: Update IntroSplitHeadlineMode component styling

**Files:**
- Modify: [IntroSplitHeadlineMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/IntroSplitHeadlineMode.tsx)

**Step 1: Apply constrained centered layout to the headline group and keep subcards centered**

Update Headline Group container:
```tsx
        {/* ── HEADLINE GROUP (zigzag: left / right / left) ── */}
        <div style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: "720px",
          top: "72px",
          display: "flex",
          flexDirection: "column",
          gap: "4px"
        }}>
```

Update Category Pill to be left-aligned within the centered container:
```tsx
          {/* Category Pill — căn trái */}
          <AnimatedBlock animation="slide-up" delaySeconds={0.1}>
            <div style={{
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "14px"
            }}>
```

Update Line 1 to slide-left and align left:
```tsx
          {/* Line 1 — WHITE, căn TRÁI */}
          {line1 && (
            <AnimatedBlock animation="slide-left" delaySeconds={0.2}>
              <div style={{
                color: isLight ? "#0f172a" : "#ffffff",
                fontSize: `${Math.round(112 * fontScale)}px`,
                lineHeight: 0.93,
                fontWeight: 950,
                letterSpacing: "-0.095em",
                textAlign: "left",
                textTransform: "uppercase" as const,
                textShadow: isLight ? "none" : `rgba(0, 0, 0, 0.66) 0px 26px 64px, rgba(${rgb}, 0.15) 0px 0px 34px`
              }}>
                {line1}
              </div>
            </AnimatedBlock>
          )}
```

Update Line 2 to slide-right and align right:
```tsx
          {/* Line 2 — YELLOW/accent, căn PHẢI */}
          {line2 && (
            <AnimatedBlock animation="slide-right" delaySeconds={0.32}>
              <div style={{
                color: isLight ? accentColor : yellowColor,
                fontSize: `${Math.round(112 * fontScale)}px`,
                lineHeight: 0.93,
                fontWeight: 950,
                letterSpacing: "-0.095em",
                textAlign: "right",
                textTransform: "uppercase" as const,
                textShadow: isLight
                  ? "none"
                  : `rgba(0, 0, 0, 0.66) 0px 26px 64px, rgba(253, 230, 138, 0.22) 0px 0px 48px`
              }}>
                {line2}
              </div>
            </AnimatedBlock>
          )}
```

Update Line 3 to slide-left and align left:
```tsx
          {/* Line 3 — RED, căn TRÁI */}
          {line3 && (
            <AnimatedBlock animation="slide-left" delaySeconds={0.44}>
              <div style={{
                color: isLight ? (darkAccentColor || accentColor) : redColor,
                fontSize: `${Math.round(112 * fontScale)}px`,
                lineHeight: 0.93,
                fontWeight: 950,
                letterSpacing: "-0.095em",
                textAlign: "left",
                textTransform: "uppercase" as const,
                textShadow: isLight ? "none" : `rgba(0, 0, 0, 0.66) 0px 26px 64px, rgba(239, 68, 68, 0.22) 0px 0px 48px`
              }}>
                {line3}
              </div>
            </AnimatedBlock>
          )}
```

**Step 2: Commit changes**

Run:
```bash
git add my-video/src/compositions/layouts/modes/IntroSplitHeadlineMode.tsx
git commit -m "style: constrain zigzag split headline inside centered 720px box"
```

## Verification Plan

### Manual Verification
- Check the Remotion preview page to verify:
  1. The title block is centered overall (the left side of Line 1/3 is aligned at 180px, and the right side of Line 2 is aligned at 180px).
  2. The text maintains the zigzag alignment pattern and animations (`slide-left`/`slide-right`).
  3. Inside each of the 3 subcards, the icon, badge label, and text content are horizontally centered.
