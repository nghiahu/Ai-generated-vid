# Design Document: Mandatory Glass Cards & Glowing Background Guarantee

**Date**: 2026-07-23  
**Status**: Proposed / Approved  

---

## 1. Overview & Problem Statement

When regenerating scenes (e.g. Scene 2 with `visualPattern = "BULLET_GLASS"`), if the scene data lacks explicit bullet points or metrics, Gemini LLM currently falls back to generating a plain white text title on a pitch-black screen (`#030712`), omitting all glassmorphism cards, ambient glowing backgrounds, badges, and animations.

---

## 2. Proposed Architecture & Solution

### Component 1: Prompt Rules & Card Synthesis (`backend/services/aiGen.js`)
- Update system prompt instructions in `aiGen.js`:
  1. **Mandatory Glass Cards Rule**: If `points` or `metrics` are missing/empty in scene data, AI MUST synthesize 2-3 structured glassmorphic cards from `scene.voiceover` and `scene.heading`.
  2. **Mandatory Ambient Glowing Background**: Every generated TSX component MUST render a radial gradient ambient glow (`radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.18), transparent 75%)`) and 2 animated floating glowing orbs (blur 80px, opacity 0.15). A plain black screen is strictly forbidden.

### Component 2: Backend Pre-Processing Auto-Backfill (`generateSingleSceneCode`)
- Before invoking Gemini TSX generator, if `scene.points` or `scene.metrics` is undefined/empty, automatically parse sentences or clauses from `scene.voiceover` and attach a default array of 2-3 points to `scene.points`.

---

## 3. Verification Plan

### Manual Verification
1. Open Studio AI Gen in the browser.
2. Click **"🔄 Sinh lại phân cảnh 2"** (`BULLET_GLASS`).
3. Verify that the regenerated scene displays multiple glassmorphic cards with animated entrance and a rich glowing ambient background (no plain black screen).
