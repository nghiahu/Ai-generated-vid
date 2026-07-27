# Design: 10 Visual Patterns & Mandatory Layout Rotation Engine

**Date:** 2026-07-24  
**Status:** Approved  
**Topic:** Expand Visual Patterns from 6 to 10 rich design layouts, enforce non-repetitive visual rotation across scenes, and encode layout exemplars as lightweight TSX text prompts (0MB payload) to eliminate design monotony without API 503/429 risks.

---

## 1. Problem Statement

Previously, Studio AI Gen scenes repeatedly defaulted to `BULLET_GLASS` (3 stacked glass cards) across consecutive scenes because the prompt reference only provided 3 glass card images and lacked a strict pattern rotation rule.

---

## 2. Proposed Architecture & System Design

### Component A: 10 Unique Visual Patterns (`aiGen.js`)
Expand pattern selection to 10 distinct high-end layout styles:
1. `TITLE_HOOK`: High-impact opening hook with floating glowing badge and gradient typography.
2. `BULLET_GLASS`: Vertical glassmorphism cards with numbered icons.
3. `DONUT_GAUGE`: Animated 3D percentage ring with glowing stat callout.
4. `DUAL_METRIC_CARDS`: Side-by-side metric comparison cards (e.g. 3 Years vs 3 Mins).
5. `HERO_METRIC_GLOW`: Giant central hero metric ($2.590 TỶ ĐÔ) with radiant glow.
6. `COMPARISON_VERSUS`: Split-screen versus layout comparing 2 opposing sides.
7. `PROCESS_TIMELINE`: Horizontal / Stepped progress chain (Step 1 ➔ Step 2 ➔ Step 3).
8. `STAT_GRID_2X2`: 2x2 grid of metric tiles with glowing icons and borders.
9. `QUOTE_NATURE_CARD`: High-impact editorial quote / paper Nature badge with ambient glow.
10. `ENDING_CTA`: Outro screen with call-to-action button, social media badges, and pulse glow.

### Component B: Mandatory Visual Rotation Rule (`generateScenePlanForAIGen`)
- In `generateScenePlanForAIGen` in `backend/services/aiGen.js`:
  - Enforce rule: `NO TWO CONSECUTIVE SCENES MAY USE THE SAME VISUAL PATTERN`.
  - Force Gemini to rotate through different visual patterns across all scenes.

### Component C: Zero-Payload Text TSX Layout Exemplars (`aiGen.js`)
- Encode each of the 10 layout patterns as structured TSX exemplars directly inside `systemInstruction` in `generateTSXCodeForScene`:
  - Lightweight text format (0MB image payload) ensuring instant generation and zero 503/429 rate limit errors.

---

## 3. Verification Plan
1. **Multi-Pattern Generation Test**:
   - Generate an 8-scene video and verify Phase 1 assigns diverse patterns across all 8 scenes without consecutive duplicate patterns.
2. **Build Verification**:
   - Run production build `npm run build` in `frontend` to verify zero errors.
