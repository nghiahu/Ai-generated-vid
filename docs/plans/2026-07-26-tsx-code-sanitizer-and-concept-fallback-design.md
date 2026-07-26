# Design: TSX Code Sanitizer & Concept-Aware Multi-Template Fallback Engine

**Date:** 2026-07-26  
**Status:** Approved  
**Topic:** Eliminate visual UI repetition caused by Sucrase compilation failures. Implement a smart TSX Code Sanitizer to auto-repair 99% of LLM syntax errors and upgrade the Fallback Engine to route to concept-matching templates (Code Terminal, 3-Step Flow, VS Split, Gauge Ring, Grid Matrix, Outro CTA) instead of defaulting all scenes to 3 glass cards.

---

## 1. Problem Statement

When Gemini attempts to generate dynamic React TSX code based on script context, minor syntax issues (such as TypeScript type declarations like `: React.FC<{...}>`, unescaped string quotes, or missing imports) can cause Sucrase compilation to throw an error. Previously, when compilation failed, the fallback engine collapsed every unrecognized dynamic visual concept to a single default template (`generateGlassCardSafetyNetTSX`), causing multiple scenes to render identical 3-card list layouts with `01`, `02`, `03` badges.

---

## 2. Proposed Architecture & System Design

### Component A: Automatic TSX Code Sanitizer (`sanitizeTSXCode`)

Before passing AI-generated TSX string to Sucrase `compileTSX`:
1. **Strip TypeScript Annotations**: Remove `interface Props`, `type SceneProps = ...`, `: React.FC<{...}>`, `: string`, `: number`, `: any` annotations that trigger parser syntax errors.
2. **Repair String & Quote Escapes**: Clean double-quoted string attributes inside JSX (e.g. `alertText="BẮT ĐẦU "NGAY""` ➔ `alertText="BẮT ĐẦU NGAY"`).
3. **Inject Missing Imports**: Auto-detect usage of Remotion hooks (`useCurrentFrame`, `spring`, `interpolate`) and Lucide icons (`Terminal`, `Sparkles`, `Zap`, `Cpu`, etc.) and inject missing header imports.
4. **Ensure Component Export**: Guarantee clean `export default GeneratedScene;` syntax.

### Component B: Concept-Aware Multi-Template Fallback Engine (`generateSafetyNetTSX`)

If `compileTSX` still fails after sanitization, the fallback router analyzes the `visualConcept` keyword to select a matching fallback template:
- `CODE`, `TERMINAL`, `DIFF`, `DEV` ➔ **Code Terminal IDE Fallback** (interactive terminal with code diff).
- `FLOW`, `STEP`, `TIMELINE`, `PROCESS` ➔ **Horizontal 3-Step Flow Fallback** (step chain with glowing arrows).
- `VS`, `COMPARE`, `VERSUS` ➔ **Split Comparison Fallback** (Left vs Right side-by-side).
- `GAUGE`, `METRIC`, `PERCENT`, `RING` ➔ **3D Gauge Metric Fallback** (centerpiece 3D ring).
- `GRID`, `TILES`, `MATRIX` ➔ **2x2 Metric Grid Fallback** (4-tile matrix).
- `QUOTE`, `CITATION`, `EDITORIAL` ➔ **Editorial Quote Fallback** (citation card).
- `OUTRO`, `CTA`, `ACTION` ➔ **Outro CTA Fallback** (action button with pulse glow).

---

## 3. Verification Plan

1. **Sanitizer Unit Test**:
   - Run a test script feeding TSX code with syntax errors (TS types, unescaped quotes) into `sanitizeTSXCode` and verify clean Sucrase compilation.
2. **Concept Fallback Routing Test**:
   - Intentionally fail compilation for 5 distinct concepts (`CODE_TERMINAL_DIFF`, `HORIZON_3STEP_FLOW`, `VS_SPLIT_COMPARISON`, `HERO_GAUGE_RING`, `OUTRO_CTA_PULSE`) and verify that 5 distinct, concept-matched fallback layouts are returned.
3. **Build Check**:
   - Run `npm run build` in `frontend` to verify production stability.
