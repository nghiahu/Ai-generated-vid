# 2026-08-02 AI Hub Grid Alignment Design

## Goal
Fix the alignment of the Flywheel layout (`AIHubGrid1` or `Flywheel`) where the blue orbital ring and the circular cards are horizontally and vertically misaligned due to container padding discrepancies.

## Proposed Changes

### TemplateLayout.tsx
- Check if the current template is a Flywheel layout: `const isFlywheel = t.id === "AIHubGrid1" || t.id === "Flywheel";`.
- Override `padding`, `paddingTop`, and `paddingBottom` to `0px` in `containerStyle` if `isFlywheel` is true. This ensures the Content layer spans the exact $1080 \times 1920$ canvas and eliminates padding-origin browser discrepancies.

### AbsoluteCardsMode.tsx
- Revert the `isFlywheel` block wrapper to `position: "relative", width: "100%", height: "100%"` (since parent is now exactly $1080 \times 1920$ starting at $(0, 0)$).
- Add `viewBox="0 0 1080 1920"` to the SVG element to enforce explicit viewport scale coordinates.
- Fine-tune Card 1's vertical position: `top: 842px` in `circleConfigs` to align its center at $Y = 982px$ (exactly on the top edge of the $265px$ radius outer circle centered at $1247px$).
