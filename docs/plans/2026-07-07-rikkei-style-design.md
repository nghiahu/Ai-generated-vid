# Design Document: Rikkei Academy Visual Style (VDE Style-Guided)
**Date**: 2026-07-07  
**Topic**: Implement "Rikkei Academic" visual style

## 1. Goal Description
The purpose of this feature is to introduce a new high-fidelity visual style called "Rikkei Academic" to the Visual Design Engine (VDE). The style is directly inspired by the official Rikkei Education website branding, featuring a pure white background, soft pastel pink/crimson cards, and a prominent Crimson Red accent.

---

## 2. Proposed System Architecture

### A. Core Tokens (`rikkei` Style Specification)
The design tokens representing the style will be integrated across backend compiler definitions and frontend components:
- **Colors**:
  - `background`: `#ffffff` (main canvas background)
  - `cardBg`: `#FAF5F5` (warm pink-red tint card background)
  - `border`: `1.5px solid #F1E2E3` (delicate red-tint border)
  - `accent`: `#A8232A` (crimson red)
  - `text`: `#191919` (dark charcoal text)
  - `textSecondary`: `#595959` (medium gray description text)
- **Typography**:
  - Import the Google Font **Be Vietnam Pro** (Vietnamese-optimized geometric sans-serif) and assign it to titles and body texts.
- **Visual Nodes**:
  - Cards: `border-radius: 16px`, `box-shadow: 0 8px 24px rgba(168, 35, 42, 0.03)`.
  - Buttons: Crimson Red background, white text, pill bo góc `12px` with a play/chevron icon.
  - Subheaders: Spaced, uppercase crimson red text.

### B. Backend AI Adaptation
1. Register `rikkei` as an allowed theme in Gemini's prompt schema.
2. Instruct Gemini to use `subheader`, `logo_row`, and `button` blocks for the `rikkei` style to create a structured and clean academic tutorial feeling.

### C. Frontend Selection & Mockup Previews
1. Add the `rikkei` style definition in the frontend `StoryboardEditor.jsx` style list.
2. Code a high-fidelity visual preview representing the Rikkei Edu website elements in the style gallery modal.

---

## 3. Verification Plan
- **Mockup preview check**: Open the style selection modal in the Storyboard Editor and verify that the Rikkei Academic style card displays the correct colors, layout, and preview elements.
- **Remotion Rendering test**: Set visualStyle to `rikkei` in the editor, check that all blocks (subheader, title, cards, buttons) render using the Be Vietnam Pro font and crimson color schema.
