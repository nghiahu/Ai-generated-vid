# Enable Lucide React Icons Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Enable Gemini to import and render vector icons from `lucide-react` dynamically in generated scene TSX components.

**Architecture:** Expose `lucide-react` to `window.LucideIcons` in `StudioAIGen.jsx`, update `loadComponentFromJS` import rewriter to map `lucide-react` to `window.LucideIcons`, and instruct Gemini in `aiGen.js` system prompt to use icons.

**Tech Stack:** React, `lucide-react`, Remotion, Node.js.

---

### Task 1: Register Lucide Icons Global & Import Rewriter in Frontend

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx`

**Step 1: Import & Bind Lucide Icons to Window**
Import `* as LucideIcons from "lucide-react"` and set `window.LucideIcons = LucideIcons`.

**Step 2: Add Lucide React Import Rewriter in loadComponentFromJS**
Rewrite `import { ... } from "lucide-react"` to `const { ... } = window.LucideIcons;`.

---

### Task 2: Update System Prompt in aiGen.js to Enable Lucide Icons

**Files:**
- Modify: `backend/services/aiGen.js`

**Step 1: Add Lucide React Icon Permission & Spec to System Instruction**
Add `lucide-react` import example and placement guidelines to `systemInstruction`.

**Step 2: Verify Syntax**
Run: `node -c backend/services/aiGen.js`
Expected: PASS with zero errors.
