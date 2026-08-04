# Remove Studio AI Gen Feature Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Clean up the codebase by completely removing the unused Studio AI Gen feature from the frontend and backend.

**Architecture:** Remove route definitions from Express server.js, clean up the sidebar menu & routes in App.jsx, simplify the dashboard project filter in Dashboard.jsx, and delete specialized files/directories.

**Tech Stack:** React 19, Express, Node.js.

---

### Task 1: Clean up Backend Server Routing

**Files:**
- Modify: `backend/server.js`

**Step 1: Write minimal implementation**
Delete imports and router registration from Express server:
- Remove: `const studioAiGenRoute = require('./routes/studioAiGenRoute');`
- Remove: `app.use('/api/studio-ai-gen', studioAiGenRoute);`

**Step 2: Commit**
```bash
git add backend/server.js
git commit -m "chore: remove studio-ai-gen routes from backend server.js"
```

---

### Task 2: Remove client-side AI Gen APIs

**Files:**
- Modify: `frontend/src/services/api.js`

**Step 1: Write minimal implementation**
Delete the following functions from the `api` object:
- `generateStudioAiGen`
- `planStudioAiGen`
- `generateStudioAiGenScene`
- `saveStudioAiGenConfig`

**Step 2: Commit**
```bash
git add frontend/src/services/api.js
git commit -m "chore: delete studio-ai-gen functions from frontend api.js"
```

---

### Task 3: Simplify Dashboard Project Filters and Tabs

**Files:**
- Modify: `frontend/src/components/Dashboard.jsx`

**Step 1: Write minimal implementation**
- Remove the `activeTab` state declaration.
- Simplify `filteredProjects` to filter out projects of type `"AIGEN"`.
- Remove the Tab selectors (Biên tập Storyboard / Video AI Gen).
*(Detailed modifications to Dashboard.jsx will be applied in this task).*

**Step 2: Commit**
```bash
git add frontend/src/components/Dashboard.jsx
git commit -m "feat: simplify Dashboard project listing and remove tabs"
```

---

### Task 4: Clean up App.jsx Views and Sidebar Links

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Write minimal implementation**
- Remove lazy import of `StudioAIGen`.
- Remove left sidebar link for "✨ Studio AI Gen".
- Remove conditional rendering block for `view === "STUDIO_AI_GEN"`.
*(Detailed modifications to App.jsx will be applied in this task).*

**Step 2: Commit**
```bash
git add frontend/src/App.jsx
git commit -m "feat: clean up StudioAIGen references and routing in App.jsx"
```

---

### Task 5: Delete Unused Files and Directories

**Files:**
- Delete: `frontend/src/components/StudioAIGen.jsx`
- Delete: `backend/routes/studioAiGenRoute.js`
- Delete: `backend/scratch_test_endpoint.js`
- Delete: `docs/studio-ai-gen/` (if it exists)

**Step 1: Run deletion commands**
Run:
`rm frontend/src/components/StudioAIGen.jsx`
`rm backend/routes/studioAiGenRoute.js`
`rm backend/scratch_test_endpoint.js`

**Step 2: Commit deletions**
```bash
git rm frontend/src/components/StudioAIGen.jsx backend/routes/studioAiGenRoute.js backend/scratch_test_endpoint.js
git commit -m "chore: delete unused studio-ai-gen files"
```

---

### Task 6: Production Build and Server Startup Check

**Files:**
- Test: Build output and server verification

**Step 1: Run production build**
Run: `npm run build` inside `frontend/`
Expected: Build passes successfully.

**Step 2: Run server status check**
Verify the backend starts successfully.
