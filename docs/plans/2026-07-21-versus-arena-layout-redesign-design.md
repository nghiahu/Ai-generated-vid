# Design Document: Versus Arena Layout Redesign

## Problem Statement
The `split_horizontal` (Versus Arena / Comparison) layout currently lacks visual parity with high-fidelity reference samples:
- `VS` badge is oversized (80-110px) with single accent border rather than a compact (#020617) dark circle with white `#ffffff` text.
- Cards lack dual-accent styling (Left = Red glow & `#SIDE 01` red highlight, Right = Gold glow & `#SIDE 02` gold highlight).
- Text inside side cards lacks keyword highlighting (`highlightHeadingText`) and occasionally has duplicated suffix text.

## Solution Architecture
1. **`my-video/src/compositions/layouts/modes/SplitHorizontalMode.tsx`**:
   - Re-style `vsBadgeStyle` into a 56px dark circle with `#ffffff` text.
   - Introduce `leftAccentColor` (`#EF4444`) and `rightAccentColor` (`#EAB308`).
   - Use `highlightHeadingText` for side card text with matching side accent color.
   - Clean up text deduplication logic.

## Verification Plan
1. Render `split_horizontal` / Comparison layout in preview player.
2. Confirm dual glow (Red Left vs Gold Right).
3. Confirm 56px dark `VS` badge with white text.
4. Verify text highlights work without repetition.
