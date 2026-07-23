# Strict Dynamic Data Binding Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Enforce 100% dynamic data binding in Gemini TSX code generation so all text rendered in scene cards comes from the user's script (`scene.heading`, `scene.points`, `scene.voiceover`), eliminating hardcoded example text.

**Architecture:** Add strict prompt rules in `aiGen.js` prohibiting example string copy, convert literal strings in `design-reference.md` into placeholder variable tags (`{scene.heading}`, `{point.label}`, `{point.value}`), and ensure backend auto-backfills `scene.points`.

**Tech Stack:** Node.js, Express, Gemini API (`@google/generative-ai`), Markdown.

---

### Task 1: Enforce Strict Dynamic Data Binding in aiGen.js Prompt

**Files:**
- Modify: `backend/services/aiGen.js`

**Step 1: Add Strict Data Binding Rules to System Instruction**
Add explicit BAN ON EXAMPLE STRINGS and MANDATORY DYNAMIC BINDING rules in `systemInstruction`.

**Step 2: Verify Syntax**
Run: `node -c backend/services/aiGen.js`
Expected: PASS with zero errors.

---

### Task 2: Convert Literal Example Strings to Placeholders in design-reference.md

**Files:**
- Modify: `docs/studio-ai-gen/design-reference.md`

**Step 1: Replace Hardcoded Example Text with Variable Tags**
Replace literal text like "NEXT-GEN INFRASTRUCTURE", "Engineered for Scale", "900tr", "88%", "AES-256", "GraphQL" with `{scene.heading}`, `{point.value}`, `{point.label}`, `{point.text}`.

**Step 2: Save and Verify File Integrity**
Check file content formatting.
