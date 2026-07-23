# Design Document: Content 80% Height Constraint & Subtitle Safe Zone Fix

**Date**: 2026-07-23  
**Status**: Proposed / Approved  

---

## 1. Overview & Problem Statement

In AI-generated dynamic TSX components (`StudioAIGen.jsx`), content cards and vertical split panels often stretch down to 92%-95% of the viewport height (e.g. y = 1750px+ out of 1920px canvas height). This causes content to collide directly with the bottom subtitle bar and violate the design rule requiring main visual content to occupy ONLY the top 80% of the screen.

### Root Causes
1. **Unconstrained Inner Flex/Grid Height**: The LLM system prompt in [aiGen.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/aiGen.js#L515-L525) specified `paddingBottom: "18%"`, but permitted inner grid/column containers to use `height: "100%"` or `flex: 1` without a `maxHeight` clamp.
2. **Missing Hard CSS Wrapper Clamp**: In [AICodeLayout.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/AICodeLayout.tsx), custom HTML/TSX components are rendered directly inside a `100% x 100%` AbsoluteFill container without enforcing a `maxHeight: "78%"` layout box.

---

## 2. Proposed Architecture & Solution

### Component 1: `AICodeLayout.tsx` Hard CSS Boundary Clamp
- Wrap custom component HTML/TSX inside a structural boundary box constrained to the top 78% of the viewport (`height: "78%"`, `maxHeight: "1497px"`, `position: "absolute"`, `top: 0`, `left: 0`, `width: "100%"`).
- This ensures that even if an AI-generated component uses `height: "100%"`, CSS will hard-clamp its bounding box to the top 78%, keeping the bottom 22% (~423px) completely clear for subtitles.

### Component 2: `aiGen.js` Prompt Rules Enforcement
- Update the system instructions in `backend/services/aiGen.js`:
  - **Content Container Boundary**: Set `maxHeight: "76%"` and `paddingBottom: "22%"` (~420px bottom safe space).
  - **Card/Panel Height Limit**: Enforce `maxHeight: "950px"` (or `maxHeight: "52vh"`) on all split cards, columns, and grid items.
  - **Subtitle Safe Distance**: Ensure bottom subtitles sit at `bottom: "60px"` with `maxWidth: "920px"` and font-size `28px` - `32px`.

---

## 3. Verification Plan

### Manual Verification
1. Open Studio AI Gen in the web application.
2. Generate or regenerate Scene 1 with split cards/columns.
3. Verify that all cards and content stop cleanly at or above 78% height (~1490px), leaving a spacious, non-overlapping bottom 22% zone for subtitles.
