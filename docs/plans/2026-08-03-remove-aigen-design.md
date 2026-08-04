# Design: Completely Remove Studio AI Gen Feature

This document outlines the design to clean up the codebase by completely removing all files and references related to the unused "Studio AI Gen" feature in both the frontend and backend.

## Goals
1. **Reduce Project Bloat**: Remove heavy unused frontend components (`StudioAIGen.jsx`) and backend routes.
2. **Simplify User Interface**: Clean up sidebar navigation options and simplify the Dashboard view by removing AI Gen vs Storyboard tab selectors.
3. **Keep Codebase Healthy**: Eliminate dead code to make code updates and refactors faster.

---

## Proposed Deletions

### 1. Frontend Files
- `frontend/src/components/StudioAIGen.jsx` (Entire file)

### 2. Backend Files
- `backend/routes/studioAiGenRoute.js` (Entire file)
- `backend/scratch_test_endpoint.js` (Entire file)

### 3. Documentation
- `docs/studio-ai-gen` (Entire directory)

---

## Proposed Changes

### Frontend Modifications

#### 1. `frontend/src/App.jsx`
- Remove the lazy import declaration:
  ```javascript
  const StudioAIGen = React.lazy(() => import("./components/StudioAIGen").then(m => ({ default: m.StudioAIGen })));
  ```
- Remove the navigation button for "✨ Studio AI Gen" from the Left Sidebar list.
- Remove the conditional rendering block for `view === "STUDIO_AI_GEN"` in the Content Area.

#### 2. `frontend/src/components/Dashboard.jsx`
- Remove the tab selector header container (Biên tập Storyboard vs Video AI Gen).
- Remove the `activeTab` filter state.
- Simplify `filteredProjects` filter logic to display normal Storyboard projects, automatically filtering out legacy projects of type `"AIGEN"`:
  ```javascript
  const filteredProjects = projects.filter(p => p.type !== "AIGEN");
  ```

#### 3. `frontend/src/services/api.js`
- Delete the following functions:
  - `generateStudioAiGen`
  - `planStudioAiGen`
  - `generateStudioAiGenScene`
  - `saveStudioAiGenConfig`

---

### Backend Modifications

#### `backend/server.js`
- Remove import require statement:
  ```javascript
  const studioAiGenRoute = require('./routes/studioAiGenRoute');
  ```
- Remove Express router registration middleware:
  ```javascript
  app.use('/api/studio-ai-gen', studioAiGenRoute);
  ```

---

## Verification Plan

### Automated Verification
1. Run `npm run build` in the `frontend/` directory to verify that the build compiles successfully without references to `StudioAIGen` or missing exports.
2. Start the backend server and verify it runs without crashing due to missing files/requires.

### Manual Verification
1. Verify the frontend app loads successfully.
2. Confirm the "Studio AI Gen" sidebar link and Dashboard tabs are gone.
3. Confirm the Dashboard lists standard Storyboard projects properly.
