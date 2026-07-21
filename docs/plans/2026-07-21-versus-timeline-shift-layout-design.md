# Design Document: Versus Timeline Shift Layout (`SplitBandChecklist`)

## Problem Statement
The `SplitBandChecklist` layout previously lacked a dedicated template and fell back to generic non-matching templates. The user requested transforming `SplitBandChecklist` into the **Versus Timeline Shift** layout matching their reference screenshot.

## Design Specification
1. **Outer Container Box (`TimelineShiftMode.tsx`)**:
   - Dark glass container box (`rgba(15, 23, 42, 0.6)`, `backdropFilter: blur(20px)`, `border: 1.5px solid rgba(255, 255, 255, 0.12)`, `borderRadius: 32px`).
2. **Top-Left Staggered Card (Past Phase / Card 1)**:
   - Category label left: `KỸ NĂNG HOT NHẤT` (Red `#EF4444`).
   - Badge right: `PAST PHASE` (grey/cyan pill).
   - Body phrase: `"Kỹ năng hot nhất"`.
   - Highlight metric below (new line): **`2026`** (Red `#EF4444`, 40px bold 950).
3. **Connecting Dotted Shift Line**:
   - SVG dashed line (`stroke="#EAB308"`, `strokeDasharray="6 6"`) connecting Card 1 bottom-right to Card 2 top-left.
4. **Bottom-Right Staggered Card (Upgraded Future / Card 2)**:
   - Category label left: `CHỈ CÓ BA BƯỚC` (Gold `#EAB308`).
   - Badge right: `UPGRADED FUTURE` (gold glowing pill `#EAB308`).
   - Border: `1.5px solid #EAB308` with gold shadow glow (`0 0 25px rgba(234, 179, 8, 0.2)`).
   - Body phrase: `"Chỉ có ba bước"`.
   - Highlight metric below (new line): **`3 bước`** (Gold `#EAB308`, 40px bold 950).

## Implementation Steps
1. Create `split_band_checklist.json` in `Opening-Headline/`.
2. Create `TimelineShiftMode.tsx` in `modes/`.
3. Register `timeline_shift` in `TemplateLayout.tsx`.
4. Update `KEY_OVERRIDES` in `index.ts`.

## Verification Plan
1. Render `SplitBandChecklist` in preview player.
2. Confirm 2 staggered cards inside outer glass container.
3. Confirm `PAST PHASE` vs `UPGRADED FUTURE` pills, gold dashed connector line, and 2-row text highlights match reference image.
