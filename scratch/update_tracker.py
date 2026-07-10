import re
import os

tracker_path = "docs/plans/layout-build-tracker.md"
with open(tracker_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's also check which files actually exist in templates
templates_base = "my-video/src/compositions/layouts/templates"

def to_snake_case(name):
    name = re.sub(r'[^a-zA-Z0-9\s-]', '', name)
    name = re.sub(r'[\s-]+', '_', name)
    return name.lower()

# Map folder titles to the subdirectory names in templates
FOLDER_MAP = {
    "Opening-Headline": "Opening-Headline",
    "List-Step": "List-Step",
    "Qute-Insght": "Qute-Insght",
    "Media": "Media",
    "Comparision-Table": "Comparision-Table",
    "Data-Metrics": "Data-Metrics",
    "Timeline": "Timeline",
    "Ending": "Ending"
}

lines = content.split('\n')
current_category = None

for i, line in enumerate(lines):
    if line.startswith("## "):
        # e.g., "## Opening-Headline (1 / 71)" or "## List-Step (0 / 21) ← Ưu Tiên Trước"
        match = re.search(r'## ([A-Za-z-]+)', line)
        if match:
            current_category = match.group(1)
            
    if current_category and line.startswith("|") and not "Layout |" in line and not "--- |" in line:
        parts = line.split("|")
        if len(parts) >= 6:
            layout_name = parts[2].strip()
            
            # Check if JSON file exists for this layout
            snake_name = to_snake_case(layout_name)
            
            # Check either directly in templates or subfolders
            subfolder = FOLDER_MAP.get(current_category)
            json_file = f"{templates_base}/{subfolder}/{snake_name}.json"
            
            # Special case for existing intro_chapter_stack
            if layout_name == "Intro Chapter Stack Image":
                json_file = f"{templates_base}/intro_chapter_stack.json"
                
            if os.path.exists(json_file):
                # Update JSON, Registry, and Gemini columns to [x]
                parts[3] = " `[x]` "
                parts[4] = " `[x]` "
                parts[5] = " `[x]` "
                lines[i] = "|".join(parts)

# Update overall completed count
# Count total [x] in the entire content
new_content = "\n".join(lines)

# Count matches
json_completed = len(re.findall(r'\|[^|]+\|[^|]+\|\s*`\[x\]`', new_content))
print(f"Total JSONs marked as completed: {json_completed}")

# Update total count in header: e.g. "Tiến độ tổng: **1 / 180** layouts hoàn thành"
new_content = re.sub(
    r'Tiến độ tổng: \*\*\d+ / \d+\*\* layouts hoàn thành',
    f'Tiến độ tổng: **{json_completed} / 180** layouts hoàn thành',
    new_content
)

# Also update category progress counts like "## Opening-Headline (1 / 71)" -> "## Opening-Headline (71 / 71)"
# Let's count completed items for each category
category_blocks = re.split(r'(## [A-Za-z-]+)', new_content)
for k in range(1, len(category_blocks), 2):
    cat_header = category_blocks[k]
    cat_body = category_blocks[k+1]
    
    cat_name = cat_header.replace("## ", "").strip()
    # Find all table rows in this block and count total rows and checked [x] JSONs
    rows = [r for r in cat_body.split('\n') if r.startswith("|") and not "Layout |" in r and not "--- |" in r]
    total_in_cat = len(rows)
    completed_in_cat = sum(1 for r in rows if "`[x]`" in r.split("|")[3])
    
    # Update the header count
    # Keep any extra suffix like "← Ưu Tiên Trước"
    suffix = ""
    if "←" in cat_header:
        suffix = cat_header[cat_header.find("←"):]
    
    clean_cat_name = cat_name.split(" ")[0].split("(")[0].strip()
    category_blocks[k] = f"## {clean_cat_name} ({completed_in_cat} / {total_in_cat}){suffix}"

new_content = "".join(category_blocks)

with open(tracker_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Updated layout-build-tracker.md successfully!")
