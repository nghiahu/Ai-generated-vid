# Atomic Video Component System Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build an atomic component system (CategoryPill, HeadlineText, AccentDivider, NumberedCard, GlassBubble) and upgrade the HTML parser to extract exact rgba colors from source HTML — ensuring every layout renders faithfully with the correct colors from the design source.

**Architecture:** Parser extracts actual rgba() values from CSS (border, background, box-shadow) of each card in the HTML source and stores them in a new v2 JSON schema. Atomic React components read these rgba values directly and render without any hardcoded color logic. TemplateLayout is refactored to assemble atoms, reducing from 743 lines to ~280.

**Tech Stack:** Python (parse_yupvid_html.py), TypeScript/React (VideoAtoms.tsx, TemplateLayout.tsx), Remotion, JSON templates

---

## Task 1: Add Color Extraction to Parser

**Files:**
- Modify: `scratch/parse_yupvid_html.py`

**Step 1: Add extract_rgba_from_css() function**

Add this function after the existing `is_accent_color()` function (around line 64):

```python
def extract_rgba_from_css(css_val: str):
    """Extract first rgba?() color value from a CSS property string. Returns None if not found."""
    if not css_val:
        return None
    m = re.search(r'rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)', css_val)
    return m.group(0) if m else None

def extract_blur_px(backdrop_filter: str) -> str:
    """Extract blur amount from backdrop-filter CSS string."""
    m = re.search(r'blur\(([\d.]+px)\)', backdrop_filter)
    return m.group(1) if m else "12px"

def extract_badge_color_from_children(card_node, raw_nodes):
    """Find first child div with an explicit non-white color — that is the badge color."""
    white_variants = {"255, 255, 255", "248, 250, 252", "249, 247, 255"}
    for child_id in card_node.get("children_ids", []):
        child = raw_nodes[child_id]
        color = child["style"].get("color", "")
        if not color:
            continue
        # Reject white/near-white
        is_white = any(w in color for w in white_variants)
        if not is_white:
            return color
        # Recurse into grandchildren
        for gc_id in child.get("children_ids", []):
            gc = raw_nodes[gc_id]
            gc_color = gc["style"].get("color", "")
            if gc_color and not any(w in gc_color for w in white_variants):
                return gc_color
    return None
```

**Step 2: Replace item style extraction block (lines 285-308)**

Replace the old block that produces `useAccentBg`/`useThemeBorder` flags with the new v2 extraction:

```python
        # Stylings — v2: extract actual rgba colors
        border_css = css.get("border", "")
        background_css = css.get("background", "") or css.get("background-color", "")
        box_shadow_css = css.get("box-shadow", "")
        backdrop_css = css.get("backdrop-filter", "")
        
        bg_rgba = extract_rgba_from_css(background_css)
        border_rgba = extract_rgba_from_css(border_css)
        badge_rgba = extract_badge_color_from_children(card, parser.raw_nodes)
        
        # Extract glow shadow (second rgba in box-shadow, usually the glow)
        all_shadows = re.findall(r'rgba?\([\d\s,.]+\)', box_shadow_css)
        shadow_glow_rgba = all_shadows[1] if len(all_shadows) > 1 else (all_shadows[0] if all_shadows else None)
        
        # Also preserve old flags for backward compat
        use_accent = is_accent_color(border_css) or is_accent_color(background_css)
        
        style_def = {
            "v2": True,
            "fontSize": css.get("font-size", "28px"),
            "fontWeight": css.get("font-weight", "800"),
            "borderRadius": css.get("border-radius", "30px"),
            "padding": css.get("padding", "24px"),
            "scale": scale,
            "bgRgba": bg_rgba,
            "borderRgba": border_rgba,
            "badgeRgba": badge_rgba,
            "shadowGlowRgba": shadow_glow_rgba,
            "backdropBlur": extract_blur_px(backdrop_css),
            # Backward compat flags
            "useAccentBg": use_accent,
            "useAccentBorder": use_accent,
            "useSubtleThemeBg": not use_accent,
            "useThemeBorder": not use_accent,
        }
        item_styles.append(style_def)
```

**Step 3: Add CategoryPill extraction (after title extraction, around line 238)**

```python
    # 5b. Extract CategoryPill (small pill badge near/above title)
    category_pill = None
    for node in parser.raw_nodes:
        if node["tag"] != "div":
            continue
        node_style = node["style"]
        br = node_style.get("border-radius", "")
        text_content = " ".join(node["content"]).strip()
        # Must be a pill (999px), must have text, must NOT be the title
        if "999px" not in br or not text_content:
            continue
        if title_node and text_content == " ".join(title_node["content"]).strip():
            continue
        if len(text_content) > 60:  # Skip if too long (likely not a badge)
            continue
        category_pill = {
            "text": text_content,
            "bgRgba": extract_rgba_from_css(node_style.get("background", "")),
            "borderRgba": extract_rgba_from_css(node_style.get("border", "")),
            "textRgba": node_style.get("color", "rgb(239, 68, 68)")
        }
        break
```

**Step 4: Add AccentDivider extraction (after subtitle extraction)**

```python
    # 5c. Extract AccentDivider (short gradient horizontal bar)
    accent_divider = None
    for node in parser.raw_nodes:
        if node["tag"] != "div":
            continue
        ns = node["style"]
        h = ns.get("height", "")
        br = ns.get("border-radius", "")
        bg = ns.get("background", "")
        # Must be short height, rounded, gradient
        try:
            h_val = float(h.replace("px", ""))
        except:
            h_val = 999
        if h_val <= 10 and "999px" in br and "gradient" in bg:
            glow_shadows = re.findall(r'rgba?\([\d\s,.]+\)', ns.get("box-shadow", ""))
            accent_divider = {
                "width": ns.get("width", "220px"),
                "height": h,
                "gradient": bg,
                "glowRgba": glow_shadows[0] if glow_shadows else None
            }
            break
```

**Step 5: Add new fields to layout_data output (around line 322)**

```python
    layout_data = {
        "id": layout_id,
        "name": layout_name,
        "family": family,
        "layoutMode": layout_mode,
        "container": { ... },
        "categoryPill": category_pill,      # NEW
        "accentDivider": accent_divider,    # NEW
        "title": title_config,
        "positions": positions,
        "items": {
            "rotations": rotations,
            "itemStyles": item_styles
        },
        "subtitle": subtitle_config
    }
```

**Step 6: Verify by running parser on Intro Full Image**

```bash
python scratch/parse_yupvid_html.py "layoutElement/Opening-Headline/Intro Full Image.html"
```

Expected output in generated JSON — items should have:
```json
{ "v2": true, "bgRgba": "rgba(2, 6, 23, 0.48)", "borderRgba": "rgba(239, 68, 68, 0.267)", "badgeRgba": "rgb(239, 68, 68)" }
{ "v2": true, "bgRgba": "rgba(2, 6, 23, 0.48)", "borderRgba": "rgba(253, 230, 138, 0.267)", "badgeRgba": "rgb(253, 230, 138)" }
{ "v2": true, "bgRgba": "rgba(255, 200, 87, 0.133)", "borderRgba": "rgba(255, 200, 87, 0.533)", "badgeRgba": "rgb(255, 200, 87)" }
```

**Step 7: Commit**

```bash
git add scratch/parse_yupvid_html.py
git commit -m "feat(parser): extract rgba colors, categoryPill, accentDivider into v2 JSON schema"
```

---

## Task 2: Create VideoAtoms.tsx

**Files:**
- Create: `my-video/src/components/atoms/VideoAtoms.tsx`

**Step 1: Create the file with CategoryPill atom**

```tsx
import React from "react";
import { useCurrentFrame } from "remotion";

// ── CategoryPill ─────────────────────────────────────────────────────────────
export interface CategoryPillProps {
  text: string;
  bgRgba: string;
  borderRgba: string;
  textRgba: string;
  hasDot?: boolean;
  dotRgba?: string;
  fontSize?: string;
  fontFamily?: string;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({
  text, bgRgba, borderRgba, textRgba, hasDot, dotRgba, fontSize = "17px", fontFamily
}) => (
  <div style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    borderRadius: "999px",
    padding: "10px 16px",
    background: bgRgba,
    border: `1px solid ${borderRgba}`,
    color: textRgba,
    fontSize,
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    backdropFilter: "blur(12px)",
    fontFamily,
    width: "fit-content"
  }}>
    {hasDot && (
      <span style={{
        width: "10px",
        height: "10px",
        borderRadius: "999px",
        background: dotRgba || textRgba,
        boxShadow: `${dotRgba || textRgba} 0px 0px 18px`,
        flexShrink: 0
      }} />
    )}
    {text}
  </div>
);
```

**Step 2: Add HeadlineText atom**

```tsx
// ── HeadlineText ─────────────────────────────────────────────────────────────
export interface HeadlineTextProps {
  text: string;
  fontSize?: string;
  fontWeight?: string;
  letterSpacing?: string;
  textShadow?: string;
  colorRgba?: string;
  maxWidth?: string;
  align?: "left" | "center" | "right";
  fontFamily?: string;
  textTransform?: "uppercase" | "none";
  lineHeight?: number;
}

export const HeadlineText: React.FC<HeadlineTextProps> = ({
  text, fontSize = "86px", fontWeight = "900", letterSpacing = "-0.075em",
  textShadow, colorRgba = "rgb(255, 255, 255)", maxWidth, align = "center",
  fontFamily, textTransform = "uppercase", lineHeight = 1.05
}) => (
  <h1 style={{
    fontSize, fontWeight, letterSpacing, lineHeight,
    color: colorRgba,
    textShadow,
    maxWidth,
    textAlign: align,
    fontFamily,
    textTransform,
    margin: 0,
    width: "100%"
  }}>
    {text}
  </h1>
);
```

**Step 3: Add AccentDivider atom**

```tsx
// ── AccentDivider ─────────────────────────────────────────────────────────────
export interface AccentDividerProps {
  gradient: string;
  width?: string;
  height?: string;
  glowRgba?: string;
}

export const AccentDivider: React.FC<AccentDividerProps> = ({
  gradient, width = "220px", height = "6px", glowRgba
}) => (
  <div style={{
    width,
    height,
    borderRadius: "999px",
    background: gradient,
    boxShadow: glowRgba ? `${glowRgba} 0px 0px 28px` : undefined
  }} />
);
```

**Step 4: Add NumberedCard atom**

```tsx
// ── NumberedCard ─────────────────────────────────────────────────────────────
export interface NumberedCardProps {
  index: number;
  text: string;
  bgRgba: string;
  borderRgba: string;
  badgeRgba: string;
  shadowGlowRgba?: string;
  borderRadius?: string;
  padding?: string;
  backdropBlur?: string;
  scale?: number;
  minHeight?: string;
  fontFamily?: string;
}

export const NumberedCard: React.FC<NumberedCardProps> = ({
  index, text, bgRgba, borderRgba, badgeRgba, shadowGlowRgba,
  borderRadius = "18px", padding = "14px 16px", backdropBlur = "12px",
  scale = 1, minHeight = "86px", fontFamily
}) => {
  const shadowPrimary = shadowGlowRgba
    ? `rgba(0, 0, 0, 0.18) 0px 14px 34px, ${shadowGlowRgba} 0px 0px 18px`
    : "rgba(0, 0, 0, 0.18) 0px 14px 34px";

  return (
    <div style={{
      borderRadius,
      padding,
      background: bgRgba,
      border: `1px solid ${borderRgba}`,
      boxShadow: shadowPrimary,
      backdropFilter: `blur(${backdropBlur})`,
      transform: `scale(${scale})`,
      transformOrigin: "center center",
      minHeight,
      display: "grid",
      alignContent: "center",
      gap: "8px",
      boxSizing: "border-box" as const
    }}>
      <div style={{
        color: badgeRgba,
        fontSize: "11px",
        lineHeight: 1,
        fontWeight: 900,
        letterSpacing: "0.16em",
        textTransform: "uppercase" as const,
        fontFamily
      }}>
        {String(index).padStart(2, "0")}
      </div>
      <div style={{
        fontSize: "25px",
        lineHeight: 1.04,
        fontWeight: 900,
        letterSpacing: "-0.035em",
        textTransform: "uppercase" as const,
        color: "rgb(255, 255, 255)",
        fontFamily
      }}>
        {text}
      </div>
    </div>
  );
};
```

**Step 5: Add GlassBubble atom**

```tsx
// ── GlassBubble ──────────────────────────────────────────────────────────────
export interface GlassBubbleProps {
  text: string;
  size: string;
  position: { top: string; left: string };
  borderRgba: string;
  shadowRgba?: string;
  fontSize?: string;
  fontWeight?: string;
  bgGradient?: string;
  floatAmplitude?: number;
  fontFamily?: string;
}

export const GlassBubble: React.FC<GlassBubbleProps> = ({
  text, size, position, borderRgba, shadowRgba, fontSize = "38px",
  fontWeight = "860", bgGradient, floatAmplitude = 8, fontFamily
}) => {
  const frame = useCurrentFrame();
  const floatY = Math.sin(frame / 40) * floatAmplitude;

  const defaultBg = `radial-gradient(circle at 28% 22%, rgba(254, 238, 173, 0.48), transparent 32%), linear-gradient(145deg, rgba(6, 16, 31, 0.92), rgba(82, 78, 60, 0.847) 58%, rgba(2, 6, 23, 0.78))`;

  return (
    <div style={{
      position: "absolute",
      top: position.top,
      left: position.left,
      width: size,
      height: size,
      borderRadius: "999px",
      background: bgGradient || defaultBg,
      border: `1px solid ${borderRgba}`,
      boxShadow: shadowRgba
        ? `rgba(0, 0, 0, 0.54) 0px 34px 82px, ${shadowRgba} 0px 0px 44px, rgba(255, 255, 255, 0.16) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.18) 0px -24px 54px inset`
        : "rgba(0, 0, 0, 0.32) 0px 18px 42px",
      backdropFilter: "blur(16px)",
      display: "grid",
      placeItems: "center",
      textAlign: "center",
      fontSize,
      lineHeight: 1.02,
      fontWeight,
      color: "rgb(248, 250, 252)",
      textTransform: "uppercase",
      fontFamily,
      transform: `translateY(${floatY}px)`,
      padding: "22px 20px",
      boxSizing: "border-box"
    }}>
      {text}
    </div>
  );
};
```

**Step 6: Verify file compiles**

```bash
cd my-video && npx tsc --noEmit
```

Expected: 0 errors.

**Step 7: Commit**

```bash
git add my-video/src/components/atoms/VideoAtoms.tsx
git commit -m "feat(atoms): add CategoryPill, HeadlineText, AccentDivider, NumberedCard, GlassBubble"
```

---

## Task 3: Refactor TemplateLayout to Use Atoms

**Files:**
- Modify: `my-video/src/compositions/layouts/TemplateLayout.tsx`

**Step 1: Add import at top of TemplateLayout.tsx**

```tsx
import { CategoryPill, HeadlineText, AccentDivider, NumberedCard, GlassBubble } from "../../components/atoms/VideoAtoms";
```

**Step 2: Add helper to resolve item colors with fallback**

After the `darkAccentColor` calculation block, add:

```tsx
  // v2 color resolution — use extracted rgba if available, fallback to theme-derived colors
  const resolveItemColors = (item: any) => {
    if (item?.v2) {
      return {
        bgRgba: item.bgRgba || styles.cardStyle.backgroundColor || `rgba(2, 6, 23, 0.48)`,
        borderRgba: item.borderRgba || `rgba(${rgb}, 0.22)`,
        badgeRgba: item.badgeRgba || accentColor,
        shadowGlowRgba: item.shadowGlowRgba || null,
        backdropBlur: item.backdropBlur || "12px"
      };
    }
    // Fallback for old v1 JSONs
    const isAccent = item?.useAccentBg;
    return {
      bgRgba: isAccent ? accentColor : (styles.cardStyle.backgroundColor || `rgba(2, 6, 23, 0.48)`),
      borderRgba: isAccent ? "transparent" : `rgba(${rgb}, 0.22)`,
      badgeRgba: accentColor,
      shadowGlowRgba: null,
      backdropBlur: "12px"
    };
  };
```

**Step 3: Replace horizontal_list mode (Mode 2.5)**

Replace the entire `horizontal_list` block with atom-based version:

```tsx
    if (layoutMode === "horizontal_list") {
      const visibleComps = otherComps.slice(0, 3);
      return (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${visibleComps.length}, minmax(0, 1fr))`,
          gap: t.container.gap || "14px",
          width: "100%",
          maxWidth: t.container.maxWidth || "820px",
          zIndex: 5
        }}>
          {visibleComps.map((comp, idx) => {
            const item = t.items.itemStyles[idx % t.items.itemStyles.length] || {};
            const colors = resolveItemColors(item);
            return (
              <NumberedCard
                key={comp.id || idx}
                index={idx + 1}
                text={comp.data.text}
                bgRgba={colors.bgRgba}
                borderRgba={colors.borderRgba}
                badgeRgba={colors.badgeRgba}
                shadowGlowRgba={colors.shadowGlowRgba}
                borderRadius={item.borderRadius}
                padding={item.padding}
                scale={item.scale}
                backdropBlur={colors.backdropBlur}
                fontFamily={styles.fontFamily}
              />
            );
          })}
        </div>
      );
    }
```

**Step 4: Replace title + divider render block in main return**

Replace the existing `{titleComp && (...)}` block with:

```tsx
      {titleComp && (
        <>
          {isBottomAligned && t.categoryPill && (
            <div style={{ marginBottom: "16px", zIndex: 10 }}>
              <CategoryPill
                text={t.categoryPill.text}
                bgRgba={t.categoryPill.bgRgba || `rgba(2, 6, 23, 0.72)`}
                borderRgba={t.categoryPill.borderRgba || `rgba(${rgb}, 0.4)`}
                textRgba={t.categoryPill.textRgba || accentColor}
                fontFamily={styles.fontFamily}
              />
            </div>
          )}
          <HeadlineText
            text={titleComp.data.text}
            fontSize={t.title.fontSize}
            fontWeight={t.title.fontWeight}
            letterSpacing={t.title.letterSpacing}
            textShadow={t.title.textShadow || (t.title.useAccentTextShadow ? `rgba(0,0,0,0.58) 0px 22px 54px` : undefined)}
            align={isBottomAligned ? "left" : "center"}
            fontFamily={styles.fontFamily}
            maxWidth={isBottomAligned ? "760px" : undefined}
          />
          {isBottomAligned && t.accentDivider && (
            <div style={{ marginTop: "12px", marginBottom: "28px", zIndex: 10 }}>
              <AccentDivider
                gradient={t.accentDivider.gradient}
                width={t.accentDivider.width}
                height={t.accentDivider.height}
                glowRgba={t.accentDivider.glowRgba}
              />
            </div>
          )}
        </>
      )}
```

**Step 5: Verify TypeScript compiles**

```bash
cd my-video && npx tsc --noEmit
```

Expected: 0 errors.

**Step 6: Commit**

```bash
git add my-video/src/compositions/layouts/TemplateLayout.tsx
git commit -m "refactor(layout): use atomic components for horizontal_list and title area"
```

---

## Task 4: Recompile All 180 Layouts

**Files:**
- Regenerate: `my-video/src/compositions/layouts/templates/**/*.json`

**Step 1: Run batch parser**

```bash
python scratch/parse_yupvid_html.py layoutElement
```

Expected output:
```
Batch compilation finished.
Successfully compiled: 180 layouts.
Failed/Skipped: 0 layouts.
```

**Step 2: Spot-check 3 key layouts**

Check `templates/Opening-Headline/intro_full_image.json`:
- `items.itemStyles[0].bgRgba` == `"rgba(2, 6, 23, 0.48)"`
- `items.itemStyles[0].badgeRgba` == `"rgb(239, 68, 68)"`
- `items.itemStyles[1].badgeRgba` == `"rgb(253, 230, 138)"`
- `items.itemStyles[2].bgRgba` == `"rgba(255, 200, 87, 0.133)"`
- `categoryPill.text` == `"AI VIẾT VIDEO"`
- `accentDivider.gradient` contains `"linear-gradient"`

**Step 3: Build Remotion bundle**

```bash
cd my-video && npm run build
```

Expected: bundle completes successfully.

**Step 4: Commit**

```bash
git add my-video/src/compositions/layouts/templates/
git commit -m "chore(templates): recompile all 180 layouts with v2 rgba color schema"
```

---

## Task 5: Refactor Remaining Layout Modes to Use NumberedCard

**Files:**
- Modify: `my-video/src/compositions/layouts/TemplateLayout.tsx`

**Step 1: Refactor vertical_list mode**

Replace the existing `vertical_list` row style block (around line 300-377) with NumberedCard:

```tsx
    if (layoutMode === "vertical_list") {
      const visibleComps = otherComps.slice(0, 4);
      return (
        <div style={{
          width: "100%",
          maxWidth: t.container.maxWidth || "860px",
          display: "grid",
          gap: t.container.gap || "12px",
          zIndex: 5
        }}>
          {visibleComps.map((comp, idx) => {
            const item = t.items.itemStyles[idx % t.items.itemStyles.length] || {};
            const colors = resolveItemColors(item);
            return (
              <NumberedCard
                key={comp.id || idx}
                index={idx + 1}
                text={comp.data.text}
                bgRgba={colors.bgRgba}
                borderRgba={colors.borderRgba}
                badgeRgba={colors.badgeRgba}
                shadowGlowRgba={colors.shadowGlowRgba}
                borderRadius={item.borderRadius || "18px"}
                padding={item.padding || "18px"}
                scale={item.scale}
                minHeight="100px"
                fontFamily={styles.fontFamily}
              />
            );
          })}
        </div>
      );
    }
```

**Step 2: Verify TypeScript compiles**

```bash
cd my-video && npx tsc --noEmit
```

**Step 3: Build bundle**

```bash
cd my-video && npm run build
```

**Step 4: Commit**

```bash
git add my-video/src/compositions/layouts/TemplateLayout.tsx
git commit -m "refactor(layout): use NumberedCard in vertical_list mode"
```

---

## Task 6: Verify Visual Correctness

**Step 1: Start dev servers (if not running)**

```bash
cd backend && npm run dev   # terminal 1
cd frontend && npm run dev  # terminal 2
```

**Step 2: Open Storyboard Editor and test Intro Full Image**

Navigate to the frontend app. Create or load a storyboard that uses `IntroFullImage` layout. Verify:

- [ ] Card 01 "AI viết video" — dark navy bg, red badge, red border
- [ ] Card 02 "Từ code" — dark navy bg, yellow badge, yellow border
- [ ] Card 03 "Ra video" — translucent gold bg, gold badge, gold border
- [ ] CategoryPill "AI VIẾT VIDEO" displays above title with red text
- [ ] Gradient divider bar appears below title

**Step 3: Test Intro Bubble Image**

Verify:
- [ ] Large center bubble has dark bg with gold border
- [ ] Small bubble top-left has subtle glass bg with yellow border
- [ ] Small bubble bottom-right has subtle glass bg with red border
- [ ] All 3 bubbles float with sine wave animation

**Step 4: Run backend tests**

```bash
node backend/test_vde.js
```

Expected: `=== ALL TESTS PASSED SUCCESSFULLY ===`

---

## Task 7: Cleanup Old Inline Code

**Files:**
- Modify: `my-video/src/compositions/layouts/TemplateLayout.tsx`

**Step 1: Remove old unused helper variables**

After the refactor, the following variables in the top of `TemplateLayout.tsx` may no longer be used in refactored modes:
- `activeCardTextColor`, `inactiveCardTextColor`, `activeCardBadgeColor`, `activeCardDescColor`

Check usage with:
```bash
grep -n "activeCardTextColor\|inactiveCardTextColor\|activeCardBadgeColor" my-video/src/compositions/layouts/TemplateLayout.tsx
```

Remove any that have 0 remaining usages.

**Step 2: Run final TypeScript check**

```bash
cd my-video && npx tsc --noEmit
```

Expected: 0 errors.

**Step 3: Final build**

```bash
cd my-video && npm run build
```

**Step 4: Final commit**

```bash
git add my-video/src/compositions/layouts/TemplateLayout.tsx
git commit -m "chore(layout): remove unused inline style variables after atom refactor"
```

---

## Verification Checklist

- [ ] `intro_full_image.json` has correct rgba colors per card
- [ ] Intro Full Image renders 3 unique-colored cards
- [ ] Intro Bubble Image renders floating 3D glass spheres
- [ ] All 180 layouts compiled with 0 parser errors
- [ ] `npm run build` passes 0 TypeScript errors
- [ ] `node backend/test_vde.js` passes all 6 tests
- [ ] TemplateLayout.tsx line count reduced below 450 lines
