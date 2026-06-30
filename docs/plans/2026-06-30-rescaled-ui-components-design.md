# Design Doc: Rescaling Video UI Components for 1080x1920 Canvas

## Goal
Scale up all video layout UI blocks (Title, Terminal, Metric, Badge Row, Feature Cards) and overall layout spacings/paddings by ~1.8x to 2.2x. This ensures they are fully legible and visually proportional on a vertical HD video (1080x1920) and in the scaled-down Master Player preview.

## Background & Rationale
Currently, the UI elements rendering inside Remotion use relatively small sizes (e.g. 12px to 18px font size, 20px card padding), which were originally styled like standard web/mobile screens. However, since the Remotion canvas is rendered at a full 1080x1920 resolution, these values appear microscopic. Tăng kích thước đồng bộ ensures proper contrast, legibility, and premium presentation.

## Proposal

### 1. Style Scale-up (`my-video/src/components/layout/UIBlocks.tsx`)
*   **Card Styles (`getThemeStyles`)**:
    *   `padding`: `20px 24px` $\rightarrow$ `32px 40px`
    *   `borderRadius`: `12px` $\rightarrow$ `24px` (for default/glassmorphic themes)
    *   `borderWidth` (Brutalist): `3px` $\rightarrow$ `5px`
    *   `boxShadow` (Brutalist): `6px 6px` $\rightarrow$ `10px 10px`
*   **TitleBlock**:
    *   Category badge font-size: `12px` $\rightarrow$ `22px`, padding: `5px 12px` $\rightarrow$ `10px 22px`
    *   Main H1 font-size: `52px` (long) / `68px` (short) $\rightarrow$ `80px` (long) / `105px` (short)
*   **TerminalBlock**:
    *   Header pill dots: `8px` $\rightarrow$ `14px`, gap: `6px` $\rightarrow$ `12px`
    *   Code text font-size: `16px` $\rightarrow$ `28px`
    *   Blink cursor width/height: `8px x 15px` $\rightarrow$ `14px x 26px`
*   **HeroMetricBlock**:
    *   Metric number value: `64px` $\rightarrow$ `128px`
    *   Subtext: `18px` $\rightarrow$ `32px`
*   **FeatureCardBlock**:
    *   Bullet dot: `6px` $\rightarrow$ `12px`, gap: `14px` $\rightarrow$ `24px`
    *   Text: `18px` $\rightarrow$ `32px`
*   **BadgeRowBlock**:
    *   Badge text: `13px` $\rightarrow$ `24px`
    *   Padding: `6px 14px` $\rightarrow$ `12px 24px`
    *   BorderRadius: `6px` $\rightarrow$ `12px`

### 2. Constraint Height Estimates (`my-video/src/utils/layoutResolver.ts`)
Update component height estimates in `parseSceneToComponents` so the collision resolver correctly calculates vertical space usage:
*   `title` height: `180` $\rightarrow$ `280`
*   `terminal` height: `140` $\rightarrow$ `220`
*   `badge_row` height: `80` $\rightarrow$ `130`
*   `hero_metric` height: `180` $\rightarrow$ `260`
*   `feature_card` height: `100` $\rightarrow$ `150`
*   `media` height: `380` $\rightarrow$ `450`

### 3. Layout Dimensions & Gaps (`my-video/src/compositions/DynamicLayout.tsx`)
*   **Default Padding**: `60px 40px` $\rightarrow$ `100px 60px`
*   **Default Gap**: `30px` $\rightarrow$ `50px`
*   **SplitScreen**: Left media border/glow and padding adjustments: padding `50px 30px` $\rightarrow$ `80px 40px`, gap `24px` $\rightarrow$ `40px`
*   **FeatureGrid**: gap: `16px` $\rightarrow$ `28px`
*   **Timeline**: Left dashed line margin `15px` $\rightarrow$ `25px`, Circle node dimensions `30px x 30px` $\rightarrow$ `50px x 50px`, line-height adjustments.
*   **Comparison**: gap: `20px` $\rightarrow$ `35px`
*   **Gallery**: Image height `380px` $\rightarrow$ `450px`

## Verification Plan
1. Run Remotion preview server to inspect layout rendering:
   ```bash
   npx remotion preview
   ```
2. Run type checking and lint checks on `my-video`:
   ```bash
   npm run typecheck
   ```
3. Open Frontend player in local browser to verify scaling matches expectations and layout resolved items look clean.
