# Design: Safe Lucide Icons Proxy & Robust Import Rewriter

**Date:** 2026-07-23  
**Status:** Approved  
**Topic:** Eliminate React runtime crashes (`undefined` component render errors) caused by hallucinated Lucide React icon imports and ensure player preview layout stability in Studio AI Gen.

---

## 1. Problem Statement

When AI Gemini generates TSX scene code, it sometimes imports icon names that do not exist in `lucide-react` (e.g. `BrainAI`, `ChartUp`, `RobotHead`). 

When `loadComponentFromJS` rewrites imports to `const { ... } = window.LucideIcons;`, non-existent icon properties evaluate to `undefined`. When React attempts to render `<UndefinedComponent />`, React throws a fatal runtime exception:
`Element type is invalid: expected a string or a class/function but got: undefined.`

This crashes the component inside the Blob URL dynamic loader and triggers the player error state.

---

## 2. Proposed Architecture & System Design

### Component A: ES6 Proxy Wrapper for `window.LucideIcons`
- In `frontend/src/components/StudioAIGen.jsx`:
  - Wrap `LucideIcons` in an ES6 `Proxy`.
  - When code requests `window.LucideIcons[iconName]`:
    - If `iconName` exists on `LucideIcons`, return it directly.
    - If `iconName` does NOT exist, return a safe fallback React Component (`DummyIcon`) that renders `<Sparkles size={24} />` or `<HelpCircle size={24} />`.
  - Result: `window.LucideIcons[anyName]` NEVER returns `undefined`. React runtime crashes are 100% eliminated.

### Component B: Universal Import Rewriter Engine
- In `StudioAIGen.jsx`:
  - Expand `loadComponentFromJS` regex matching for `lucide-react`, `remotion`, and `react` imports:
    - Support named imports, default imports, multiline imports, single quotes (`'`), double quotes (`"`), and trailing semicolons.
    - Strip any unrecognized external package imports safely.

### Component C: Player Container & Error Card Layout Protection
- Ensure `SceneWrapper` root container always maintains `width: "100%", height: "100%"` with a dark ambient background `#030712`, preventing collapsed white screens or squished layout containers.

---

## 3. Verification Plan
1. **Automated Proxy Test**:
   - Verify that accessing `window.LucideIcons.FakeIconName` returns a valid React component instead of `undefined`.
2. **Import Rewriter Test**:
   - Test rewriting various single-quote, multi-line, and alias import statements.
3. **Runtime Verification**:
   - Verify scene loading in frontend preview with fake icon names.
