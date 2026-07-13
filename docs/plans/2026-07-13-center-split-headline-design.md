# Design: Center-Constrained Zigzag Split Headline Layout

## Context & Motivation
The "Intro Split Headline" layout is configured to display text in a zigzag alignment (Line 1/3 left-aligned, Line 2 right-aligned). In order to keep the dynamic zigzag layout style while ensuring the text does not touch the far-left screen boundaries, the text block is wrapped in a narrower, horizontally centered container. The subcards are also centered internally.

## User Approved Design
- **Headline Alignment**: 
  - Restrict the Headline Group container to a centered block of `width: 720px` (aligned via `left: "50%"`, `transform: "translateX(-50%)"`).
  - Inside this container, keep the zigzag alignment:
    - Category Pill: `justifyContent: "flex-start"` (left of the centered container).
    - Line 1: `textAlign: "left"` (left of the centered container).
    - Line 2: `textAlign: "right"` (right of the centered container).
    - Line 3: `textAlign: "left"` (left of the centered container).
  - Use original zigzag entrance animations (`slide-left`/`slide-right`).
- **Key Point Cards**:
  - Keep internal text and icon/badge center-aligned (`textAlign: "center"`, `justifyContent: "center"`).

## Proposed Code Changes
- [IntroSplitHeadlineMode.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/modes/IntroSplitHeadlineMode.tsx):
  - Change Headline Group container style to be centered and constrained to `width: "720px"`.
  - Revert Line 1, Line 2, and Line 3 styles inside `IntroSplitHeadlineMode` to keep `textAlign` to `"left"`, `"right"`, `"left"` and original animations.
  - Category Pill container style revert to `justifyContent: "flex-start"`.
  - Keep Card items centered internally (`textAlign: "center"`, `justifyContent: "center"`).
