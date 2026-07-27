# Design: Multi-Card Step Splitter & Brand Safety Net Upgrade

**Date:** 2026-07-24  
**Status:** Approved  
**Topic:** Ban single large text boxes for multi-step content, enforce automatic splitting into 2-3 structured glass cards with step badges (01, 02) and Lucide icons while preserving 100% of the user's custom brand design system (`ai_hub_grid`).

---

## 1. Problem Statement

When scenes contained multi-step or multi-part narrative text (such as "Quy trình Backpropagation: 1. Forward Pass, 2. Backward Pass"), code generation or safety net fallbacks dumped the entire text into a single, plain dark box, creating a monolithic text wall lacking visual hierarchy.

---

## 2. Proposed Architecture & System Design

### Component A: Multi-Card Step Splitter Prompt Constraint (`generateTSXCodeForScene`)
- In `generateTSXCodeForScene` in `backend/services/aiGen.js`:
  - Add explicit rule: `ABSOLUTE BAN ON SINGLE LARGE TEXT BOXES FOR MULTI-STEP CONTENT`.
  - When text or points contain steps (e.g. `1. Forward Pass`, `2. Backward Pass`), instruct Gemini to parse the steps and render **2 to 3 separate Glassmorphism Cards** with:
    - Step badges (`01`, `02`, `03`) inside glowing circular pills.
    - Lucide icons (`Cpu`, `Layers`, `Zap`, `Sparkles`).
    - Brand theme tokens (`THEME.cardBg`, `THEME.cyan`, `THEME.orange`, `THEME.border`).

### Component B: Upgraded Glass Card Safety Net (`generateGlassCardSafetyNetTSX`)
- In `generateGlassCardSafetyNetTSX` in `backend/services/aiGen.js`:
  - Automatically parse `scene.voiceover`, `scene.points`, and `scene.heading` for step markers (e.g. `1.`, `2.`, `Thứ nhất`, `Thứ hai`).
  - If 2 or more steps/points exist, render **2 to 3 separate Glassmorphism step cards** with staggered spring entrance animations, step number circles (`01`, `02`), Lucide icons, and ambient background glowing orbs.
  - Ensures fallback TSX never renders a single dark text box.

---

## 3. Verification Plan
1. **Multi-Card Generation Test**:
   - Pass the "Backpropagation 2 bước: 1. Forward Pass, 2. Backward Pass" scene into `generateGlassCardSafetyNetTSX` and verify it produces 2 distinct glass cards.
2. **Build Verification**:
   - Run production build `npm run build` in `frontend` to verify zero errors.
