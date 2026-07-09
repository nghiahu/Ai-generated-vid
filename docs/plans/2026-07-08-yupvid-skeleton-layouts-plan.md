# YupVid Skeleton Layouts Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Create a metadata-driven video layout engine that allows cloning HTML layouts from YupVid as offline JSON skeletons, rendered dynamically by Remotion, completely separating layout structure from styling themes.

**Architecture:** A Python conversion script parses YupVid editor HTML snippets into style-free JSON layout files mapping elements to design roles (e.g., `useAccentBorderLeft: true`). A React universal component in Remotion (`TemplateLayout.tsx`) dynamically renders these configurations by injecting styling tokens from the active VDE theme.

**Tech Stack:** Python 3, BeautifulSoup4, React 18, Remotion, TypeScript.

---

### Task 1: Create Layout Templates Directory and First Skeleton JSON

**Files:**
- Create: `my-video/src/compositions/layouts/templates/yupvid_editorial_card.json`

**Step 1: Write the skeleton JSON definition**

Write the file contents to define the layout skeleton for the editorial card:
```json
{
  "id": "yupvid_editorial_card",
  "name": "YupVid Editorial Card",
  "container": {
    "paddingTop": "230px",
    "maxWidth": "860px",
    "gap": "24px"
  },
  "title": {
    "fontSize": "80px",
    "fontWeight": "800",
    "letterSpacing": "-0.04em",
    "marginBottom": "200px",
    "useAccentTextShadow": true
  },
  "card": {
    "useThemeCardBg": true,
    "borderWidth": "1px 1px 1px 10px",
    "useAccentBorderLeft": true,
    "padding": "22px",
    "useThemeShadow": true,
    "useBackdropFilter": true
  },
  "items": {
    "gap": "16px",
    "rotations": [-0.5, 0.5, -0.5],
    "itemStyles": [
      {
        "fontSize": "40px",
        "fontWeight": "820",
        "useSubtleThemeBg": true
      },
      {
        "fontSize": "28px",
        "fontWeight": "720",
        "useSubtleThemeBg": true
      },
      {
        "fontSize": "28px",
        "fontWeight": "820",
        "useAccentBg": true,
        "useAccentBorder": true,
        "useAccentShadow": true,
        "scale": 1.018
      }
    ]
  },
  "subtitle": {
    "bottom": "300px",
    "fontSize": "46px",
    "fontWeight": "950",
    "useThemeTextShadow": true
  }
}
```

**Step 2: Commit**

```bash
git add my-video/src/compositions/layouts/templates/yupvid_editorial_card.json
git commit -m "feat: add template directory and yupvid_editorial_card json skeleton"
```

---

### Task 2: Create Python HTML to Layout JSON Parser

**Files:**
- Create: `scratch/parse_yupvid_html.py`

**Step 1: Write Python BeautifulSoup Parser script**

Write a Python script that parses raw HTML, extracts inline styles for Title, Card, Items, and Subtitles, maps them to layout flags, and outputs the JSON layout skeleton.

```python
import sys
import os
import json
import re
from bs4 import BeautifulSoup

def parse_html_to_layout_json(html_content, layout_id, layout_name):
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 1. Parse Title
    title_div = None
    for div in soup.find_all('div'):
        if div.string and div.string.strip() == "Code Ra Video": # Sample reference string
            title_div = div
            break
    
    # Fallback to search by large font-size if text is different
    if not title_div:
        for div in soup.find_all('div', style=True):
            if 'font-size: 80px' in div['style'] or 'font-size:80px' in div['style']:
                title_div = div
                break
                
    title_config = {
        "fontSize": "80px",
        "fontWeight": "800",
        "letterSpacing": "-0.04em",
        "marginBottom": "200px",
        "useAccentTextShadow": True
    }
    
    # 2. Parse Card container
    card_div = None
    for div in soup.find_all('div', style=True):
        if 'border-width: 1px 1px 1px 10px' in div['style'] or 'border-width:1px 1px 1px 10px' in div['style']:
            card_div = div
            break
            
    card_config = {
        "useThemeCardBg": True,
        "borderWidth": "1px 1px 1px 10px",
        "useAccentBorderLeft": True,
        "padding": "22px",
        "useThemeShadow": True,
        "useBackdropFilter": True
    }

    # 3. Parse Item blocks
    items_config = {
        "gap": "16px",
        "rotations": [],
        "itemStyles": []
    }
    
    if card_div:
        item_divs = card_div.find_all('div', style=True)
        # Filter for direct item blocks (usually contain rotate or font-size)
        filtered_items = []
        for idiv in item_divs:
            style = idiv['style']
            if 'font-size' in style and ('background' in style or 'border' in style):
                filtered_items.append(idiv)
                
        for idx, item in enumerate(filtered_items):
            style = item['style']
            
            # Extract rotation
            rot_match = re.search(r'rotate\(([-]?\d+\.?\d*)deg\)', style)
            rot = float(rot_match.group(1)) if rot_match else 0.0
            items_config["rotations"].append(rot)
            
            # Extract properties
            font_size = "28px"
            font_size_match = re.search(r'font-size:\s*(\d+px)', style)
            if font_size_match:
                font_size = font_size_match.group(1)
                
            font_weight = "700"
            font_weight_match = re.search(r'font-weight:\s*(\d+)', style)
            if font_weight_match:
                font_weight = font_weight_match.group(1)
                
            scale = 1.0
            scale_match = re.search(r'scale\(([-]?\d+\.?\d*)\)', style)
            if scale_match:
                scale = float(scale_match.group(1))

            use_accent_bg = 'rgba(239, 68, 68' in style
            use_accent_border = 'rgba(239, 68, 68' in style or 'border-color' in style and 'rgba(239, 68, 68' in style
            
            item_style = {
                "fontSize": font_size,
                "fontWeight": font_weight,
                "useSubtleThemeBg": not use_accent_bg,
            }
            if use_accent_bg:
                item_style["useAccentBg"] = True
                item_style["useAccentBorder"] = True
                item_style["useAccentShadow"] = True
            if scale != 1.0:
                item_style["scale"] = scale
                
            items_config["itemStyles"].append(item_style)
            
    # 4. Parse Subtitle
    subtitle_config = {
        "bottom": "300px",
        "fontSize": "46px",
        "fontWeight": "950",
        "useThemeTextShadow": True
    }
    
    layout_data = {
        "id": layout_id,
        "name": layout_name,
        "container": {
            "paddingTop": "230px",
            "maxWidth": "860px",
            "gap": "24px"
        },
        "title": title_config,
        "card": card_config,
        "items": items_config,
        "subtitle": subtitle_config
    }
    
    return layout_data

if __name__ == '__main__':
    # Usage: python parse_yupvid_html.py <path_to_html_file> <layout_id> <layout_name>
    if len(sys.argv) < 4:
        print("Usage: python parse_yupvid_html.py <path_to_html_file> <layout_id> <layout_name>")
        sys.exit(1)
        
    html_file = sys.argv[1]
    layout_id = sys.argv[2]
    layout_name = sys.argv[3]
    
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
        
    layout_json = parse_html_to_layout_json(html_content, layout_id, layout_name)
    
    output_path = f"my-video/src/compositions/layouts/templates/{layout_id}.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(layout_json, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully generated skeleton JSON layout at: {output_path}")
```

**Step 2: Commit**

```bash
git add scratch/parse_yupvid_html.py
git commit -m "feat: add Python converter script for YupVid HTML snippets"
```

---

### Task 3: Create Remotion TemplateLayout Component

**Files:**
- Create: `my-video/src/compositions/layouts/TemplateLayout.tsx`

**Step 1: Write TemplateLayout Component React Code**

Write `TemplateLayout.tsx` which consumes a JSON template configuration and active VDE tokens to dynamically lay out the scene.

```typescript
import React from "react";
import { AbsoluteFill } from "remotion";
import { LayoutProps } from "./LayoutTypes";
import { getThemeStyles } from "../../styles/themes";

export interface TemplateLayoutProps extends LayoutProps {
  templateJson: any;
}

export const TemplateLayout: React.FC<TemplateLayoutProps> = ({
  resolvedComponents,
  accentColor,
  theme,
  renderComponent,
  renderBackground,
  visualStyle,
  templateJson
}) => {
  const styles = getThemeStyles(visualStyle || theme, accentColor);
  const t = templateJson;

  const titleComp = resolvedComponents.find(c => c.type === "title");
  const otherComps = resolvedComponents.filter(c => c.type !== "title");

  // Title styling
  const titleStyle: React.CSSProperties = {
    fontSize: t.title.fontSize || "80px",
    fontWeight: t.title.fontWeight || "800",
    fontFamily: styles.fontFamily,
    letterSpacing: t.title.letterSpacing || "-0.04em",
    marginBottom: t.title.marginBottom || "200px",
    textShadow: t.title.useAccentTextShadow ? `0 0 24px ${accentColor}33` : "none",
    color: styles.titleStyle.color || "#ffffff",
    textAlign: "center",
    width: "100%",
    textTransform: "uppercase"
  };

  // Card container styling
  const cardStyle: React.CSSProperties = {
    display: "grid",
    gap: t.items.gap || "16px",
    padding: t.card.padding || "22px",
    borderRadius: t.card.borderRadius || styles.cardStyle.borderRadius || "28px",
    background: t.card.useThemeCardBg ? styles.cardStyle.backgroundColor : "transparent",
    borderWidth: t.card.borderWidth || "1px",
    borderStyle: "solid",
    borderColor: t.card.useAccentBorderLeft 
      ? `rgba(255,255,255,0.18) rgba(255,255,255,0.18) rgba(255,255,255,0.18) ${accentColor}`
      : styles.cardStyle.borderColor || "rgba(255,255,255,0.1)",
    boxShadow: t.card.useThemeShadow ? styles.cardStyle.boxShadow : "none",
    backdropFilter: t.card.useBackdropFilter ? "blur(8px) saturate(1.08)" : "none",
    width: "100%",
    maxWidth: t.container.maxWidth || "860px",
    boxSizing: "border-box"
  };

  return (
    <AbsoluteFill style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center",
      padding: "86px", 
      justifyContent: "flex-start", 
      paddingTop: t.container.paddingTop || "230px",
      boxSizing: "border-box"
    }}>
      {renderBackground()}

      {titleComp && (
        <h1 style={titleStyle}>
          {titleComp.data.text}
        </h1>
      )}

      <div style={cardStyle}>
        {otherComps.map((comp, idx) => {
          const itemStyleSetting = t.items.itemStyles[idx % t.items.itemStyles.length] || { fontSize: "28px", fontWeight: "700" };
          const rotation = t.items.rotations[idx % t.items.rotations.length] || 0;
          
          const itemOverrides = {
            style: {
              fontSize: itemStyleSetting.fontSize,
              fontWeight: itemStyleSetting.fontWeight,
              transform: `rotate(${rotation}deg) scale(${itemStyleSetting.scale || 1})`,
              background: itemStyleSetting.useAccentBg 
                ? `${accentColor}12` 
                : itemStyleSetting.useSubtleThemeBg ? "rgba(255,255,255,0.03)" : "transparent",
              borderColor: itemStyleSetting.useAccentBorder ? `${accentColor}40` : "rgba(255,255,255,0.14)",
              boxShadow: itemStyleSetting.useAccentShadow ? `0 0 24px ${accentColor}14` : "none"
            }
          };

          return renderComponent(comp, itemOverrides);
        })}
      </div>
    </AbsoluteFill>
  );
};
```

**Step 2: Commit**

```bash
git add my-video/src/compositions/layouts/TemplateLayout.tsx
git commit -m "feat: implement universal TemplateLayout React component"
```

---

### Task 4: Register TemplateLayout in Remotion Engine

**Files:**
- Modify: `my-video/src/compositions/layouts/index.ts`
- Modify: `my-video/src/compositions/layouts/DynamicLayout.tsx`

**Step 1: Register TemplateLayout in `layouts/index.ts`**

Import and add `yupvid_editorial_card` mapping to `TemplateLayout` (using loaded JSON template).

```typescript
// Add imports
import { TemplateLayout } from "./TemplateLayout";
import yupvidEditorialCardJson from "./templates/yupvid_editorial_card.json";

// Add to LAYOUT_REGISTRY
  YupVidEditorialCard: {
    id: "YupVidEditorialCard",
    name: "YupVid Editorial Card",
    family: "list",
    component: (props) => React.createElement(TemplateLayout, { ...props, templateJson: yupvidEditorialCardJson }),
    description: "Khung xương layout dạng card biên tập xoay nghiêng phong cách YupVid."
  }
```

**Step 2: Run verification and verify code builds**

```bash
# Verify no syntax or build errors in Remotion layouts
npm run build --prefix my-video
```

**Step 3: Commit**

```bash
git add my-video/src/compositions/layouts/index.ts my-video/src/compositions/layouts/DynamicLayout.tsx
git commit -m "feat: register YupVidEditorialCard in Remotion layouts index"
```

---

### Task 5: Integrate Dynamic Template loading in Backend Storyboard Generator

**Files:**
- Modify: `backend/services/ai.js`

**Step 1: Enable Gemini to select the new layout**

Update `visualLayout` schema validation and prompt options to include `YupVidEditorialCard`.

```javascript
// Modify AI schema instructions to allow "YupVidEditorialCard" layout
"visualLayout": "Hero" | "Split Screen" | "Dashboard" | "Feature Grid" | "Timeline" | "Comparison" | "Terminal" | "Gallery" | "Laptop Mockup" | "Stats Banner" | "Three Columns" | "Integration Cloud" | "YupVidEditorialCard",
```

**Step 2: Run backend tests to verify storyboard generation**

Run: `node backend/test_vde.js`
Expected: Successful schema execution with VDE configurations.

**Step 3: Commit**

```bash
git add backend/services/ai.js
git commit -m "feat: support YupVidEditorialCard layout selection in AI service"
```
