# Design Document: Restore Intro Bubble Image & Separate Venn Spheres Layout

## Problem Statement
The user previously had `IntroBubbleImage` (Orbital Solar System Bubbles with orbital ring path). When `IntroMetricPillImage` (Venn Glass Spheres) was created, it accidentally replaced `IntroBubbleImage`. This design document restores `IntroBubbleImage` as `OrbitalBubblesMode.tsx` and separates `IntroMetricPillImage` as `VennSpheresMode.tsx`.

## Design Specifications

### 1. `IntroBubbleImage` (`OrbitalBubblesMode.tsx`) - Reference Image 1
- **Structure**:
  - Center main bubble (318px, gold/accent glow).
  - Top-left satellite bubble (198px).
  - Bottom-right satellite bubble (198px).
  - Thin circular SVG orbital ring path behind the 3 bubbles.
- `layoutMode`: `"orbital_bubbles"`.

### 2. `IntroMetricPillImage` (`VennSpheresMode.tsx`) - Reference Image 2
- **Structure**:
  - 3 intersecting glass spheres forming a centered Venn diagram cluster.
  - Top sphere (Red glow `#EF4444`).
  - Bottom-left sphere (Gold glow `#EAB308`).
  - Bottom-right sphere (Purple/Pink glow `#EC4899`).
- `layoutMode`: `"venn_spheres"`.

## Verification Plan
1. Test `IntroBubbleImage` in preview player -> Confirm 3 orbital bubbles with orbital ring path.
2. Test `IntroMetricPillImage` in preview player -> Confirm 3 intersecting Venn glass spheres.
