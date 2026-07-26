# Design: Dynamic Generative UI & Visual Primitives Engine for Studio AI Gen

**Date:** 2026-07-26  
**Status:** Approved  
**Topic:** Transform Studio AI Gen from static visual pattern slots into an AI Generative UI reasoning engine that dynamically designs unique, context-aware visual layouts per scene using standardized UI Primitives with guaranteed TSX compile safety and zero visual repetition.

---

## 1. Problem Statement

Previously, Studio AI Gen relied on 10 rigid, pre-defined visual patterns (`BULLET_GLASS`, `DONUT_GAUGE`, `HERO_METRIC_GLOW`, etc.). Gemini was constrained to picking 1 of these 10 slots and slotting text/numbers into static exemplars. As a result:
- Videos felt repetitive across scenes with fixed static layouts.
- AI could not perform dynamic visual reasoning to invent bespoke graphic representations (e.g. code terminals, process flows, split comparisons, interactive metrics) matching script context.

---

## 2. Proposed Architecture & System Design

### Component A: 2-Phase Dynamic Visual Reasoning Pipeline (`aiGen.js`)

1. **Phase 1: Dynamic Visual Reasoning Planner (`generateScenePlanForAIGen`)**
   - **Input**: Full script lines and voiceover content.
   - **Reasoning**: Gemini analyzes script semantic intent and generates a unique `visualConcept` for each scene (e.g., `"CODE_TERMINAL_DIFF"`, `"HORIZON_3STEP_FLOW"`, `"HERO_METRIC_GAUGE_RING"`, `"VS_SPLIT_COMPARISON"`).
   - **Visual History Guard**: Strictly enforces non-repetition across consecutive scenes:
     `visualConcept[i] != visualConcept[i-1]` and `visualConcept[i] != visualConcept[i-2]`.

2. **Phase 2: Generative TSX Code Engine with UI Primitives (`generateTSXCodeForScene`)**
   - **Input**: `visualConcept`, scene script data, and UI Design System Primitives.
   - **Generative UI**: Gemini freely composes dynamic layouts (Flex/Grid, Split-Screen, Vertical Chain, Hero Floating) and selects matching theme color palettes (Cyber Cyan-Indigo, Emerald Teal-Green, Sunset Violet-Amber, Neon Slate-White) and Lucide icons.

### Component B: Standardized UI Design System Primitives

System instructions in Phase 2 provide standardized, battle-tested UI Primitives:
- `<GlassContainer>`: Glassmorphism card with glowing borders, ambient backdrop blur, and neon rim light.
- `<GlowBadge>`: Neon status badge for categories, steps, or labels.
- `<CodeTerminal>`: Developer IDE / Terminal window with window controls, line numbers, and monospace font.
- `<MetricGauge>`: 3D animated SVG percentage ring with smooth spring counter.
- `<StatCard>`: Hero metric tile with auto-incrementing numbers and scale spring.
- `<FlowArrow>`: Connectors for multi-step process chains.
- `<ComparisonColumn>`: Split-screen comparison cards (Before vs After, Traditional vs AI).
- `<SafeIcon>`: Proxy wrapper rendering Lucide icons safely without runtime errors.

### Component C: Zero-Error Safety Net & Fallback Execution

- **Sucrase Validation**: Every generated TSX component is parsed and sanitized by `Sucrase` before returning.
- **Fallback Template**: If TSX compilation fails, backend seamlessly wraps script content into a safe `<GlassContainer>` layout fallback so video generation never halts.

---

## 3. Verification Plan

1. **Visual Rotation Test**:
   - Generate an 8-scene video and verify Phase 1 assigns 8 distinct `visualConcept` entries with zero consecutive duplicates.
2. **Remotion Render & Build Verification**:
   - Verify generated scenes compile smoothly without React errors.
   - Run `npm run build` in `frontend` to verify production build stability.
