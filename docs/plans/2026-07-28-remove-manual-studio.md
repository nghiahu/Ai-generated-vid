# Remove Manual Studio & Filter AI Gen Only Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Remove the manual Studio sidebar option and page views while simplifying the Dashboard to show only AI Gen projects. Also, clean up the workspace editor header tabs, simplify the scene cards in `StoryboardEditor`, and add AI code regeneration support directly inside the simplified scene editor.

**Architecture:** Modify `App.jsx` navigation, header, workspace layout conditional, and update `Dashboard.jsx` to remove tab layout and only filter projects of type AIGEN. Simplify `StoryboardEditor.jsx` elements and add custom API trigger for scene code regeneration.

**Tech Stack:** React, CSS.

---

### Task 1: Update App Navigation and Routing

**Files:**
- Modify: `frontend/src/App.jsx`

*(This task was completed in Batch 1)*

---

### Task 2: Simplify Dashboard to Show Only AI Gen Projects

**Files:**
- Modify: `frontend/src/components/Dashboard.jsx`

*(This task was completed in Batch 1)*

---

### Task 3: Clean up Project Header and Workspace view

**Files:**
- Modify: `frontend/src/App.jsx`

*(This task was completed in Batch 1)*

---

### Task 4: Clean up StudioAIGen.jsx tabs and preview layout

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx:906-950`
- Modify: `frontend/src/components/StudioAIGen.jsx:1429-1707` (or corresponding preview block)
- Modify: `frontend/src/components/StudioAIGen.jsx` (on successful generation, invoke `onGenerationSuccess` prop callback)

**Step 1: Write the failing test**

We don't have unit tests, so we will verify compilation.

**Step 2: Run verification**

Run: `npm run dev` in `frontend` directory.
Expected: Build passes.

**Step 3: Write minimal implementation**

- Remove the tabs button container from `StudioAIGen.jsx`.
- Remove the preview view condition rendering completely.
- Invoke `onGenerationSuccess(newProj.id)` if provided in `StudioAIGen.jsx` at the end of the `handleSubmit` script generation.

**Step 4: Run verification**

Run: `npm run dev` and ensure no compile errors.
Expected: Build passes.

**Step 5: Commit**

```bash
git add frontend/src/components/StudioAIGen.jsx
git commit -m "feat: remove preview mode and tabs from StudioAIGen"
```

---

### Task 5: Simplify scene editor cards in StoryboardEditor.jsx

**Files:**
- Modify: `frontend/src/components/StoryboardEditor.jsx` (destructure props, clean card layout columns)

**Step 1: Write the failing test**

Check local build.

**Step 2: Run verification**

Run: `npm run dev` in `frontend`.
Expected: Build passes.

**Step 3: Write minimal implementation**

- Update `StoryboardEditor` parameters to receive `onRegenerateSceneCode` and `regeneratingCodeSceneId`.
- Under the `InlineScenePlayer` container, remove the Unsplash Search and Background Media search/suggest panels.
- In the right-side inputs column of each scene card, remove all layout settings dropdowns, inputs, themes, and points lists.
- Render only the `Voiceover Script` textarea.
- Render two buttons below the textarea: `⚡ Sinh lại video bằng AI` (triggers `onRegenerateSceneCode`) and `🔊 Tạo lại giọng đọc (TTS)` (triggers `onRegenerateSceneTts`).

**Step 4: Run verification**

Run: `npm run build` in `frontend`.
Expected: Build passes.

**Step 5: Commit**

```bash
git add frontend/src/components/StoryboardEditor.jsx
git commit -m "feat: simplify StoryboardEditor scene cards layout"
```

---

### Task 6: Implement single-scene code regeneration in App.jsx

**Files:**
- Modify: `frontend/src/App.jsx` (add state, implement `handleRegenerateSceneCode`, pass to `StoryboardEditor`, handle `onGenerationSuccess` redirect)

**Step 1: Write the failing test**

Check build.

**Step 2: Run verification**

Run: `npm run dev`.
Expected: Build passes.

**Step 3: Write minimal implementation**

- In `App.jsx`, add `regeneratingCodeSceneId` state.
- Implement `handleRegenerateSceneCode(sceneId, scriptText)` to call `api.generateStudioAiGenScene` and reload project detail on success.
- Pass `onRegenerateSceneCode={handleRegenerateSceneCode}` and `regeneratingCodeSceneId={regeneratingCodeSceneId}` to `StoryboardEditor`.
- Update `StudioAIGen` render inside `App.jsx` to pass `onGenerationSuccess={(id) => { setSelectedProjectId(id); setView("WORKSPACE_EDITOR"); }}`.

**Step 4: Run verification**

Run: `npm run build`.
Expected: Build passes.

**Step 5: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: implement handleRegenerateSceneCode in App.jsx and pass callbacks"
```
