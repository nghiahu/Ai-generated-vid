# UI Preview Enlargement and Header Cleanup Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Clean up the frontend UI by removing the redundant "Export" button from the header, deleting the simulated "Timeline & Scrubber Panel", and enlarging the Master Preview video container and phone frame.

**Architecture:** Remove redundant button components in React and clean up static subcomponents in MasterPlayer. Adjust inline styles of the preview grid container and phone frame wrapper.

**Tech Stack:** React, Vite

---

### Task 1: Remove Redundant "Export" Button from Header

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Write mock test or prepare manual verification**
We will verify that Vite hot-reloads and the "Export" button is completely gone from the top-right header in the browser.

**Step 2: Edit code in App.jsx**
Remove the button container from the header block (lines 268-278):
```diff
-        <div>
-          <button 
-            className="primary" 
-            style={{ fontSize: "12px", padding: "8px 18px", borderRadius: "var(--radius-pill)" }}
-            onClick={handleRenderVideo}
-            disabled={rendering}
-          >
-            {rendering ? `Exporting (${renderProgress}%)` : "Export"}
-          </button>
-        </div>
```

**Step 3: Verify build / lint**
Run: `npm run lint` in `frontend` folder to make sure there are no syntax errors or unused variables created by the deletion.
Run: `npm run build` in `frontend` folder to ensure it compiles correctly.

**Step 4: Commit**
```bash
git add frontend/src/App.jsx
git commit -m "style: remove redundant Export button from header"
```

---

### Task 2: Remove Simulated Timeline & Scrubber Panel and Enlarge Video Preview

**Files:**
- Modify: `frontend/src/components/MasterPlayer.jsx`

**Step 1: Edit code in MasterPlayer.jsx**
1. Reduce padding of the main player workspace grid container from `24px` to `12px` (line 60).
2. Increase the phone frame `maxWidth` from `250px` to `280px` (line 79).
3. Remove the simulated `Timeline & Scrubber Panel` container entirely (lines 127-165).

**Step 2: Verify build / lint**
Run: `npm run lint` and `npm run build` in `frontend` folder to make sure the project compiles.

**Step 3: Commit**
```bash
git add frontend/src/components/MasterPlayer.jsx
git commit -m "style: remove simulated video controls and enlarge video preview to 280px"
```

---

### Task 3: Overall Verification & Task completion
Verify that both changes together build properly, and prompt the user to check the local development server to confirm the preview looks beautiful.
