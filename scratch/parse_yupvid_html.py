import sys
import os
import json
import re
from html.parser import HTMLParser

class YupVidHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title_div = None
        self.cards = []
        self.subtitle_div = None
        self.div_stack = [] # Stack of node dicts

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        style_str = attr_dict.get('style', '')
        style_dict = {}
        if style_str:
            parts = style_str.split(';')
            for part in parts:
                if ':' in part:
                    k, v = part.split(':', 1)
                    style_dict[k.strip().lower()] = v.strip().replace('"', '').replace('&quot;', '')
        
        # Check if we are inside a card node already
        is_inside_card = False
        for node in self.div_stack:
            if node.get("is_card"):
                is_inside_card = True
                break

        # Check if this div qualifies as a card
        is_card = False
        if tag == 'div' and not is_inside_card:
            if (style_dict.get('position') == 'absolute' and 
                'width' in style_dict and 
                ('height' in style_dict or 'min-height' in style_dict) and 
                'border-radius' in style_dict):
                is_card = True

        node = {
            "tag": tag,
            "attrs": attr_dict,
            "style": style_dict,
            "is_card": is_card,
            "content": [],
            "children": []
        }
        
        if self.div_stack:
            self.div_stack[-1]["children"].append(node)
            
        self.div_stack.append(node)

    def handle_data(self, data):
        if data.strip() and self.div_stack:
            self.div_stack[-1]["content"].append(data.strip())

    def handle_endtag(self, tag):
        if not self.div_stack:
            return
        node = self.div_stack.pop()
        
        # Process node on closure
        styles = node["style"]
        tag = node["tag"]
        text_content = " ".join(node["content"]).strip()
        
        if tag == 'div':
            # Check Title: large font-size (> 60px) and contains text
            font_size = styles.get('font-size', '')
            if font_size and font_size.endswith('px'):
                try:
                    fs_val = int(font_size.replace('px', ''))
                    if fs_val >= 60 and text_content:
                        self.title_div = node
                except ValueError:
                    pass
            
            # Check if card (and not nested)
            if node.get("is_card"):
                self.cards.append(node)
                
            # Check Subtitle: display contains flex and bottom offset
            if ('flex' in styles.get('display', '') or 'inline-flex' in styles.get('display', '')) and 'bottom' in styles:
                self.subtitle_div = node
                
        # Propagate text content to parent
        if self.div_stack and text_content:
            self.div_stack[-1]["content"].append(text_content)

def parse_html_to_layout_json(html_content, layout_id, layout_name):
    parser = YupVidHTMLParser()
    parser.feed(html_content)
    
    # 1. Title config
    title_config = {
        "fontSize": "80px",
        "fontWeight": "900",
        "letterSpacing": "-0.04em",
        "marginBottom": "100px",
        "useAccentTextShadow": True
    }
    
    if parser.title_div:
        t_style = parser.title_div["style"]
        title_config["fontSize"] = t_style.get('font-size', title_config["fontSize"])
        title_config["fontWeight"] = t_style.get('font-weight', title_config["fontWeight"])
        title_config["letterSpacing"] = t_style.get('letter-spacing', title_config["letterSpacing"])
        
    # 2. Stacked Cards config
    # Sort cards by z-index descending
    def get_z_index(c):
        try:
            return int(c["style"].get("z-index", "0"))
        except ValueError:
            return 0
            
    parser.cards.sort(key=get_z_index, reverse=True)
    
    item_styles = []
    rotations = []
    positions = []
    
    for idx, card in enumerate(parser.cards):
        css = card["style"]
        
        # Extract rotation and scale from transform
        transform = css.get('transform', '')
        rot = 0.0
        scale = 1.0
        if transform:
            rot_match = re.search(r'rotate\(([-]?\d+\.?\d*)deg\)', transform)
            if rot_match:
                rot = float(rot_match.group(1))
            scale_match = re.search(r'scale\(([-]?\d+\.?\d*)\)', transform)
            if scale_match:
                scale = float(scale_match.group(1))
                
        rotations.append(rot)
        
        # Positions
        positions.append({
            "left": css.get("left", "0px"),
            "top": css.get("top", "0px"),
            "width": css.get("width", "400px"),
            "height": css.get("min-height") or css.get("height", "200px"),
            "zIndex": css.get("z-index", "1")
        })
        
        # Visual style flags (accent checking)
        border = css.get("border", "")
        background = css.get("background", "")
        box_shadow = css.get("box-shadow", "")
        
        use_accent_border = "239, 68, 68" in border or "rgb(239" in border or "rgba(239" in border
        use_accent_bg = "239, 68, 68" in background or "rgb(239" in background or "rgba(239" in background
        use_accent_shadow = "239, 68, 68" in box_shadow
        
        style_def = {
            "fontSize": css.get("font-size", "28px"),
            "fontWeight": css.get("font-weight", "800"),
            "borderRadius": css.get("border-radius", "30px"),
            "padding": css.get("padding", "24px"),
            "scale": scale
        }
        
        if use_accent_bg or use_accent_border or use_accent_shadow:
            style_def["useAccentBg"] = True
            style_def["useAccentBorder"] = True
            style_def["useAccentShadow"] = True
        else:
            style_def["useSubtleThemeBg"] = True
            style_def["useThemeBorder"] = True
            
        item_styles.append(style_def)

    # 3. Subtitle config
    subtitle_config = {
        "bottom": "300px",
        "fontSize": "46px",
        "fontWeight": "950",
        "useThemeTextShadow": True
    }
    
    if parser.subtitle_div:
        sub_style = parser.subtitle_div["style"]
        subtitle_config["bottom"] = sub_style.get('bottom', '300px')
        subtitle_config["fontSize"] = sub_style.get('font-size', '46px')
        subtitle_config["fontWeight"] = sub_style.get('font-weight', '950')
        
    layout_data = {
        "id": layout_id,
        "name": layout_name,
        "container": {
            "paddingTop": "230px",
            "maxWidth": "1000px",
            "gap": "24px"
        },
        "title": title_config,
        "positions": positions,
        "items": {
            "rotations": rotations,
            "itemStyles": item_styles
        },
        "subtitle": subtitle_config
    }
    
    return layout_data

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: python parse_yupvid_html.py <path_to_html_file> <layout_id> <layout_name>")
        sys.exit(1)
        
    html_file = sys.argv[1]
    layout_id = sys.argv[2]
    layout_name = sys.argv[3]
    
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
        
    layout_json = parse_html_to_layout_json(html_content, layout_id, layout_name)
    
    output_dir = "my-video/src/compositions/layouts/templates"
    output_path = f"{output_dir}/{layout_id}.json"
    os.makedirs(output_dir, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(layout_json, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully generated skeleton JSON layout at: {output_path}")
