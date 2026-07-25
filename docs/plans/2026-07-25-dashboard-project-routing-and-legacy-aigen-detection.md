# Dashboard Project Routing & Legacy AI Gen Detection — Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Ensure selecting any AI Gen project (new or legacy) from the Dashboard page immediately switches the view to `STUDIO_AI_GEN` and loads all project data.

**Architecture:** Update `fetchProjectDetail` in `App.jsx` to recognize AI Gen projects via `type === "AIGEN"` OR `config.scenes[0].visualPattern`, and remove view conditional locks (`if (view === "PROJECTS")`) so `setView` is called reliably from any page.

**Tech Stack:** React (`App.jsx`).

---

## Task 1: Update `fetchProjectDetail` Routing & Type Detection in `App.jsx`

**Files:**
- Modify: `frontend/src/App.jsx` (lines ~131–148)

**Step 1: Refactor `fetchProjectDetail` in `App.jsx`**

```javascript
  const fetchProjectDetail = async (id) => {
    try {
      const project = await api.getProjectById(id);
      if (!project) return;

      // Smart AI Gen detection: check type OR config.scenes visualPattern
      const isAIGen = project.type === "AIGEN" || (
        project.config &&
        Array.isArray(project.config.scenes) &&
        project.config.scenes.length > 0 &&
        Boolean(project.config.scenes[0].visualPattern)
      );

      if (!isAIGen) {
        project.config = { visualStyle: "rikkei", ...(project.config || {}) };
        if (!project.config.visualStyle) project.config.visualStyle = "rikkei";
      }

      setCurrentProject(project);

      if (isAIGen) {
        setView("STUDIO_AI_GEN");
      } else if (project.scenes && project.scenes.length > 0) {
        setSelectedSceneId(project.scenes[0].id);
        setView("WORKSPACE_EDITOR");
      } else {
        setView("WORKSPACE_SETUP");
      }
    } catch (error) {
      console.error("Failed to fetch project detail:", error);
    }
  };
```

**Step 2: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "fix: smart AI Gen project detection and unconditional view switching in fetchProjectDetail (Task 1)"
```

---

## Task 2: Verification

1. Go to Dashboard page (DASHBOARD view).
2. Click any AI Gen project card under tag AI GEN.
3. Verify view immediately switches to `STUDIO_AI_GEN` and loads project scenes & watermark settings.
