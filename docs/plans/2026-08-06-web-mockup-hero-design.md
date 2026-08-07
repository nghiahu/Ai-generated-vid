# WebMockupHero Layout Design

## Overview
This design document specifies a new layout mode named `WebMockupHero` (layoutMode: `web_mockup_hero`) that displays an interactive macOS browser mockup centered in a 3D perspective with floating motion. Spaced above are stacked rows of tags/badges, and centered below is the scene subtitle/voiceover. It is ideal for showcasing git repositories, websites, and SaaS products.

## Component Structure
The layout consists of the following components arranged vertically in a 9:16 layout:
1. **Category Pill (Phía trên cùng)**:
   - Dynamic label with glowing dot (e.g. `• TRENDING`).
2. **Detail Pills (Hàng nhãn dưới category)**:
   - Alternating colors based on theme accent (e.g. `★ 3.4K stars`, `BY MengTo`, `LICENSE MIT`).
   - Auto-generated decorative placeholders if no storyboard points of type `badge_row` are present.
3. **3D Browser Mockup**:
   - macOS title bar window with control buttons (Red, Yellow, Green).
   - Address bar showing a mockup domain.
   - Client area displaying `imageUrl`. If empty/invalid, it displays a mockup placeholder image.
   - 3D perspective wrapper (`perspective: 1200px`) and rotate properties applied on mount and sways gently over time.
   - Overlay tag at the bottom-left of the client frame showing sub-information (e.g., `• 89 demo · gallery xem trước`).
4. **Centered Subtitle**:
   - Subtitle text centered at the bottom of the screen.

## Data Schema & AI Contract
Add the following layout contract to `backend/services/contractLoader.js`:
```javascript
WebMockupHero: {
  layoutId: 'WebMockupHero',
  family: 'Opening / Headline',
  headingMaxChars: 45,
  pointsCount: { min: 1, max: 4, default: 2 },
  pointMaxChars: 50,
  allowedPointTypes: ['badge_row', 'card'],
  aiHint: 'Layout trình diễn trình duyệt web xoay nghiêng 3D bồng bềnh, có các viên thuốc nhỏ chi tiết phía trên và phụ đề căn giữa ở dưới cùng.'
}
```

## Animation & 3D Math Details
- **Mounting animation (Frame 0 - 35)**:
  - Browser mockup scales up from `0.85` to `1.0`.
  - Tilts dynamically: `rotateX` moves from `0deg` to `12deg`, `rotateY` moves from `0deg` to `-8deg`, `rotateZ` moves from `0deg` to `2deg`.
- **Floating animation (Frame 35+)**:
  - `translateY` sways gently based on `Math.sin(frame / 25) * 8`.
  - `rotateX` oscillates: `12 + Math.sin(frame / 35) * 1.5`.
  - `rotateY` oscillates: `-8 + Math.cos(frame / 35) * 1.5`.
- **Colors**:
  - Background gradients, shadows, and borders conform strictly to VDE theme tokens.
  - Suffix and accent components use theme `accentColor` and opacity ratios.
