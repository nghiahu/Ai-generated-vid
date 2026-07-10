# Atomic Video Component System — Design Doc
**Date:** 2026-07-09
**Status:** Approved

## Problem

The current layout rendering pipeline loses color fidelity at the Parser step:

```
HTML source (exact colors)
  -> Parser [LOSES color info — only saves true/false flags]
  -> JSON template [only: useAccentBg, useThemeBorder]
  -> TemplateLayout [guesses color from theme, NOT from source design]
  -> Result: all cards same color / wrong colors
```

Additionally, TemplateLayout.tsx (743 lines) embeds all styling logic inline.

## Approved Solution: Atomic Level + Color Extraction (Approach 1A)

### Architecture

```
HTML source (exact colors)
  -> Parser UPGRADED (extracts rgba() from border/bg/shadow CSS)
  -> JSON template v2 (stores borderRgba, bgRgba, badgeRgba per item)
  -> Atomic Components: CategoryPill, HeadlineText, AccentDivider, NumberedCard, GlassBubble
  -> TemplateLayout (slim, assembles atoms, no inline styling)
  -> Result: 100% faithful to source design
```

## Section 1 — Parser Upgrade

New function extract_rgba_from_css(css_val) replaces is_accent_color().

New item style JSON schema (v2):
```json
{
  "v2": true,
  "borderRadius": "18px",
  "padding": "14px 16px",
  "scale": 1.012,
  "bgRgba": "rgba(2, 6, 23, 0.48)",
  "borderRgba": "rgba(239, 68, 68, 0.267)",
  "shadowGlowRgba": "rgba(239, 68, 68, 0.063)",
  "badgeRgba": "rgb(239, 68, 68)",
  "backdropBlur": "12px"
}
```

Also extracts: categoryPill (pill badge above title), accentDivider (gradient bar).

## Section 2 — 5 Atomic Components (src/components/atoms/VideoAtoms.tsx)

1. CategoryPill — pill badge with optional glow dot
2. HeadlineText — h1 with raw textShadow from HTML
3. AccentDivider — gradient bar, raw gradient CSS from HTML
4. NumberedCard — glassmorphism card with numbered badge, all colors from extracted rgba
5. GlassBubble — 3D floating sphere with float animation

## Section 3 — TemplateLayout Refactor

- Before: ~60 lines inline style per layout mode
- After: ~8 lines using atom components
- Result: 743 lines -> ~280 lines

## Section 4 — Migration Strategy (Zero Breakage)

1. Create VideoAtoms.tsx (no changes to existing code)
2. Upgrade parser (adds new fields, keeps old flags)
3. TemplateLayout reads item.v2 flag — if present uses rgba atoms, else fallback
4. Recompile all 180 layouts
5. Verify visually
6. Remove old inline style blocks

## Success Criteria

- Intro Full Image renders 3 cards with correct individual colors (red/yellow/gold)
- Intro Bubble Image renders 3 glass spheres with correct border colors
- All 180 layouts recompile without parser errors
- TemplateLayout.tsx < 350 lines
- npm run build passes with 0 TypeScript errors
