# 2026-08-02 Signal Rail Bullet Redesign Design

## Goal
Redesign the `SignalRailBullet` layout (`VerticalListMode.tsx` with ID `SignalRailBullet`) to resolve the empty/barren space on the right side of the portrait screen. Introduce a premium, high-fidelity two-column grid: a scaled-up list on the left and a glassmorphic macOS-style terminal on the right showing animated code/auto-fixes.

## Proposed Changes

### VerticalListMode.tsx
1. **Container Restructuring**:
   - Change `containerStyle` of the `isSignalRail` block to be a two-column row flex layout:
     ```typescript
     display: "flex",
     flexDirection: "row",
     justifyContent: "space-between",
     alignItems: "center",
     width: "100%",
     gap: "48px",
     maxWidth: t.container?.maxWidth || "960px",
     boxSizing: "border-box",
     position: "relative",
     zIndex: 5
     ```
2. **List Item Upscaling**:
   - Change step font size to `15px` (was `13px`).
   - Change cleanText font size to `getDynamicFontSize(cleanText, 32, fontScale)` (was `25`).
   - Change connector dot dimensions to `26px` by `26px` (was `20px`).
   - Update Y padding spacing: `paddingBottom` to `52px` (was `32px`).
   - Recalculate line and dot absolute offsets to match the larger dimensions.
3. **Glassmorphic Terminal Panel (Right Column)**:
   - Add a terminal panel sibling to the left column list.
   - Styled with macOS header buttons (red, yellow, green), blur backdrop (`blur(20px)`), and thin border.
   - Embed JSON code block that represents automatic configuration steps:
     ```json
     {
       "vscode.linter": {
         "autoFix": true,
         "realtimeScan": "enabled",
         "wrapTryCatch": "auto"
       }
     }
     ```
   - Animate a green/blue neon overlay scanning bar traversing the terminal container via CSS animation.
