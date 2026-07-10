import re

tracker_path = "docs/plans/layout-build-tracker.md"
with open(tracker_path, "r", encoding="utf-8") as f:
    content = f.read()

# Pattern matches ## Header (counts) (counts) ... [optional suffix]
# Let's replace any duplicated count groups with a single clean count group.
lines = content.split('\n')
for idx, line in enumerate(lines):
    if line.startswith("## "):
        # Match e.g., "## Opening-Headline (71 / 71) (71 / 71) ..."
        # Extract the name and the correct completed/total counts
        match = re.search(r'##\s+([A-Za-z-]+)\s+\((\d+)\s*/\s*(\d+)\)', line)
        if match:
            cat_name = match.group(1)
            completed = match.group(2)
            total = match.group(3)
            
            # Suffix if any (like ← Ưu Tiên Trước)
            suffix = ""
            if "←" in line:
                suffix = line[line.find("←"):]
                
            lines[idx] = f"## {cat_name} ({completed} / {total}) {suffix}".strip()

with open(tracker_path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("Progress tracker headers cleaned successfully!")
