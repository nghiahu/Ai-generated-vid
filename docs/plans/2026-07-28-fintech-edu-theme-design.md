# fintech_edu Theme Design

**Date**: 2026-07-28  
**Status**: Approved  
**Reference**: RKKEIEdu AI Data Analyst poster (Deep Blue + Cyan + Gold)

---

## Overview

Tạo theme video mới tên `fintech_edu` cho hệ thống Remotion video generator. Theme lấy cảm hứng từ phong cách poster giáo dục công nghệ của RKKEIEdu: nền navy gradient đậm, glow cyan electric, circuit board texture, và layout dashboard có metrics card. Theme này phục vụ nội dung khóa học AI/Data/Fintech.

---

## Identity & DNA

| Thuộc tính | Giá trị |
|---|---|
| Theme key | `fintech_edu` |
| Display name | FinTech Edu — Deep Blue AI |
| Extends | (standalone, không extends) |
| Tone | Futuristic · Professional · Energetic |
| Best for | Khóa học AI, Data Analyst, Fintech, Tech education |

---

## Color System

```
--bg-base:        linear-gradient(160deg, #0028a0 0%, #001060 50%, #000A3A 100%)
--bg-card:        rgba(0, 40, 160, 0.35)  +  backdrop-filter: blur(16px)
--accent-cyan:    #00d4ff   (Electric Cyan — glow, border, icons)
--accent-gold:    #FFD700   (Gold — CTA text, số highlight, badge)
--text-primary:   #FFFFFF
--text-secondary: rgba(255, 255, 255, 0.75)
--border:         1.5px solid rgba(0, 212, 255, 0.4)
--glow-sm:        0 0 15px rgba(0, 212, 255, 0.25)
--glow-md:        0 0 30px rgba(0, 212, 255, 0.35), 0 0 60px rgba(0, 212, 255, 0.1)
--glow-lg:        0 0 50px rgba(0, 212, 255, 0.4), 0 0 100px rgba(0, 212, 255, 0.15)
```

---

## Typography

| Role | Font | Weight | Style |
|---|---|---|---|
| Hero title | Chakra Petch | 900 | UPPERCASE + cyan text-shadow |
| Section badge | Chakra Petch | 700 | `[ BRACKET ]` format |
| Numbered items | Chakra Petch | 700 | Cyan numbered label |
| Body/description | Be Vietnam Pro | 400–500 | Normal, #ffffff75 |
| Metrics value | Chakra Petch | 800 | Gold color |

---

## Background Layer System (3 layers)

### Layer 1 — Base Gradient
```
background: linear-gradient(160deg, #0028a0 0%, #001060 50%, #000A3A 100%);
```

### Layer 2 — Circuit Board SVG Pattern
- SVG inline với grid đường ngang/dọc (opacity: 0.08)
- Node circles tại intersection (opacity: 0.12)
- Connecting line segments random (opacity: 0.06)
- Màu: #00d4ff (cyan)
- Kích thước cell: 40x40px

### Layer 3 — Glow Orbs
- Bottom-left: radial-gradient cyan (rgba(0,212,255,0.15), radius 300px)
- Top-right: radial-gradient blue-white (rgba(100,180,255,0.1), radius 250px)
- Animation: pulse — opacity 0.3→0.6, 3s ease-in-out infinite alternate

---

## Layout Template Structure

```
┌─────────────────────────────────────────┐
│ [LOGO] ————————————————— [BADGE TEXT]   │  Header
├─────────────────────────────────────────┤
│                                         │
│  [ KỲ NGUYÊN AI ]  <- small badge       │
│  BIG HERO TITLE                         │  Hero
│  WITH [AI] chip visual                  │
│                                         │
├─────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │Metric│  │Metric│  │Metric│          │  Dashboard
│  │ Card │  │ Card │  │ Card │          │  Metrics Row
│  └──────┘  └──────┘  └──────┘          │
├─────────────────────────────────────────┤
│  ① Title 1  <- cyan glow number         │
│     Description text                    │  Numbered
│  ② Title 2                             │  List
│     Description text                    │  (glassmorphism
│  ③ Title 3                             │   cards)
│     Description text                    │
├─────────────────────────────────────────┤
│         [ >> CTA BUTTON << ]            │  Footer CTA
└─────────────────────────────────────────┘
```

---

## Components Cần Tạo / Cập Nhật

| Component | Action | Mô tả |
|---|---|---|
| `vde_themes.json` | ADD | Entry `fintech_edu` với đầy đủ tokens |
| `vdeTokens.ts` | ADD | Override logic cho `fintech_edu` |
| `CircuitBoardBg.tsx` | CREATE | SVG circuit pattern + glow orbs background layer |
| `MetricsDashboardCard.tsx` | CREATE | 3 metric cards ngang với count-up animation |
| `BracketBadge.tsx` | CREATE | Badge tiêu đề với bracket corners + scanline |
| `NumberedListCard.tsx` | CREATE | Numbered list + glassmorphism card |
| `TemplateLayout.tsx` | MODIFY | Thêm case `fintech_edu` layout routing |
| `MainComposition.tsx` | MODIFY | Đăng ký theme mới |
| `fonts.ts` | VERIFY/MODIFY | Verify Chakra Petch đã có, thêm nếu thiếu |

---

## Animation Spec

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Circuit glow orbs | opacity pulse 0.3→0.6 | 3s loop | ease-in-out |
| Card items | slide-up + fade-in stagger | 0.4s + 0.1s delay | easeOut |
| Bracket corners | stroke-dashoffset draw | 0.6s | easeInOut |
| Metrics numbers | count-up interpolate 0→value | 1.2s | easeOut |
| CTA button | shimmer sweep overlay | 1.8s loop | linear |
| Hero title | scale 0.92→1 + opacity | 0.5s | spring |

---

## Files Affected

| File | Action |
|---|---|
| `my-video/src/styles/vde_themes.json` | ADD fintech_edu entry |
| `my-video/src/styles/vdeTokens.ts` | ADD override case |
| `my-video/src/components/CircuitBoardBg.tsx` | CREATE |
| `my-video/src/components/MetricsDashboardCard.tsx` | CREATE |
| `my-video/src/components/BracketBadge.tsx` | CREATE |
| `my-video/src/components/NumberedListCard.tsx` | CREATE |
| `my-video/src/compositions/layouts/TemplateLayout.tsx` | MODIFY |
| `my-video/src/compositions/MainComposition.tsx` | MODIFY |
| `my-video/src/styles/fonts.ts` | VERIFY / MODIFY |

---

## Verification Plan

1. Mở Remotion Studio (npm run dev trong my-video/)
2. Chọn theme `fintech_edu` trong composition
3. Verify visual: background layers, circuit pattern, glow effects
4. Verify animation: circuit pulse, card stagger, metric count-up
5. Verify typography: Chakra Petch load đúng
6. Test với Vietnamese text content
