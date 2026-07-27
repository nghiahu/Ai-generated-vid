# Remove Manual Studio & Filter AI Gen Only Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Remove the manual Studio sidebar option and page views while simplifying the Dashboard to show only AI Gen projects.

**Architecture:** Modify `App.jsx` navigation and page conditionals, and update `Dashboard.jsx` to remove tab layout and only filter projects of type AIGEN.

**Tech Stack:** React, CSS.

---

### Task 1: Update App Navigation and Routing

**Files:**
- Modify: `frontend/src/App.jsx:470-496`
- Modify: `frontend/src/App.jsx:589-612`

**Step 1: Write the failing test**

We don't have unit tests in this repo, so we will verify manual navigation items. We will ensure the development server starts and has no compile errors.

**Step 2: Run verification**

Run: `npm run dev` in `frontend` directory.
Expected: Build passes.

**Step 3: Write minimal implementation**

Remove the `🎥 Studio` sidebar option and `view === "STUDIO"` view rendering.

In `frontend/src/App.jsx`:
```jsx
// Remove lines 470-496 (Studio <li> item)
// Remove lines 589-612 (view === "STUDIO" conditional block)
```

**Step 4: Run verification**

Run: `npm run dev` in `frontend` directory and check visual interface.
Expected: Studio sidebar link is gone, no compile errors.

**Step 5: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: remove manual studio sidebar navigation and view"
```

---

### Task 2: Simplify Dashboard to Show Only AI Gen Projects

**Files:**
- Modify: `frontend/src/components/Dashboard.jsx:65-74`
- Modify: `frontend/src/components/Dashboard.jsx:91-135`
- Modify: `frontend/src/components/Dashboard.jsx:138-155`

**Step 1: Write the failing test**

Manual check on local browser to see dashboard view.

**Step 2: Run verification**

Expected: Dashboard shows tabs "Biên tập Storyboard" and "Video AI Gen".

**Step 3: Write minimal implementation**

In `frontend/src/components/Dashboard.jsx`:
- Remove `activeTab` states and set `filteredProjects` filter:
```javascript
  const filteredProjects = projects.filter(p => p.type === "AIGEN");
```
- Remove tag selector tab div at the top of the content.
- Simplify empty state message.

**Step 4: Run verification**

Expected: Dashboard has no tabs and lists only AI Gen videos.

**Step 5: Commit**

```bash
git add frontend/src/components/Dashboard.jsx
git commit -m "feat: simplify dashboard to only show AI Gen projects and remove tabs"
```
