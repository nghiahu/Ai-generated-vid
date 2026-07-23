# Scene Loading & Error Handling Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Differentiate between pending scene generation (loading state) and actual dynamic component compilation errors in Studio AI Gen, and provide a single-scene regeneration capability.

**Architecture:** Update `loadComponentFromJS` and `SceneWrapper` in `StudioAIGen.jsx` to render a modern glassmorphism skeleton loader for pending scenes (`isGenerating || isEmpty`), a detailed error card with a single-scene "Regenerate" button for failed scenes, and wire up `handleRegenerateSingleScene`.

**Tech Stack:** React (Frontend), Axios, Remotion Player, Node.js / Express (Backend API).

---

### Task 1: Scene Loading Skeleton & Dynamic Component Error Redesign (`StudioAIGen.jsx`)

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx:13-120`

**Step 1: Enhance `loadComponentFromJS` to return `isEmpty` flag**

Update `loadComponentFromJS` function signature & return object:
```javascript
async function loadComponentFromJS(compiledJS) {
  if (!compiledJS || typeof compiledJS !== "string" || compiledJS.trim() === "") {
    return { Component: null, error: "Empty code content", isEmpty: true };
  }
  try {
    // ... existing dynamic import logic ...
    return { Component: comp, error: null, isEmpty: false };
  } catch (err) {
    return { Component: null, error: err.message, isEmpty: false };
  }
}
```

**Step 2: Redesign `SceneWrapper` Component**

Update `SceneWrapper` props and render branches:
- Add props: `isGenerating`, `isRegenerating`, `onRegenerate`
- When `isEmpty && (isGenerating || isRegenerating)`: render sleek glassmorphism skeleton loader with pulse animation and caption `"🤖 AI đang biên dịch phân cảnh..."`.
- When `loadError && !isGenerating`: render formatted error box with title `"⚠️ KHÔNG THỂ HIỂN THỊ PHÂN CẢNH"` and button `"🔄 Thử sinh lại phân cảnh này"` calling `onRegenerate`.

**Step 3: Test syntax and load state in frontend**

Run: `npm run dev` in `frontend` (already running) and inspect code validity.

**Step 4: Commit**

```bash
git add frontend/src/components/StudioAIGen.jsx
git commit -m "feat: enhance SceneWrapper loading skeleton and error state with regenerate button"
```

---

### Task 2: Implement Single-Scene Regeneration Logic (`StudioAIGen.jsx`)

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx:320-440`

**Step 1: Add `regeneratingIndex` state and `handleRegenerateSingleScene` function**

```javascript
const [regeneratingIndex, setRegeneratingIndex] = useState(null);

const handleRegenerateSingleScene = async (index) => {
  if (regeneratingIndex !== null) return;
  const targetScene = rawScenes[index];
  if (!targetScene) return;

  setRegeneratingIndex(index);
  setStatusText(`🔄 AI đang sinh lại code cho phân cảnh ${index + 1}...`);

  try {
    const activeProjId = projectId || localStorage.getItem("studio_aigen_project_id") || "proj_aigen_draft";
    const res = await api.generateStudioAiGenScene(
      activeProjId,
      targetScene,
      voice,
      theme,
      bgImage,
      refImages
    );

    if (res && res.scene) {
      const updatedScenes = [...rawScenes];
      updatedScenes[index] = res.scene;
      setRawScenes(updatedScenes);
      localStorage.setItem("studio_aigen_raw_scenes", JSON.stringify(updatedScenes));
      setStatusText(`✅ Đã sinh lại thành công phân cảnh ${index + 1}!`);
    }
  } catch (err) {
    console.error("Failed to regenerate scene:", err);
    setErrorMsg("Không thể sinh lại phân cảnh: " + (err.response?.data?.error || err.message));
  } finally {
    setRegeneratingIndex(null);
  }
};
```

**Step 2: Pass `isGenerating`, `isRegenerating`, `onRegenerate` to `SceneWrapper` invocation**

In `StudioAIGen.jsx`:
```javascript
<SceneWrapper
  Component={currentScene?.Component}
  audioUrl={currentScene?.audioUrl}
  loadError={currentScene?.loadError}
  isEmpty={currentScene?.isEmpty}
  heading={currentScene?.heading}
  visualPattern={currentScene?.visualPattern}
  fps={30}
  isGenerating={loading}
  isRegenerating={regeneratingIndex === activeSceneIndex}
  onRegenerate={() => handleRegenerateSingleScene(activeSceneIndex)}
/>
```

**Step 3: Commit**

```bash
git add frontend/src/components/StudioAIGen.jsx
git commit -m "feat: add handleRegenerateSingleScene to StudioAIGen"
```
