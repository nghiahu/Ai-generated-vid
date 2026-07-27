# 10 Visual Patterns & Layout Rotation Engine Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Expand visual patterns from 6 to 10 distinct layouts and enforce non-repetitive visual rotation across scenes in Studio AI Gen.

**Architecture:** Update `AIGEN_PLANNER_SCHEMA`, `normalizeVisualPattern`, `generateScenePlanForAIGen`, and `generateTSXCodeForScene` in `backend/services/aiGen.js`.

**Tech Stack:** Node.js, Express, React, TypeScript/TSX, Gemini API.

---

### Task 1: Update `AIGEN_PLANNER_SCHEMA`, `normalizeVisualPattern`, and `generateScenePlanForAIGen` in `aiGen.js`

**Files:**
- Modify: `backend/services/aiGen.js`

**Steps:**
1. Update `AIGEN_PLANNER_SCHEMA` description for `visualPattern` to include all 10 patterns: `DONUT_GAUGE`, `DUAL_METRIC_CARDS`, `HERO_METRIC_GLOW`, `TITLE_HOOK`, `BULLET_GLASS`, `COMPARISON_VERSUS`, `PROCESS_TIMELINE`, `STAT_GRID_2X2`, `QUOTE_NATURE_CARD`, `ENDING_CTA`.
2. Update `normalizeVisualPattern` to support all 10 patterns.
3. Add `MANDATORY VISUAL PATTERN ROTATION RULE` in `generateScenePlanForAIGen` prompt instructions.
4. Update `generateTSXCodeForScene` system instructions with code exemplars for all 10 patterns.

---

### Task 2: Verification & Test Suite

**Files:**
- Run syntax test `node -c backend/services/aiGen.js`.
- Run production build `npm run build` in `frontend` to verify 0 errors.
