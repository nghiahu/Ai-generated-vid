# Layout Intent Auto-Matching & Strict 50% Delay Clamp Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Fix layout selection mis-matches for comparison/versus scenes and strictly hard-clamp all element delays to <= 50% scene duration in `backend/services/contractLoader.js` & `backend/services/ai.js`.

**Tech Stack:** Node.js, Gemini API Service.

---

### Task 1: Enforce Hard Delay Clamp in `contractLoader.js` & `ai.js`

**Files:**
- Modify: `backend/services/contractLoader.js`
- Modify: `backend/services/ai.js`

**Step 1: Hard clamp delay**
- Calculate `maxLastDelay = Number((sceneDuration * 0.5).toFixed(1))`.
- Force `pt.delay = Math.min(pt.delay !== undefined ? pt.delay : computedDelay, maxLastDelay)`.

**Step 2: Commit changes**

```bash
git add backend/services/contractLoader.js backend/services/ai.js
git commit -m "fix(backend): enforce strict 50% hard clamp on all element animation delays"
```

---

### Task 2: Implement Layout Intent Mapping & Auto-Correction

**Files:**
- Modify: `backend/services/ai.js`
- Modify: `backend/services/contractLoader.js`

**Step 1: Add layout mapping table to Phase 1 System Instruction in `ai.js`**
Add explicit rules for Comparison, Metrics, Timeline, Radar, and App layouts.

**Step 2: Add semantic auto-correction in `contractLoader.js`**
If text contains comparison/versus keywords ("không phải là", "so với", "khác với", "versus") and layout is non-comparison, auto-correct `layoutId` to `BeforeAfterPanel` or `SplitProofBullet`.

**Step 3: Commit changes**

```bash
git add backend/services/ai.js backend/services/contractLoader.js
git commit -m "feat(backend): implement layout intent mapping and comparison auto-correction"
```

---

### Task 3: Verification & Test Check

**Step 1: Run backend syntax check**
Run backend node test.

**Step 2: Commit final status**

```bash
git commit --allow-empty -m "fix(layout): verify layout intent auto-matching and strict delay clamp"
```
