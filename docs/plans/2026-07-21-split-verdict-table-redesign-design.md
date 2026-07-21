# Design Document: Split Verdict Table Redesign

## Problem Statement
The `split_proof_bullet` / `before_after_panel` (Split Verdict Table) layout currently renders inline highlights rather than splitting card text into a main context phrase (Row 1) and a dedicated enlarged highlighted metric/word on a new line below (Row 2). Additionally, the Verdict card on the right needs to be enlarged (`scale(1.05)`) with an intense red glowing border to emphasize the verdict result.

## Design Decisions
1. **Text Partitioning Helper (`extractBodyAndHighlight`)**:
   - Parses card text into a context phrase (`body`) and a highlighted keyphrase (`highlight`).
   - Row 1: `body` (fontSize 24-28px, white/grey).
   - Row 2: `highlight` (fontSize 40-48px, bold 950, Gold `#EAB308` on Left card, Red `#EF4444` on Right card).
2. **Right Card Enlargement & Glow**:
   - Applies `transform: scale(1.05)` and `border: 2px solid rgba(239, 68, 68, 0.8)` with shadow `0 0 30px rgba(239, 68, 68, 0.3)`.

## Verification Plan
1. Render Split Verdict Table in preview player.
2. Confirm Left card has `EVIDENCE 01` label, body text, and gold highlighted metric below on a new line.
3. Confirm Right card has `VERDICT` label, enlarged scale, body text, and red highlighted metric below on a new line.
