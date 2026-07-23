# Auto Switch to Workspace Editor on AI Generation Complete Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Automatically transition the user interface from Studio AI Gen (`STUDIO_AI_GEN`) to full Storyboard Editor (`WORKSPACE_EDITOR`) as soon as AI video generation finishes.

**Architecture:** Add an `onComplete` callback to `StudioAIGen.jsx` triggered upon generation loop completion. Update `App.jsx` to receive `onComplete`, fetch project details, set `selectedProjectId`, and update `view` state to `"WORKSPACE_EDITOR"`. Also ensure `fetchProjectDetail` in `App.jsx` opens completed AI projects in `"WORKSPACE_EDITOR"`.

**Tech Stack:** React (JSX), JavaScript ES6+

---

### Task 1: Add `onComplete` prop to `StudioAIGen.jsx` and invoke it after video generation

**Files:**
- Modify: [StudioAIGen.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StudioAIGen.jsx#L226-L604)

**Step 1: Add `onComplete` parameter to `StudioAIGen` signature**
In `StudioAIGen.jsx`, update component signature:
```jsx
export const StudioAIGen = ({ projectId = null, onBack = null, onUpdateProjectsList = null, onComplete = null }) => {
```

**Step 2: Trigger `onComplete` upon generation finish in `handleGenerate`**
At the end of `handleGenerate()` in `StudioAIGen.jsx` (around line 597):
```javascript
      setStatusText("✅ Hoàn tất sinh video Studio AI Gen!");

      if (onUpdateProjectsList) {
        onUpdateProjectsList();
      }

      if (onComplete) {
        onComplete(activeProjId);
      }
```

**Step 3: Commit**

```bash
git add frontend/src/components/StudioAIGen.jsx
git commit -m "feat: add onComplete callback trigger to StudioAIGen upon generation completion"
```

---

### Task 2: Connect `onComplete` and navigation routing in `App.jsx`

**Files:**
- Modify: [App.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/App.jsx#L114-L123) and [App.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/App.jsx#L548-L553)

**Step 1: Update `fetchProjectDetail` in `App.jsx` to route completed AI projects to Editor**
In `App.jsx` (lines 114-123):
```javascript
      if (project && project.type === "AIGEN") {
        if (project.scenes && project.scenes.length > 0) {
          setSelectedSceneId(project.scenes[0].id);
          setView("WORKSPACE_EDITOR");
        } else {
          setView("STUDIO_AI_GEN");
        }
      } else {
        if (project && project.scenes && project.scenes.length > 0) {
          setSelectedSceneId(project.scenes[0].id);
          setView("WORKSPACE_EDITOR");
        } else {
          setView("WORKSPACE_SETUP");
        }
      }
```

**Step 2: Pass `onComplete` to `<StudioAIGen />` in `App.jsx`**
In `App.jsx` (around lines 548-553):
```jsx
          {view === "STUDIO_AI_GEN" ? (
            <StudioAIGen
              projectId={selectedProjectId}
              onBack={() => { setSelectedProjectId(null); setView("PROJECTS"); }}
              onUpdateProjectsList={fetchProjects}
              onComplete={async (projId) => {
                await fetchProjects();
                setSelectedProjectId(projId);
                await fetchProjectDetail(projId);
                setView("WORKSPACE_EDITOR");
              }}
            />
          ) : view === "STUDIO" ? (
```

**Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: handle onComplete in App.jsx to auto transition AI video generation to WORKSPACE_EDITOR"
```

---

### Task 3: Verification

**Step 1: Verify frontend build / syntax**
Run syntax check or test load in dev server.

**Step 2: Commit task tracker**

```bash
git add docs/plans/2026-07-23-auto-switch-to-editor-on-aigen-complete.md
git commit -m "docs: add implementation plan for auto switching to Workspace Editor"
```
