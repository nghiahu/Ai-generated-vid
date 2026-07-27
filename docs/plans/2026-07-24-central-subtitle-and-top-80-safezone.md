# Central Subtitle Layer & Top 80% UI Safe Zone Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Remove inline TSX subtitle code generation from Gemini prompts, enforce a top-80% screen height constraint for visual elements, and render subtitles via a central `<DynamicSubtitle />` layer.

**Architecture:** Update `systemInstruction` in `aiGen.js`, add `<DynamicSubtitle />` overlay to `SceneWrapper` in `StudioAIGen.jsx`, and ensure clean bottom 20% safe zone separation.

**Tech Stack:** React, Remotion, Node.js, JavaScript.

---

### Task 1: Update Prompt Instructions in `aiGen.js`

**Files:**
- Modify: `backend/services/aiGen.js`

**Steps:**
1. Update Rule 6 in `systemInstruction` in `aiGen.js`: instruct Gemini to omit subtitle code generation and wrap all visual content inside a container constrained to top 80% screen height (`height: "80%"`).

---

### Task 2: Add Central `<DynamicSubtitle />` Layer to `SceneWrapper` in `StudioAIGen.jsx`

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx`

**Steps:**
1. Import or embed `<DynamicSubtitle />` logic in `SceneWrapper` in `StudioAIGen.jsx` to render synchronized karaoke subtitles in the bottom 20% safe zone for single-scene preview.

---

### Task 3: Verification & Test Suite

**Files:**
- Verify frontend client build (`npm run build`) and test scene preview rendering.
