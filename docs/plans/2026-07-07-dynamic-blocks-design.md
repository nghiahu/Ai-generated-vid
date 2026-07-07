# Design Document: VDE Rich Semantic Blocks System
**Date**: 2026-07-07  
**Topic**: AI-driven dynamic blocks for custom layout elements

## 1. Goal Description
The purpose of this feature is to upgrade the storyboard rendering system from hardcoded layouts with regex-inferred components to a semantically rich, AI-driven block architecture. This allows Gemini to dynamically design custom sub-components (such as side-by-side logos, subheaders, and call-to-action buttons) based on the visual style's Design DNA while ensuring strict adherence to the style's visual guidelines.

---

## 2. Proposed System Architecture

### A. Dynamic Semantic Block Schema
Gemini will output an array of structured block objects in the `points` field of each scene. The schema supports the following types:
- `subheader`: Subtitle displayed above the main heading (e.g. `CLAUDE CODE × REMOTION`).
- `logo_row`: Horizontal row showcasing cards with technology logos connected by `×`.
- `button`: High-fidelity call-to-action button (e.g. `Xem AI tự làm từ A-Z`).
- `badge_row`: Badges/pills (e.g. `Không tự quay`, `Không cầm máy`).
- `terminal`: MacOS window with code terminal output.
- `hero_metric`: Analytics sparklines and highlighted numbers.
- `text`: Standard descriptive bullet card.

### B. Decoupled Styling Layer (Frontend)
The style of each block type is entirely mapped to the active `vdeTokens` (typography, color, borders, radius, shadow) of the current theme:
- **Claude theme**: Sand beige backgrounds, serif Playfair Display fonts, clay-orange accent buttons.
- **Cyberpunk theme**: Pitch black, sans-serif Montserrat fonts, neon-glowing borders.
- **Apple theme**: White, clean thin typography, elegant glassmorphism buttons.

---

## 3. Detailed Component Plan

### Backend (ai.js)
1. Update Gemini's `generateStoryboard` system prompt with the new JSON Schema for `points`.
2. Add visual guidelines instructing Gemini to select block types appropriate for the style (e.g., `subheader` and `logo_row` for Claude, `terminal` for Tech/Cyberpunk).

### Frontend (my-video)
1. **`layoutResolver.ts`**: Parse structured points objects, extracting the `type` parameter directly. Fall back to regex parsing for legacy text strings (backward compatibility).
2. **`UIBlocks.tsx`**: Implement `SubheaderBlock`, `LogoRowBlock` (with inline SVG assets), and `CTAButtonBlock`. Style them dynamically using VDE theme tokens.
3. **`DynamicLayout.tsx`**: Add the new block components to the layout renderer.

---

## 4. Verification Plan
- **Mock test**: Create a mock project using the new structured `points` and confirm that it renders perfectly across all VDE styles (Claude, Cyberpunk, Apple, etc.) in the Remotion preview.
- **AI test**: Trigger AI generation for a new project and inspect the database JSON to verify that Gemini outputs the correct structured blocks.
- **Export validation**: Render and export the video to verify that the final MP4 matches the preview in high quality.
