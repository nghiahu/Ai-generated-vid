# Real-Time Storyboard Generation Progress Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Replace fake hardcoded percentage timer with real-time backend progress tracking.

**Architecture:** Express progress map, status endpoint, and frontend polling.

**Tech Stack:** Node.js, Express, React, REST API.

---

### Task 1: Backend Progress Tracking Endpoint (`backend/server.js`)

**Files:**
- Modify: `backend/server.js`

**Steps:**
1. Define `storyboardProgressMap`.
2. Add endpoint `GET /api/projects/:id/generate-storyboard/status`.
3. Update `storyboardProgressMap` inside `POST /api/projects/:id/generate-storyboard` at each generation step.

---

### Task 2: Frontend Real-Time Polling (`frontend/src/components/StoryboardEditor.jsx`)

**Files:**
- Modify: `frontend/src/components/StoryboardEditor.jsx`

**Steps:**
1. Update `CircularProgressLoader` to accept `projectId`.
2. Poll `GET /api/projects/:id/generate-storyboard/status` every 500ms when active.
3. Update state with real percentage and real stage message.

---

### Task 3: Verification

- Test storyboard generation and confirm percentage matches backend processing.
