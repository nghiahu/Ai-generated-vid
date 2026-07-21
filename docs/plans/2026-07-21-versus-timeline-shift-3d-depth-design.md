# Design Document: Versus Timeline Shift 3D Depth & Diagonal Offset

## Problem Statement
Enhance `TimelineShiftMode.tsx` to make the two cards more compact (`68%` width), staggered diagonally, and rendered with 3D spatial perspective (Card 1 pushed back in 3D space, Card 2 popping forward in the 3D foreground).

## Technical Implementation
1. **Container Perspective**: Add `perspective: 1200px` to `outerContainerStyle`.
2. **Card 1 (Past Phase - Pushed Back)**:
   - Width: `68%`, `alignSelf: flex-start`.
   - 3D Transform: `rotateY(10deg) rotateX(-6deg) scale(0.92)`.
   - Opacity: `0.88`, `zIndex: 5`.
3. **Card 2 (Upgraded Future - Popping Forward)**:
   - Width: `70%`, `alignSelf: flex-end`.
   - 3D Transform: `rotateY(-10deg) rotateX(6deg) scale(1.08)`.
   - Opacity: `1.0`, `zIndex: 10`.
   - BoxShadow: `0 30px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(234, 179, 8, 0.4)`.

## Verification Plan
1. Check `SplitBandChecklist` layout in preview player.
2. Confirm 3D depth tilt and diagonal staggered layering.
