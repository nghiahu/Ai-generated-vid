# Performance Optimization Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Eliminate network lag and browser rendering freeze on the Dashboard by optimizing the database query and removing multiple idle Remotion Player instances.

**Architecture:** Combine project listing and first scene thumbnail queries into a single SQL join at the database layer. In the client, replace static card Remotion players with lightweight HTML media elements, and load the player wrapper dynamically on-demand when "Play" is clicked.

**Tech Stack:** React 19, Express, PostgreSQL, TanStack Query.

---

### Task 1: Optimize Database Helper Query

**Files:**
- Modify: `backend/services/db.js`

**Step 1: Write minimal implementation**
Modify `getProjects` inside `backend/services/db.js` to select project details and first scene metadata using a subquery:
```javascript
  getProjects: async () => {
    await initDb();
    const res = await pool.query(`
      SELECT p.*, 
             (SELECT jsonb_build_object(
                'id', s.id,
                'duration', s.duration,
                'media_list', s.media_list,
                'selected_media_index', s.selected_media_index
              )
              FROM scenes s 
              WHERE s.project_id = p.id 
              ORDER BY s.scene_index ASC 
              LIMIT 1) as first_scene
      FROM projects p 
      WHERE type != 'AIGEN' 
         OR status = 'COMPLETED' 
         OR (
           config->'scenes' IS NOT NULL 
           AND jsonb_array_length(config->'scenes') > 0 
           AND config->'scenes'->0->>'compiledJS' IS NOT NULL 
           AND config->'scenes'->0->>'compiledJS' != ''
         )
      ORDER BY created_at DESC
    `);
    return res.rows.map(row => ({
      ...row,
      createdAt: row.created_at
    }));
  },
```

**Step 2: Commit**
```bash
git add backend/services/db.js
git commit -m "perf: optimize getProjects SQL query to fetch first scene metadata in a single call"
```

---

### Task 2: Simplify Express Server API Endpoint

**Files:**
- Modify: `backend/server.js`

**Step 1: Write minimal implementation**
Update `GET /api/projects` in `backend/server.js` to return mapped thin project rows, completely removing the N+1 `getProjectById` loop.
```javascript
// 1. GET /api/projects: List all projects
app.get('/api/projects', async (req, res) => {
  try {
    const thinProjects = await db.getProjects();
    const projectsWithFirstScene = thinProjects.map(p => {
      const firstScene = p.first_scene;
      delete p.first_scene;
      return {
        ...p,
        scenes: firstScene ? [firstScene] : []
      };
    });
    res.json(projectsWithFirstScene);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Step 2: Commit**
```bash
git add backend/server.js
git commit -m "perf: eliminate N+1 project queries inside GET /api/projects"
```

---

### Task 3: Refactor Dashboard Card Media and Add Player Wrapper

**Files:**
- Modify: `frontend/src/components/Dashboard.jsx`

**Step 1: Write minimal implementation**
1. Add `useProjectDetail` hook import in `Dashboard.jsx`.
2. Implement `DashboardProjectPlayerWrapper` that retrieves details on-demand via `useProjectDetail(projectId)` and renders `DashboardProjectPlayer`.
3. Modify card rendering to show pure HTML `<img>` or `<video>` thumbnails instead of the idle Remotion Player instance.
4. Render `DashboardProjectPlayerWrapper` when a project card is actively playing.
*(Detailed modifications to Dashboard.jsx will be applied in this task).*

**Step 2: Commit**
```bash
git add frontend/src/components/Dashboard.jsx
git commit -m "perf: replace multiple Remotion Player instances on Dashboard with HTML thumbnails"
```

---

### Task 4: Production Build and Server Startup Check

**Files:**
- Test: Build validation checks

**Step 1: Run production build**
Run: `npm run build` inside `frontend/`
Expected: Build passes successfully.

**Step 2: Start server**
Verify server boots correctly.
```bash
node backend/server.js
```
Expected: boots without errors.
