# Design: Support Base64 Data URLs & Vision Analysis for Design Reference Images

**Date:** 2026-07-23  
**Status:** Approved  
**Topic:** Enable Gemini Vision API to analyze user-uploaded base64 Data URL reference images during scene TSX code generation in Studio AI Gen.

---

## 1. Problem Statement

When users select or upload design reference images in Studio AI Gen (`refImages`), the frontend passes image Data URLs (`data:image/png;base64,...`). 

In `backend/services/aiGen.js`, `urlToGenerativePart(imageUrl)` failed to handle `data:image/...` strings, logging `[Studio AI Gen] Local image not found` and returning `null`. As a result, `imageParts` was empty (`[]`), and Gemini received zero images, causing reference images to have no effect on AI video scene generation.

---

## 2. Proposed Architecture & System Design

### Component A: Base64 Data URL Parser in `urlToGenerativePart` (`aiGen.js`)
- Add regex matching for `data:image/...` Data URLs:
  - Extract MIME type (e.g. `image/png`, `image/jpeg`, `image/webp`).
  - Extract base64 payload data string.
  - Return Gemini `inlineData` object directly:
    ```javascript
    return {
      inlineData: {
        data: base64Payload,
        mimeType
      }
    };
    ```

### Component B: Enhanced Vision Layout Analysis Prompt (`aiGen.js`)
- Update `referenceInstruction` in `generateTSXCodeForScene`:
  - Direct Gemini Vision API to inspect the visual structure, layout alignment, container flex directions, gap spacing, and card placements of attached reference images while applying workspace `THEME` variables for styling.

### Component C: Server Upload Persistence
- Save uploaded reference images into `public/uploads/` on the backend server to ensure persistent accessibility and fast loading.

---

## 3. Verification Plan
1. **Automated Unit Test**:
   - Pass sample Data URL string to `urlToGenerativePart` and verify it returns valid `{ inlineData: { data, mimeType } }`.
2. **Backend Execution Verification**:
   - Generate scene with attached reference images, verify log output `[Studio AI Gen] Processing N design reference images...` and confirm Gemini returns layout-adapted TSX code.
