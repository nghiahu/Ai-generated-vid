import sys

# Set standard output encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

sidebar_path = "frontend/src/components/SidebarConfig.jsx"
with open(sidebar_path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split('\n')
for idx, line in enumerate(lines):
    if "style" in line.lower() or "theme" in line.lower():
        print(f"Line {idx+1}: {line}")
