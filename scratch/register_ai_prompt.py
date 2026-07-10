import os
import re
import json

templates_dir = "my-video/src/compositions/layouts/templates"
ai_js_path = "backend/services/ai.js"

# Group IDs by family
family_layouts = {
    "opening": ["Hero", "IntroBriefingCard", "Terminal", "IntroChapterStack"],
    "list": ["Feature Grid", "Three Columns"],
    "data": ["Dashboard", "Stats Banner"],
    "comparison": ["Comparison"],
    "quote": ["Quote"],
    "timeline": ["Timeline"],
    "media": ["Split Screen", "Gallery", "Laptop Mockup", "Integration Cloud"],
    "ending": ["Ending"]
}

# Scan templates
for root, dirs, files in os.walk(templates_dir):
    for file in files:
        if not file.endswith('.json'):
            continue
        file_path = os.path.join(root, file)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            layout_id = data.get("id")
            family = data.get("family")
            
            if base_name := os.path.splitext(file)[0]:
                if base_name == "intro_chapter_stack":
                    layout_id = "IntroChapterStack"
            
            if layout_id and family in family_layouts:
                if layout_id not in family_layouts[family]:
                    family_layouts[family].append(layout_id)
        except Exception as e:
            print(f"Error reading JSON {file_path}: {e}")

# Flatten all layouts for the schema enum
all_layouts = []
for family, layouts in family_layouts.items():
    all_layouts.extend(layouts)

# Sort all layouts alphabetically
all_layouts.sort()

# Format enum string for prompt schema
enum_str = " | ".join([f'"{layout}"' for layout in all_layouts])

# Format the Layout Selection Guide block
guide_lines = []
family_display_names = {
    "opening": "Opening / Headline",
    "list": "List / Steps",
    "data": "Data / Metrics",
    "comparison": "Comparison / Table",
    "quote": "Quote / Insight",
    "timeline": "Timeline",
    "media": "Media",
    "ending": "Ending"
}

for family, layouts in family_layouts.items():
    display_name = family_display_names.get(family, family.capitalize())
    layouts_sorted = sorted(layouts)
    guide_lines.append(f"      - {display_name}: {', '.join(layouts_sorted)}")

layouts_guide_str = "\n".join(guide_lines)

# Read ai.js
with open(ai_js_path, "r", encoding="utf-8") as f:
    ai_content = f.read()

# 1. Replace the "visualLayout" schema line
# We look for: "visualLayout": "Hero" | ... "IntroChapterStack",
schema_pattern = r'"visualLayout":\s*"Hero"\s*\|\s*"Split Screen"\s*\|\s*.*?"IntroChapterStack",'
new_schema_line = f'"visualLayout": {enum_str},'

# Let's perform a robust search and replace
# We find: "visualLayout": "Hero" | ...
# Since we don't know if the file was modified, let's search for the pattern
schema_match = re.search(r'"visualLayout":\s*"Hero"\s*\|\s*"Split\s+Screen"\s*\|\s*.*?,', ai_content)
if schema_match:
    ai_content = ai_content.replace(schema_match.group(0), new_schema_line)
    print("Successfully replaced visualLayout enum in JSON schema!")
else:
    # Fallback to general schema replace
    # Find line containing "visualLayout" and replace it
    lines = ai_content.split('\n')
    for idx, line in enumerate(lines):
        if '"visualLayout":' in line and 'Hero' in line:
            lines[idx] = f'          "visualLayout": {enum_str},'
            print(f"Fallback replacement of visualLayout enum on line {idx+1}")
            break
    ai_content = "\n".join(lines)

# 2. Replace the Layout selection guide
# Find the start of Layout selection guide
guide_start_marker = "Layout selection guide for \"visualLayout\":"
guide_end_marker = "CRITICAL BLOCK STYLE SELECTION RULES"

start_idx = ai_content.find(guide_start_marker)
end_idx = ai_content.find(guide_end_marker)

if start_idx != -1 and end_idx != -1:
    before = ai_content[:start_idx + len(guide_start_marker)]
    after = ai_content[end_idx:]
    
    new_guide = f"\n      Select the best matching layout from the categories below based on visual context:\n{layouts_guide_str}\n      \n      "
    ai_content = before + new_guide + after
    print("Successfully updated Layout selection guide in prompt!")
else:
    print("Could not find prompt guide markers. Skipping guide update.")

with open(ai_js_path, "w", encoding="utf-8") as f:
    f.write(ai_content)

print("AI Prompt updated successfully!")
