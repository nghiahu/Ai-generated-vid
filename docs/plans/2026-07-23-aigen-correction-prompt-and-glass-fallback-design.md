# Design: Gemini TSX Retry Prompt Enhancement & Premium Glass Fallback Component

**Date:** 2026-07-23  
**Status:** Approved  
**Topic:** Eliminate AI-generated scene TSX compilation failures and plain black fallback screens in Studio AI Gen.

---

## 1. Problem Overview

When Gemini generates TSX scene components in Studio AI Gen (`aiGen.js`), syntax or import errors can occur during Sucrase compilation. When initial code compilation fails and auto-correction retry fails (or times out), `aiGen.js` catches the exception and falls back to a primitive, unstyled black container:
```tsx
<div style={{ width: 1080, height: 1920, background: "#030712", color: "#fff", display: "grid", placeItems: "center", fontSize: 40 }}>
  <div>{heading}</div>
</div>
```
This fallback results in a stark, plain black screen with a single unstyled text string in the middle of the video, breaking the aesthetic design of the application.

---

## 2. Proposed Architecture & System Design

### Component A: Enhanced Gemini Correction Prompt (Retry Prompt with Sucrase Diagnostics)
- **Detailed Error Context**: Include exact Sucrase line number, token location, and error message in the prompt passed to Gemini during the retry phase.
- **Strict Allowed Imports Context**: Inject the explicit allowed imports list for `lucide-react`, `remotion`, and `react` directly into the correction prompt so Gemini never hallucinates non-existent modules or alias syntax.
- **Explicit Output Format**: Enforce raw TSX code output starting with `import ...` and ending with `export default GeneratedScene;`.

### Component B: Premium Glass Card Fallback Component
- Replace the bare black fallback block with a high-end Remotion TSX component.
- Features:
  - Ambient radial glowing background (`#030712` + 2 floating glowing blurred background orbs with `filter: "blur(80px)"`).
  - Glassmorphic container card (`backdropFilter: "blur(16px)"`, border, rounded corners).
  - Glowing orange/cyan badge with `Sparkles` icon.
  - Smooth spring animation entrance for scene heading.
  - Subtitle safe zone compliance (content strictly in top 78%, subtitles at bottom 22%).

### Component C: Icon & TSX Pre-Sanitization
- Update `sanitizeImportStatements` in `aiGen.js`:
  - Validate imports from `lucide-react`. Replace invalid or hallucinated icon imports with safe icons (`Sparkles`, `Zap`, `Shield`, `Activity`, `CheckCircle`, `Flame`, `TrendingUp`, `Layers`, `Award`).
  - Strip any invalid alias syntax or markdown commentary leaked above import declarations.

---

## 3. Verification Plan
- Run automated unit test verifying:
  1. Failed Sucrase compilation correctly passes line/token errors to Gemini retry logic.
  2. Fallback component produces full-featured Glass Card TSX code without errors.
  3. `sanitizeImportStatements` cleans invalid icon imports.
