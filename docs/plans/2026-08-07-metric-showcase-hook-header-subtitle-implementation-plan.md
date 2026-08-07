# Metric Showcase Hook Header Spacing and Subtitle Enhancements Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Fix diacritic character clipping and layout squishing on the header, enlarge subtitle text size, and dynamically bind subtitle highlights to the visual theme's active accent color.

**Architecture:**
- Adjust `lineHeight` and add `paddingTop` in the `MetricShowcaseHookMode` component's title styles.
- Adjust subtitle template size properties inside `metric_showcase_hook.json` configuration file.
- Update `DynamicSubtitle` prop-passing inside `MainComposition.tsx` to pull dynamically from theme `vdeTokens.colors.accent`.

**Tech Stack:** React, Remotion, TypeScript

---

### Task 1: Adjust Line Height and Top Spacing of the Header

**Files:**
- Modify: [MetricShowcaseHookMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/MetricShowcaseHookMode.tsx)

**Step 1: Write minimal code implementation**
Update `lineHeight` from `0.95` to `1.15` and add `paddingTop: "12px"` inside the style object of the heading container:
```tsx
          <div style={{
            fontSize: `${Math.round(108 * fontScale)}px`,
            lineHeight: 1.15,
            fontWeight: 950,
            letterSpacing: "-0.07em",
            textAlign: "left",
            textTransform: "uppercase",
            fontFamily: styles.fontFamily,
            backgroundImage: shimmerGradient,
            backgroundSize: "200% auto",
            backgroundPosition: `${shimmerPos}% center`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: isLight ? "none" : `drop-shadow(0 4px 16px rgba(255, 255, 255, 0.12))`,
            paddingTop: "12px",
            marginBottom: "10px",
            width: "100%",
            wordBreak: "break-word"
          }}>
```

**Step 2: Run verification**
Compile the video code locally to ensure no syntax/compilation issues:
Run: `npx tsc --noEmit` inside `c:\Users\nghia\OneDrive\Máy tính\AI-grenerated vid-hyperframe\my-video`
Expected: PASS with no compilation errors.

**Step 3: Commit**
```bash
git add my-video/src/compositions/layouts/modes/MetricShowcaseHookMode.tsx
git commit -m "style(video): increase header line-height and add padding-top in MetricShowcaseHookMode to prevent text clipping"
```

---

### Task 2: Increase Subtitle Font Size in Template JSON

**Files:**
- Modify: [metric_showcase_hook.json](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/templates/Opening-Headline/metric_showcase_hook.json)

**Step 1: Write minimal code implementation**
Change the `"fontSize"` inside the `"subtitle"` block from `"44px"` to `"56px"`:
```json
  "subtitle": {
    "bottom": "300px",
    "fontSize": "56px",
    "fontWeight": "950",
    "useThemeTextShadow": true
  }
```

**Step 2: Commit**
```bash
git add my-video/src/compositions/layouts/templates/Opening-Headline/metric_showcase_hook.json
git commit -m "style(video): increase subtitle font size to 56px in MetricShowcaseHook template JSON"
```

---

### Task 3: Bind Subtitle Active Highlight Color to Theme Dynamic Accent Color

**Files:**
- Modify: [MainComposition.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/MainComposition.tsx)

**Step 1: Write minimal code implementation**
Update `accentColor` inside both `<DynamicSubtitle>` calls to use `vdeTokens.colors.accent`:
```tsx
                      <DynamicSubtitle
                        voiceover={scene.voiceover}
                        durationSeconds={safeParseFloat(scene.duration)}
                        voiceoverDuration={(scene as any).voiceoverDuration}
                        subtitlesJson={scene.subtitlesJson || (scene as any).voiceoverTtsJson}
                        accentColor={vdeTokens.colors.accent}
                        visualStyle={vdeStyle}
                      />
```
and
```tsx
                    <DynamicSubtitle
                      voiceover={scene.voiceover}
                      durationSeconds={safeParseFloat(scene.duration)}
                      voiceoverDuration={scene.voiceoverDuration}
                      subtitlesJson={scene.subtitlesJson}
                      accentColor={vdeTokens.colors.accent}
                      visualStyle={vdeStyle}
                      customSubtitle={getLayoutById(layoutId)?.templateJson?.subtitle}
                    />
```

**Step 2: Run verification**
Compile the code locally:
Run: `npx tsc --noEmit` inside `c:\Users\nghia\OneDrive\Máy tính\AI-grenerated vid-hyperframe\my-video`
Expected: PASS with no compilation errors.

**Step 3: Commit**
```bash
git add my-video/src/compositions/MainComposition.tsx
git commit -m "feat(video): dynamically bind subtitle accentColor to active theme token colors.accent"
```
