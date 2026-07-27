# Safe Lucide Icons Proxy & Import Rewriter Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Eliminate React runtime crashes from hallucinated icon imports by wrapping `window.LucideIcons` in a safe ES6 Proxy fallback and improving import rewriting in `StudioAIGen.jsx`.

**Architecture:** Wrap `LucideIcons` with ES6 Proxy in `StudioAIGen.jsx`, enhance regex rewriter in `loadComponentFromJS`, and lock player layout bounds.

**Tech Stack:** React, ES6 Proxy, JavaScript (JSX), Vite.

---

### Task 1: Bind Safe ES6 Proxy to `window.LucideIcons` & Improve Import Rewriting in `StudioAIGen.jsx`

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx`

**Steps:**
1. Wrap `LucideIcons` in an ES6 `Proxy` assigned to `window.LucideIcons`. If any property is not found in `LucideIcons`, return a safe fallback React component (rendering `<Sparkles size={props.size || 24} color={props.color} />`).
2. Update `loadComponentFromJS` in `StudioAIGen.jsx` to handle single-quote/double-quote imports, multi-line named imports, and alias destructuring robustly.
3. Ensure `SceneWrapper` error container maintains `width: "100%", height: "100%"` with `#030712` dark background.

---

### Task 2: Verification & Test Suite

**Files:**
- Create and run scratch test script verifying ES6 Proxy fallback and import rewriter.
