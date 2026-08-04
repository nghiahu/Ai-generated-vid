# Split Video Background and Content Media Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Separate project-wide video background image (`config.bgImage`) from scene-specific media, rendering the background globally and the scene media inside device mockup components.

**Architecture:** 
1. Use custom DOM event communication to trigger the StoryboardEditor's existing media modal from the SidebarConfig component.
2. Store the background image in `config.bgImage` via standard prop callbacks.
3. Pass project configuration to the Remotion video engine, rendering `config.bgImage` as full-screen background while keeping scene `imageUrl` within cards/mockups.

**Tech Stack:** React, Remotion, CSS Grid/Flexbox.

---

### Task 1: Update App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Pass onUpdateConfig to StoryboardEditor**
Modify [App.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/App.jsx) to pass `onUpdateConfig` prop to all three instances of `StoryboardEditor`.

```jsx
// Instance 1 (Draft Setup)
onUpdateConfig={setDraftConfig}

// Instance 2 (Workspace Setup Tab)
onUpdateConfig={handleUpdateConfig}

// Instance 3 (Workspace Editor Tab)
onUpdateConfig={handleUpdateConfig}
```

**Step 2: Verify code structure**
Check that there are no syntax errors in `App.jsx`.

**Step 3: Commit**
```bash
git add frontend/src/App.jsx
git commit -m "feat: pass onUpdateConfig prop to StoryboardEditor in App.jsx"
```

---

### Task 2: Update StoryboardEditor.jsx

**Files:**
- Modify: `frontend/src/components/StoryboardEditor.jsx`

**Step 1: Accept onUpdateConfig and set up Custom Event Listener**
Add `onUpdateConfig` to the props list of `StoryboardEditor`. Add a `useEffect` hook to listen to the `"open-bg-image-modal"` custom window event:

```javascript
useEffect(() => {
  const handleOpenBg = () => {
    setMediaModalContext("project-background");
    setActiveUploadSceneId(null);
    setSelectedMedia(config.bgImage ? [config.bgImage] : []);
    setShowMediaModal(true);
  };
  window.addEventListener("open-bg-image-modal", handleOpenBg);
  return () => window.removeEventListener("open-bg-image-modal", handleOpenBg);
}, [config.bgImage]);
```

**Step 2: Handle media modal confirmation for project background**
Modify `handleMediaModalConfirm` in [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx):

```javascript
if (mediaModalContext === 'project-background') {
  const selectedBgImage = selectedMedia[selectedMedia.length - 1] || "";
  if (onUpdateConfig) {
    onUpdateConfig({
      ...config,
      bgImage: selectedBgImage
    });
  }
}
```

**Step 3: Commit**
```bash
git add frontend/src/components/StoryboardEditor.jsx
git commit -m "feat: handle background image selection modal in StoryboardEditor.jsx"
```

---

### Task 3: Update SidebarConfig.jsx

**Files:**
- Modify: `frontend/src/components/SidebarConfig.jsx`

**Step 1: Render Video Background Image Picker**
Add the background image selection widget under the BGM section and above the Watermark section:

```jsx
{/* Video Background Image */}
<div>
  <label className="form-label-mono">Video Background Image</label>
  {config.bgImage ? (
    <div className="border-strict" style={{ padding: "12px", display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#fafafa" }}>
      <img 
        src={config.bgImage} 
        style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1.5px solid #000000" }} 
        alt="video background" 
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{ fontSize: "11px", color: "#666666", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "160px" }}>
          {config.bgImage.substring(config.bgImage.lastIndexOf('/') + 1)}
        </span>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-bg-image-modal"))}
            style={{ background: "none", border: "none", color: "#000000", fontSize: "11px", fontWeight: "bold", cursor: "pointer", textDecoration: "underline", padding: 0 }}
          >
            Thay đổi
          </button>
          <button
            type="button"
            onClick={() => handleConfigChange("bgImage", null)}
            style={{ background: "none", border: "none", color: "#ff3b30", fontSize: "11px", fontWeight: "bold", cursor: "pointer", textDecoration: "underline", padding: 0 }}
          >
            Xóa nền
          </button>
        </div>
      </div>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-bg-image-modal"))}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "12px",
        borderRadius: "6px",
        border: "2px dashed rgba(15, 23, 42, 0.15)",
        background: "#ffffff",
        fontSize: "13px",
        fontWeight: "600",
        color: "#475569",
        cursor: "pointer",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#000000";
        e.currentTarget.style.backgroundColor = "#fafafa";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(15, 23, 42, 0.15)";
        e.currentTarget.style.backgroundColor = "#ffffff";
      }}
    >
      <span>🖼️</span> Chọn ảnh nền video
    </button>
  )}
</div>
```

**Step 2: Commit**
```bash
git add frontend/src/components/SidebarConfig.jsx
git commit -m "feat: add video background image picker to SidebarConfig.jsx"
```

---

### Task 4: Update MainComposition.tsx

**Files:**
- Modify: `my-video/src/compositions/MainComposition.tsx`

**Step 1: Pass config prop to DynamicLayout**
Modify [MainComposition.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/MainComposition.tsx) around line 449 to pass `config={config}`:

```tsx
<DynamicLayout
  layoutType={layoutId}
  heading={scene.heading}
  category={(scene as any).category}
  points={scene.points}
  imageUrl={imageUrl}
  accentColor={scene.accentColor}
  theme={scene.theme && scene.theme !== "default" ? scene.theme : (config?.videoTheme || config?.theme || "glassmorphism")}
  visualStyle={scene.theme && scene.theme !== "default" ? scene.theme : (config?.visualStyle || "rikkei")}
  voiceover={scene.voiceover}
  layoutData={(scene as any).layout}
  themeMetadata={(scene as any).themeMetadata}
  highlightWords={scene.sceneIntent?.highlightWords}
  config={config} // Added
/>
```

**Step 2: Commit**
```bash
git add my-video/src/compositions/MainComposition.tsx
git commit -m "feat: pass config prop to DynamicLayout in MainComposition.tsx"
```

---

### Task 5: Update DynamicLayout.tsx

**Files:**
- Modify: `my-video/src/compositions/layouts/DynamicLayout.tsx`

**Step 1: Accept config prop in DynamicLayoutProps**
Add `config?: any` to `DynamicLayoutProps` on [DynamicLayout.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/DynamicLayout.tsx).

**Step 2: Use config.bgImage for full-screen background rendering**
Change `renderBackground()` function:

```tsx
  const renderBackground = () => {
    const isRikkei = theme === "rikkei";
    const isAiHubGrid = theme === "ai_hub_grid";
    const isFintechEdu = theme === "fintech_edu" || (theme && theme.includes("fintech"));
    
    // Resolve global video background image from project config
    const globalBgImage = config?.bgImage;

    // If global background image is set, render it!
    if (globalBgImage) {
      return (
        <AbsoluteFill style={{ position: "absolute", inset: 0, zIndex: -1, overflow: "hidden", pointerEvents: "none" }}>
          <img 
            src={globalBgImage} 
            style={{ 
              position: "absolute",
              inset: 0,
              width: "100%", 
              height: "100%", 
              objectFit: "cover", 
              opacity: 1.0
            }} 
            alt="Video Background"
          />
        </AbsoluteFill>
      );
    }
```

Ensure it does NOT fall back to rendering `imageUrl` as full-screen background.

**Step 3: Commit**
```bash
git add my-video/src/compositions/layouts/DynamicLayout.tsx
git commit -m "feat: render global bgImage in DynamicLayout.tsx"
```

---

### Task 6: Update IntroMediaHeroMode.tsx

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/IntroMediaHeroMode.tsx`

**Step 1: Render imageUrl inside browser mockup**
Update the macOS mockup container screen area in [IntroMediaHeroMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/IntroMediaHeroMode.tsx):

```tsx
          {/* Media Content Area */}
          <div style={{
            flex: 1,
            position: "relative",
            background: isLight ? "#f8fafc" : "#020617",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {imageUrl && !isDefaultImage(imageUrl) ? (
              <img 
                src={imageUrl} 
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  objectFit: "cover" 
                }} 
                alt="Scene content" 
              />
            ) : (
              renderMockWebUI()
            )}
          </div>
```

**Step 2: Commit**
```bash
git add my-video/src/compositions/layouts/modes/IntroMediaHeroMode.tsx
git commit -m "feat: render scene image inside browser mockup in IntroMediaHeroMode"
```

---

### Task 7: Update MediaShowcaseCardMode.tsx

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/MediaShowcaseCardMode.tsx`

**Step 1: Define isDefaultImage helper and render imageUrl inside smartphone screen**
Add the `isDefaultImage` helper, and modify the phone mockup screen area in [MediaShowcaseCardMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/MediaShowcaseCardMode.tsx):

```tsx
  // Helper to check if imageUrl is a default background asset or invalid
  const isDefaultImage = (url: string) => {
    if (!url) return true;
    const lower = url.toLowerCase();
    
    // Check for invalid/empty/undefined placeholder values
    if (
      lower === "undefined" || 
      lower === "null" || 
      lower.endsWith("/undefined") || 
      lower.endsWith("/null") ||
      lower.includes("placeholder")
    ) {
      return true;
    }
    
    return lower.includes("bg") || lower.includes("background") || lower.includes("circuit") || lower.includes("bokeh");
  };
```

Update screen area:
```tsx
            {/* Screen area */}
            <div style={{
              flex: 1,
              position: "relative",
              background: isLight ? "#ffffff" : "#020617",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {imageUrl && !isDefaultImage(imageUrl) ? (
                <img 
                  src={imageUrl} 
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    objectFit: "cover" 
                  }} 
                  alt="Phone content" 
                />
              ) : (
                renderMockAppUI()
              )}
            </div>
```

**Step 2: Commit**
```bash
git add my-video/src/compositions/layouts/modes/MediaShowcaseCardMode.tsx
git commit -m "feat: render scene image inside smartphone screen mockup in MediaShowcaseCardMode"
```

---

### Task 8: Build Verification

**Step 1: Run Remotion compilation**
Run `npm run build` in the `my-video` folder to ensure everything bundles cleanly.
Expected: Build passes with no React compile errors or unresolved imports.
