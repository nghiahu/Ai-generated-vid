# NumberedAgentPanel — Design Document

**Date:** 2026-08-06
**Status:** Approved

## Overview

Layout dành cho các scene liệt kê **2–4 bước/agent/giai đoạn theo thứ tự có đánh số**. Mỗi item có title bold và subtitle mô tả ngắn. Có bottom insight bar dạng italic + highlight word ở cuối.

## Visual Structure

```
[ • CATEGORY PILL ]

Heading lớn bold (~80px, 2 dòng)

┌──────────────────────────────────────────┐
│ ① │ Security Architect                   │
│   │ soi lại thiết kế bản vá              │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│ ② │ Penetration Tester                   │
│   │ thử phá chính bản vá đó              │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│ ③ │ Cross-Repo Analyzer                  │
│   │ bắt khi fix trái ≥ 2 repo            │
└──────────────────────────────────────────┘

💡 4 cổng chấm điểm — đủ ngưỡng mới ghi là **đã sửa**.
```

## Components

| Component | Spec |
|---|---|
| Category pill | Từ `category` field, icon `•` |
| Heading | Bold ~80px, letterSpacing -0.04em, max 2 dòng |
| Number badge | ①②③④ ký tự Unicode, vòng tròn accent màu, ~48–56px |
| Card | Row ngang: badge trái + (title + subtitle) phải |
| Card title | Bold 26–30px, lấy từ `points[i].text` |
| Card subtitle | Mờ 16–18px, lấy từ `points[i].subtext` |
| Card bg | Item 1: accent glassmorphic; còn lại: theme subtle border |
| Bottom bar | Icon 💡 + text italic; word **bold** nếu `highlightWords` có |

## Data Mapping

```
points[i].text     → card title
points[i].subtext  → card subtitle  
voiceover          → bottom insight bar (nếu ngắn < 80 chars)
category           → category pill
highlightWords[0]  → từ được bold trong bottom bar
```

## Animation

- Cards slide-up với stagger delay: 0, 6, 12, 18 frames
- Bottom bar fade-in sau card cuối (delay ~24 frames)
- Scale intro: 0.9 → 1.0 trong 30 frames

## Integration Points

- **Template JSON**: `List-Step/numbered_agent_panel.json` (layoutMode: `numbered_agent_panel`)
- **Mode component**: `NumberedAgentPanelMode.tsx`
- **Router**: `TemplateLayout.tsx` case `"numbered_agent_panel"`
- **Registry exclusion**: thêm vào skip-title list trong TemplateLayout
- **Contract**: `contractLoader.js` — `allowedPointTypes: ['card']`, `pointsCount: {min:2, max:4, default:3}`
- **Dropdown**: `StoryboardEditor.jsx` nhóm "List / Step"
- **AI hint**: `"Layout liệt kê bước/agent có số thứ tự. Mỗi point dùng type 'card', field text là tên ngắn (≤5 từ), subtext là mô tả hành động ngắn (≤8 từ)."`

## Layout ID

`NumberedAgentPanel` / layoutMode: `numbered_agent_panel`
