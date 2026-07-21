# AI Text Length & Early Stagger Delay Optimization Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Refactor `backend/services/ai.js` and `backend/services/contractLoader.js` to ensure AI generates short, concise point text (max 6-8 words) and elements animate early (all appearing within the first 50% of scene duration).

**Tech Stack:** Node.js, Express backend, Gemini API Service.

---

### Task 1: Update AI Phase 2 Prompt & Schema Instructions for Concise Point Text

**Files:**
- Modify: `backend/services/ai.js`

**Step 1: Update System Instruction in `generateDetailedStoryboard`**
- Add strict rules for point text length (MAX 6-8 words / 40 chars per point).
- Include contrast examples (Bad vs Good).
- Update schema `description` for point `text` field.

**Step 2: Commit changes**

```bash
git add backend/services/ai.js
git commit -m "feat: enhance AI prompt for short concise point text"
```

---

### Task 2: Implement Compressed Stagger Delay Calculation

**Files:**
- Modify: `backend/services/contractLoader.js`
- Modify: `backend/services/ai.js`

**Step 1: Update `validateAndFormatSceneContent` in `contractLoader.js`**
- Calculate `maxLastDelay = sceneDuration * 0.5`.
- Distribute delays evenly between `0.4s` and `maxLastDelay` so all points appear within the first 50% of the scene duration.

**Step 2: Update Step 5 Enricher in `ai.js`**
- Match the 50% maxLastDelay rule when enriching initial AI response points.

**Step 3: Commit changes**

```bash
git add backend/services/contractLoader.js backend/services/ai.js
git commit -m "feat: cap element stagger delays to first 50% of scene duration"
```

---

### Task 3: Verification & Test Check

**Step 1: Run syntax check / test backend**
Verify Node.js script execution without errors.

**Step 2: Commit final status**

```bash
git commit --allow-empty -m "fix(backend): verify AI text length and early stagger delay optimization"
```
