import sys
import os
import json
import re
from html.parser import HTMLParser

class YupVidHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title_div = None
        self.subtitle_div = None
        self.raw_nodes = []  # List of all parsed nodes in order
        self.div_stack = []  # Stack of node dicts

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

        node = {
            "id": len(self.raw_nodes),
            "tag": tag,
            "attrs": attr_dict,
            "style": style_dict,
            "content": [],
            "parent_id": self.div_stack[-1]["id"] if self.div_stack else None,
            "children_ids": []
        }
        
        if self.div_stack:
            self.div_stack[-1]["children_ids"].append(node["id"])
            
        self.raw_nodes.append(node)
        self.div_stack.append(node)

    def handle_data(self, data):
        if data.strip() and self.div_stack:
            self.div_stack[-1]["content"].append(data.strip())

    def handle_endtag(self, tag):
        if not self.div_stack:
            return
        node = self.div_stack.pop()
        
        # Propagate text content to parent
        text_content = " ".join(node["content"]).strip()
        if self.div_stack and text_content:
            self.div_stack[-1]["content"].append(text_content)

def clean_value(val):
    if not val:
        return ""
    return val.strip().lower()

def is_accent_color(val):
    val = clean_value(val)
    return "239, 68, 68" in val or "rgb(239" in val or "rgba(239" in val or "rgba(239,68,68" in val

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

def parse_html_to_layout_json(html_content, layout_id, layout_name, family, layout_mode):
    parser = YupVidHTMLParser()
    parser.feed(html_content)
    
    # Post-process parser nodes to extract text, title, cards, subtitle
    title_node = None
    subtitle_node = None
    card_nodes = []
    
    # 1. Identify Title and Subtitle
    for node in parser.raw_nodes:
        if node["tag"] != 'div':
            continue
        styles = node["style"]
        text_content = " ".join(node["content"]).strip()
        
        # Title check: font-size >= 60px and has text
        font_size = styles.get('font-size', '')
        if font_size and font_size.endswith('px'):
            try:
                fs_val = int(font_size.replace('px', ''))
                if fs_val >= 60 and text_content and not title_node:
                    title_node = node
            except ValueError:
                pass
                
        # Subtitle check: display contains flex and has bottom offset
        if ('flex' in styles.get('display', '') or 'inline-flex' in styles.get('display', '')) and 'bottom' in styles:
            if text_content and not subtitle_node:
                subtitle_node = node

    # 2. Identify Card-like nodes
    for node in parser.raw_nodes:
        if node["tag"] != 'div':
            continue
        styles = node["style"]
        
        # Skip backgrounds or large viewport containers
        width = styles.get('width', '')
        height = styles.get('height', '')
        if width == '1080px' and height == '1920px':
            continue
            
        # Check if it has card-like characteristics
        has_border_radius = 'border-radius' in styles
        has_padding = 'padding' in styles
        has_bg = 'background' in styles or 'background-color' in styles
        has_border = 'border' in styles
        
        # A card must have border-radius and either padding, background or border
        if has_border_radius and (has_padding or has_bg or has_border):
            # Check if it contains text somewhere in its descendants
            def has_text_descendant(n_id):
                n = parser.raw_nodes[n_id]
                if " ".join(n["content"]).strip():
                    return True
                for c_id in n["children_ids"]:
                    if has_text_descendant(c_id):
                        return True
                return False
                
            if has_text_descendant(node["id"]):
                card_nodes.append(node)

    # Filter out title category badges (siblings of title node with border-radius: 999px)
    if title_node:
        filtered_cards = []
        for card in card_nodes:
            is_title_sibling = card["parent_id"] == title_node["parent_id"]
            is_rounded_pill = '999px' in card["style"].get('border-radius', '') or '50%' in card["style"].get('border-radius', '')
            if is_title_sibling and is_rounded_pill:
                # Category badge in title block - skip
                continue
            filtered_cards.append(card)
        card_nodes = filtered_cards

    # 3. Classify cards using Depth-based Card Hierarchy
    card_ids = {c["id"] for c in card_nodes}
    
    # Helper to calculate how many ancestor card nodes a card has
    def get_card_ancestry_depth(card_node):
        depth = 0
        curr = card_node
        while curr["parent_id"] is not None:
            parent = parser.raw_nodes[curr["parent_id"]]
            if parent["id"] in card_ids:
                depth += 1
            curr = parent
        return depth

    # Helper to check if a card contains other card nodes in its descendants
    def contains_other_cards(card_node):
        for other in card_nodes:
            if other["id"] == card_node["id"]:
                continue
            curr = other
            while curr["parent_id"] is not None:
                if curr["parent_id"] == card_node["id"]:
                    return True
                curr = parser.raw_nodes[curr["parent_id"]]
        return False

    container_card = None
    item_cards = []
    
    for card in card_nodes:
        depth = get_card_ancestry_depth(card)
        has_children_cards = contains_other_cards(card)
        
        if depth == 0:
            if has_children_cards:
                # Outermost card with children -> Main Layout Container
                if not container_card:
                    container_card = card
            else:
                # Outermost card without children -> Direct Layout Item (e.g. stack card, vs card)
                item_cards.append(card)
        elif depth == 1:
            # Child card of the container card -> Layout Item (e.g. checklist row)
            # Only count as item if its parent is the container card
            parent_id = card["parent_id"]
            while parent_id is not None and parent_id not in card_ids:
                parent_id = parser.raw_nodes[parent_id]["parent_id"]
            if container_card and parent_id == container_card["id"]:
                item_cards.append(card)
        # depth >= 2 are nested badges or decorations inside items, which we ignore

    # Auto-detect layout mode based on actual card positioning
    has_absolute_cards = False
    for card in item_cards:
        css_style = card["style"]
        if css_style.get("position") == "absolute" and ("left" in css_style or "top" in css_style):
            has_absolute_cards = True
            break
            
    detected_mode = layout_mode
    if has_absolute_cards:
        detected_mode = "absolute_cards"
    else:
        # Relative positioning detected!
        if len(item_cards) == 1:
            detected_mode = "centered_text"
        elif len(item_cards) == 2:
            detected_mode = "split_horizontal"
        elif len(item_cards) == 3:
            detected_mode = "horizontal_list"
        else:
            if family == "data" or family == "comparison":
                detected_mode = "grid_metrics"
            else:
                detected_mode = "vertical_list"
                
    layout_mode = detected_mode

    # If layout_mode is absolute_cards, sort item cards by z-index descending
    if layout_mode == "absolute_cards":
        def get_z_index(c):
            try:
                return int(c["style"].get("z-index", "0"))
            except ValueError:
                return 0
        item_cards.sort(key=get_z_index, reverse=True)

    # 4. Extract Title Config
    title_config = {
        "fontSize": "80px",
        "fontWeight": "900",
        "letterSpacing": "-0.04em",
        "marginBottom": "100px",
        "useAccentTextShadow": True
    }
    if title_node:
        t_style = title_node["style"]
        title_config["fontSize"] = t_style.get('font-size', title_config["fontSize"])
        title_config["fontWeight"] = t_style.get('font-weight', title_config["fontWeight"])
        title_config["letterSpacing"] = t_style.get('letter-spacing', title_config["letterSpacing"])

    # 5. Extract Subtitle Config
    subtitle_config = {
        "bottom": "300px",
        "fontSize": "46px",
        "fontWeight": "950",
        "useThemeTextShadow": True
    }
    if subtitle_node:
        sub_style = subtitle_node["style"]
        subtitle_config["bottom"] = sub_style.get('bottom', '300px')
        subtitle_config["fontSize"] = sub_style.get('font-size', '46px')
        subtitle_config["fontWeight"] = sub_style.get('font-weight', '950')

    # 5b. Extract CategoryPill (small pill badge near/above title)
    category_pill = None
    title_text = " ".join(title_node["content"]).strip() if title_node else ""
    for node in parser.raw_nodes:
        if node["tag"] != "div":
            continue
        node_style = node["style"]
        br = node_style.get("border-radius", "")
        text_content = " ".join(node["content"]).strip()
        # Must be a pill (999px), must have text, must NOT be the title
        if "999px" not in br or not text_content:
            continue
        if title_text and text_content == title_text:
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
        h_val = 999
        if h.endswith("px"):
            try:
                h_val = float(h.replace("px", ""))
            except:
                pass
        if h_val <= 10 and "999px" in br and "gradient" in bg:
            glow_shadows = re.findall(r'rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)', ns.get("box-shadow", ""))
            accent_divider = {
                "width": ns.get("width", "220px"),
                "height": h,
                "gradient": bg,
                "glowRgba": glow_shadows[0] if glow_shadows else None
            }
            break

    # 6. Extract Positions and Card Styles
    positions = []
    rotations = []
    item_styles = []
    
    for card in item_cards:
        css = card["style"]
        
        # Rotate & scale
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
        
        # Coordinates
        positions.append({
            "left": css.get("left", "0px"),
            "top": css.get("top", "0px"),
            "width": css.get("width", "100%"),
            "height": css.get("min-height") or css.get("height", "auto"),
            "zIndex": css.get("z-index", "1")
        })
        
        # Stylings
        border = css.get("border", "")
        background = css.get("background", "") or css.get("background-color", "")
        box_shadow = css.get("box-shadow", "")
        backdrop_filter = css.get("backdrop-filter", "")
        
        bg_rgba = extract_rgba_from_css(background)
        border_rgba = extract_rgba_from_css(border)
        badge_rgba = extract_badge_color_from_children(card, parser.raw_nodes)
        
        # Extract glow shadow (second rgba in box-shadow, if any, otherwise first)
        all_shadows = re.findall(r'rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)', box_shadow)
        shadow_glow_rgba = all_shadows[1] if len(all_shadows) > 1 else (all_shadows[0] if all_shadows else None)
        
        use_accent = is_accent_color(border) or is_accent_color(background) or is_accent_color(box_shadow)
        
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
            "backdropBlur": extract_blur_px(backdrop_filter),
            "useAccentBg": use_accent,
            "useAccentBorder": use_accent,
            "useAccentShadow": use_accent,
            "useSubtleThemeBg": not use_accent,
            "useThemeBorder": not use_accent
        }
        item_styles.append(style_def)

    # Container-level style
    container_style = {}
    if container_card:
        ccss = container_card["style"]
        container_style = {
            "borderRadius": ccss.get("border-radius", "28px"),
            "padding": ccss.get("padding", "24px"),
            "gap": ccss.get("gap", "12px"),
            "useSubtleThemeBg": not is_accent_color(ccss.get("background", "")),
            "useAccentBg": is_accent_color(ccss.get("background", ""))
        }

    layout_data = {
        "id": layout_id,
        "name": layout_name,
        "family": family,
        "layoutMode": layout_mode,
        "container": {
            "paddingTop": "230px",
            "maxWidth": "1000px",
            "gap": "24px",
            **container_style
        },
        "categoryPill": category_pill,
        "accentDivider": accent_divider,
        "title": title_config,
        "positions": positions,
        "items": {
            "rotations": rotations,
            "itemStyles": item_styles
        },
        "subtitle": subtitle_config
    }
    
    return layout_data

# Mapping configurations
FOLDER_TO_FAMILY = {
    "Opening-Headline": "opening",
    "List-Step": "list",
    "Qute-Insght": "quote",
    "Media": "media",
    "Comparision-Table": "comparison",
    "Data-Metrics": "data",
    "Timeline": "timeline",
    "Ending": "ending"
}

FOLDER_TO_LAYOUT_MODE = {
    "Opening-Headline": "absolute_cards",
    "List-Step": "vertical_list",
    "Qute-Insght": "centered_text",
    "Media": "split_horizontal",
    "Comparision-Table": "split_horizontal",
    "Data-Metrics": "grid_metrics",
    "Timeline": "vertical_list",
    "Ending": "centered_text"
}

def to_snake_case(name):
    name = re.sub(r'[^a-zA-Z0-9\s-]', '', name)
    name = re.sub(r'[\s-]+', '_', name)
    return name.lower()

def to_pascal_case(name):
    name = re.sub(r'[^a-zA-Z0-9\s-]', '', name)
    words = re.split(r'[\s-]+', name)
    return "".join(word.capitalize() for word in words)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage:")
        print("  Batch mode: python parse_yupvid_html.py <directory_path>")
        print("  Single file: python parse_yupvid_html.py <file_path> [layout_id] [layout_name]")
        sys.exit(1)
        
    path = sys.argv[1]
    
    if os.path.isdir(path):
        # Batch Mode!
        print(f"Scanning directory: {path} for YupVid layout HTMLs...")
        success_count = 0
        skipped_count = 0
        
        for root, dirs, files in os.walk(path):
            # Determine family and mode from parent folder
            parent_folder = os.path.basename(root)
            family = FOLDER_TO_FAMILY.get(parent_folder)
            mode = FOLDER_TO_LAYOUT_MODE.get(parent_folder)
            
            if not family:
                continue
                
            for file in files:
                if not file.endswith('.html'):
                    continue
                    
                file_path = os.path.join(root, file)
                base_name = os.path.splitext(file)[0]
                
                layout_id = to_pascal_case(base_name)
                layout_filename_snake = to_snake_case(base_name)
                layout_name = base_name
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        html_content = f.read()
                        
                    layout_json = parse_html_to_layout_json(html_content, layout_id, layout_name, family, mode)
                    
                    # Create matching folder structure in templates
                    dest_dir = os.path.join("my-video/src/compositions/layouts/templates", parent_folder)
                    os.makedirs(dest_dir, exist_ok=True)
                    
                    dest_path = os.path.join(dest_dir, f"{layout_filename_snake}.json")
                    with open(dest_path, 'w', encoding='utf-8') as f:
                        json.dump(layout_json, f, indent=2, ensure_ascii=False)
                        
                    success_count += 1
                except Exception as e:
                    print(f"Error parsing {file_path}: {e}")
                    skipped_count += 1
                    
        print(f"\nBatch compilation finished.")
        print(f"Successfully compiled: {success_count} layouts.")
        print(f"Failed/Skipped: {skipped_count} layouts.")
        
    else:
        # Single File Mode!
        html_file = path
        base_name = os.path.splitext(os.path.basename(html_file))[0]
        
        layout_id = sys.argv[2] if len(sys.argv) > 2 else to_pascal_case(base_name)
        layout_name = sys.argv[3] if len(sys.argv) > 3 else base_name
        
        # Try to infer family and layout_mode from file path
        parent_folder = os.path.basename(os.path.dirname(html_file))
        family = FOLDER_TO_FAMILY.get(parent_folder, "opening")
        mode = FOLDER_TO_LAYOUT_MODE.get(parent_folder, "absolute_cards")
        
        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
            
        layout_json = parse_html_to_layout_json(html_content, layout_id, layout_name, family, mode)
        
        output_dir = "my-video/src/compositions/layouts/templates"
        if parent_folder in FOLDER_TO_FAMILY:
            output_dir = os.path.join(output_dir, parent_folder)
        os.makedirs(output_dir, exist_ok=True)
        
        output_filename = to_snake_case(layout_name)
        output_path = os.path.join(output_dir, f"{output_filename}.json")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(layout_json, f, indent=2, ensure_ascii=False)
            
        print(f"Successfully generated skeleton JSON layout at: {output_path}")
