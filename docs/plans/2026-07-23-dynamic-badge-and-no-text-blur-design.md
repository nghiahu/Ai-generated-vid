# Design: Dynamic Alert Badge & Crisp Text (No Blur On Text) Rule

**Date:** 2026-07-23  
**Status:** Approved  
**Topic:** Remove hardcoded `"AI GENERATED SCENE"` badge text from fallback component, enforce crisp 100% unblurred heading text, and sanitize text blur styles in Studio AI Gen.

---

## 1. Problem Statement

1. **Hardcoded English Fallback Badge**: When a scene fell back to the fallback component in `aiGen.js`, the top capsule badge rendered hardcoded English text `AI GENERATED SCENE`, which looked like a developer debug watermark in final videos.
2. **Blurred Heading Text**: AI Gemini occasionally applied `filter: "blur(...)"` or misplaced `backdropFilter` containers onto main heading text elements, causing titles (e.g. "Nhận lộ trình Kỹ thuật Dữ liệu AI") to render blurry and illegible.

---

## 2. Proposed Architecture & System Design

### Component A: Dynamic Alert Badge & Clean Fallback Header (`aiGen.js`)
- In `backend/services/aiGen.js`:
  - Remove `<span>AI GENERATED SCENE</span>` completely.
  - If `scene.alertText` is present: render `<Sparkles size={24} color="#fb923c" /> <span>${scene.alertText}</span>`.
  - If no `alertText` exists: return `null` so no badge element is rendered, keeping fallback screens clean and unbranded.

### Component B: Strict "NO BLUR ON TEXT" Prompt Rule (`aiGen.js`)
- In `systemInstruction` in `aiGen.js`:
  - Add explicit rule `NO BLUR ON TEXT (MANDATORY & ABSOLUTE)`:
    - `filter: "blur(...)"` is strictly restricted to background ambient glowing orbs (`zIndex: 1`).
    - Prohibit applying `filter: "blur(...)"` or overlay `backdropFilter` containers to any heading text, titles, text containers, or text words. All text must remain 100% sharp and readable at all times.

### Component C: Automatic Code Sanitization of Blur Styles on Text (`aiGen.js`)
- In `sanitizeImportStatements` / `cleanAndExtractCode`:
  - Strip any `filter: "blur(...)"` properties applied to heading or title text elements before Sucrase compilation.

---

## 3. Verification Plan
1. **Automated Unit Test**:
   - Verify fallback component renders without `"AI GENERATED SCENE"`.
   - Verify `cleanAndExtractCode` strips blur filters from heading text elements.
2. **Compilation Test**:
   - Verify code compilation produces clean, sharp TSX.
