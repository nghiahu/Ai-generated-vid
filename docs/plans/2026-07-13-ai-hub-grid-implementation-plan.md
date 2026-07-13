# AI Hub Grid Visual Theme Integration Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement the new "AI Hub Grid" visual style across backend compiler schemas, frontend VDE tokens, background coordinate grid overlays, bottom progress bar & glowing watermark, and Storyboard editor selection UI mockups.

**Architecture:** We will register the `ai_hub_grid` theme in the shared `vde_themes.json`. A new overlay `AIHubGridOverlay.tsx` will render a coordinate grid and moving neon blurred lights. `MainComposition.tsx` will render a scrubber progress bar and glowing "AI HUB" text at the bottom.

**Tech Stack:** React, Remotion, Node.js, Express, Gemini API.

---

### Task 1: Add automated compiler test & register AI Hub Grid style
**Files:**
- Modify: `backend/test_vde.js`
- Modify: `my-video/src/styles/vde_themes.json`

**Step 1: Write the failing test**
Append the test function `testAIHubGridStyle` to `backend/test_vde.js`:
```javascript
function testAIHubGridStyle() {
  console.log('- Test: AI Hub Grid Style (ai_hub_grid)');
  const aiHubStyle = vde.getStyle('ai_hub_grid', []);
  assert.strictEqual(aiHubStyle.tokens.colors.background, '#030712', 'AI Hub Grid background must be #030712');
  assert.strictEqual(aiHubStyle.tokens.colors.accent, '#3b82f6', 'AI Hub Grid accent must be #3b82f6');
  assert.strictEqual(aiHubStyle.tokens.fonts.title, 'Be Vietnam Pro, sans-serif', 'AI Hub Grid title font must be Be Vietnam Pro');
  console.log('  => PASS');
}
```
And add `testAIHubGridStyle();` inside the main `try` block.

**Step 2: Run test to verify it fails**
Run: `node backend/test_vde.js`
Expected: FAIL with "Minimalist Dark" fallback (background '#080b11') because the theme does not exist.

**Step 3: Write minimal implementation**
Insert `ai_hub_grid` block definition in `my-video/src/styles/vde_themes.json`:
```json
  "ai_hub_grid": {
    "extends": "minimal",
    "name": "AI Hub Grid",
    "description": "Nền chàm tối với lưới tọa độ kỹ thuật số, quầng sáng xanh dương và các thẻ kính mờ phát sáng viền cyan.",
    "dna": {
      "philosophy": { "oneIdeaPerScene": true, "clarity": 0.95, "minimalism": 0.8 },
      "tone": "tech, futuristic, ambient grid, glow glassmorphism"
    },
    "tokens": {
      "colors": {
        "background": "#030712",
        "cardBg": "linear-gradient(135deg, rgba(8, 17, 37, 0.7) 0%, rgba(3, 7, 18, 0.4) 100%)",
        "border": "1px solid rgba(59, 130, 246, 0.35)",
        "accent": "#3b82f6",
        "text": "#ffffff",
        "textSecondary": "rgba(255, 255, 255, 0.65)"
      },
      "fonts": {
        "title": "Be Vietnam Pro, sans-serif",
        "body": "Be Vietnam Pro, sans-serif"
      },
      "radius": "16px",
      "shadow": "0 0 25px rgba(59, 130, 246, 0.15)"
    },
    "motion": {
      "energy": "medium",
      "style": ["slide-up", "fade"],
      "avoid": ["glitch"]
    }
  }
```

**Step 4: Run test to verify it passes**
Run: `node backend/test_vde.js`
Expected: PASS

**Step 5: Commit**
```bash
git add backend/test_vde.js my-video/src/styles/vde_themes.json
git commit -m "test & feat: register ai_hub_grid theme configuration and compiler test"
```

---

### Task 2: Create AIHubGridOverlay Component & Integrate in Scenes
**Files:**
- Create: `my-video/src/components/overlays/AIHubGridOverlay.tsx`
- Modify: `my-video/src/compositions/MainComposition.tsx`

**Step 1: Create AIHubGridOverlay**
Write the coordinate grid and floating neon ambient light rendering logic in `my-video/src/components/overlays/AIHubGridOverlay.tsx`:
```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const AIHubGridOverlay: React.FC = () => {
  const frame = useCurrentFrame();

  // Low speed orbits for two massive glowing blobs of light
  const x1 = interpolate(Math.sin(frame * 0.008), [-1, 1], [0, 100]);
  const y1 = interpolate(Math.cos(frame * 0.008), [-1, 1], [0, 100]);

  const x2 = interpolate(Math.cos(frame * 0.01), [-1, 1], [100, 0]);
  const y2 = interpolate(Math.sin(frame * 0.01), [-1, 1], [100, 0]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
      {/* Subtle Coordinate Tech Grid */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(rgba(59, 130, 246, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.04) 1px, transparent 1px)",
        backgroundSize: "80px 80px"
      }} />

      {/* Floating Neon Glow Circle 1 (Cyan) */}
      <div style={{
        position: "absolute",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        backgroundColor: "#00f0ff",
        filter: "blur(120px)",
        opacity: 0.1,
        left: `calc(10% + ${x1}px)`,
        top: `calc(15% + ${y1}px)`,
        transform: "translate(-50%, -50%)"
      }} />

      {/* Floating Neon Glow Circle 2 (Blue) */}
      <div style={{
        position: "absolute",
        width: "700px",
        height: "700px",
        borderRadius: "50%",
        backgroundColor: "#3b82f6",
        filter: "blur(140px)",
        opacity: 0.12,
        right: `calc(5% + ${x2}px)`,
        bottom: `calc(10% + ${y2}px)`,
        transform: "translate(50%, 50%)"
      }} />
    </AbsoluteFill>
  );
};
```

**Step 2: Integrate in MainComposition**
Import `AIHubGridOverlay` in `my-video/src/compositions/MainComposition.tsx` and render it inside the `SceneContainer`:
```tsx
import { AIHubGridOverlay } from "../components/overlays/AIHubGridOverlay";
```
Render it alongside other overlays:
```tsx
{/* Overlay Effects Layer */}
{hasOverlayEffects && scene.theme === "japan" && <SakuraOverlay />}
{hasOverlayEffects && scene.theme === "tech" && <TechParticlesOverlay />}
{hasOverlayEffects && scene.theme === "ai_hub_grid" && <AIHubGridOverlay />}
{hasOverlayEffects && scene.theme === "default" && <DefaultBokehOverlay />}
```
Also update `hasOverlayEffects` constraint to make sure it runs on `ai_hub_grid`:
```tsx
const hasOverlayEffects = vdeStyle !== "claude" && vdeStyle !== "light" && vdeStyle !== "apple";
```
(Since `ai_hub_grid` is not one of those three, `hasOverlayEffects` will be true, which is correct).

**Step 3: Run Remotion preview to verify compilation**
Ensure the Remotion project compiles and plays.

**Step 4: Commit**
```bash
git add my-video/src/components/overlays/AIHubGridOverlay.tsx my-video/src/compositions/MainComposition.tsx
git commit -m "feat: implement AIHubGridOverlay and integrate into scene overlays"
```

---

### Task 3: Implement Bottom Scrubber Progress Bar and Watermark
**Files:**
- Modify: `my-video/src/compositions/MainComposition.tsx`

**Step 1: Write scrubber progress bar and glowing watermark**
In `my-video/src/compositions/MainComposition.tsx`, call `useCurrentFrame` at the top level of `MainComposition`:
```tsx
export const MainComposition: React.FC<MainCompositionProps> = ({
  scenes = [],
  config,
  backendUrl = defaultBackendUrl,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame(); // ADD THIS HOOK CALL
```
Then, compute total video frames:
```tsx
  // Calculate total video duration in frames
  const totalDurationFrames = scenes.reduce(
    (sum, scene) => sum + Math.round(safeParseFloat(scene.duration) * fps),
    0
  ) + (config?.ending?.enabled ? Math.round(4.0 * fps) : 0);
  const progressPercent = (frame / Math.max(1, totalDurationFrames)) * 100;
```
Now, update the watermark and progress bar rendering near the end of the return statement:
```tsx
      {/* Watermark Overlay layer */}
      {config?.visualStyle === "ai_hub_grid" ? (
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            color: "#3b82f6",
            fontFamily: "Be Vietnam Pro, sans-serif",
            fontWeight: 900,
            fontSize: "28px",
            letterSpacing: "4px",
            textShadow: "0 0 12px rgba(59, 130, 246, 0.8)",
            opacity: 0.85
          }}
        >
          AI HUB
        </div>
      ) : (
        config?.watermark?.enabled && (
          <div
            style={{
              position: "absolute",
              zIndex: 100,
              padding: "15px 25px",
              // ...existing styles...
```
And add the bottom progress bar:
```tsx
      {config?.visualStyle === "ai_hub_grid" && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: `${progressPercent}%`,
            height: "10px",
            backgroundColor: "#3b82f6",
            boxShadow: "0 0 10px rgba(59, 130, 246, 0.8)",
            zIndex: 101,
            transition: "width 0.1s linear"
          }}
        />
      )}
```

**Step 2: Manual testing**
Verify that the progress bar fills from 0% to 100% smoothly across scenes and the watermark "AI HUB" glows correctly.

**Step 3: Commit**
```bash
git add my-video/src/compositions/MainComposition.tsx
git commit -m "feat: add bottom scrubber progress bar and custom glowing AI HUB watermark"
```

---

### Task 4: Add Theme Selection Selection UI & Preview Mockup in Web Editor
**Files:**
- Modify: `frontend/src/components/StoryboardEditor.jsx`

**Step 1: Register theme in StoryboardEditor styles array**
In `frontend/src/components/StoryboardEditor.jsx`, insert `ai_hub_grid` style definition inside the `styles` array:
```javascript
  {
    id: "ai_hub_grid",
    name: "AI Hub Grid",
    description: "Nền chàm tối với lưới tọa độ kỹ thuật số, quầng sáng xanh dương và các thẻ kính mờ phát sáng viền cyan.",
    primaryColor: "#030712",
    accentColor: "#3b82f6"
  }
```

**Step 2: Code mockup card inside style selection list**
Add visual card mockup rendering in Style Selection Gallery for `ai_hub_grid` matching others like `rikkei` or `claude`:
Inside the style preview card loop:
```jsx
                          {style.id === "ai_hub_grid" && (
                            <div style={{
                              width: "100%",
                              height: "100%",
                              backgroundColor: "#030712",
                              backgroundImage: "linear-gradient(rgba(59, 130, 246, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.04) 1px, transparent 1px)",
                              backgroundSize: "12px 12px",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              padding: "8px",
                              boxSizing: "border-box",
                              position: "relative",
                              overflow: "hidden"
                            }}>
                              {/* Ambient neon circles mock */}
                              <div style={{ position: "absolute", width: "40px", height: "40px", borderRadius: "50%", background: "#00f0ff", filter: "blur(10px)", opacity: 0.15, top: "10%", left: "10%" }} />
                              <div style={{ position: "absolute", width: "50px", height: "50px", borderRadius: "50%", background: "#3b82f6", filter: "blur(12px)", opacity: 0.2, bottom: "10%", right: "10%" }} />
                              
                              <div style={{
                                width: "100%",
                                height: "24px",
                                background: "linear-gradient(135deg, rgba(8, 17, 37, 0.75) 0%, rgba(3, 7, 18, 0.5) 100%)",
                                border: "1px solid rgba(59, 130, 246, 0.4)",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}>
                                <span style={{ fontSize: "7px", color: "#3b82f6", fontWeight: "bold" }}>AI HUB GRID</span>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", zIndex: 2 }}>
                                <div style={{ fontSize: "6px", color: "rgba(59, 130, 246, 0.8)", fontWeight: "bold", letterSpacing: "1px" }}>AI HUB</div>
                                <div style={{ width: "100%", height: "2px", backgroundColor: "#3b82f6" }} />
                              </div>
                            </div>
                          )}
```

Add selection handler or description updates in selection detail rendering too if present.

**Step 3: Manual verification**
Load Frontend Web editor and check the style selection modal. Ensure AI Hub Grid displays the designed miniature preview card.

**Step 4: Commit**
```bash
git add frontend/src/components/StoryboardEditor.jsx
git commit -m "feat: register ai_hub_grid style option and style selection mockup on frontend web editor"
```

---

### Task 5: Register Theme in Backend Gemini Prompt Schema
**Files:**
- Modify: `backend/services/ai.js`

**Step 1: Add ai_hub_grid theme schema definition**
Locate the theme parameter schema (e.g. `allowed: ["japan", "tech", "finance", "nature", "default", "rikkei", "ai_hub_grid"]` or similar) in `backend/services/ai.js` and insert `"ai_hub_grid"` and add instructions in the prompts to set corresponding accentColor to matching electric blue/cyan values (e.g., `#3b82f6` or `#00e5ff`).

**Step 2: Verify server starts**
Start the backend server and ensure no runtime issues.

**Step 3: Commit**
```bash
git add backend/services/ai.js
git commit -m "feat: register ai_hub_grid theme in backend Gemini prompt configuration"
```
