editor_path = "frontend/src/components/StoryboardEditor.jsx"
with open(editor_path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split('\n')
for idx, line in enumerate(lines):
    if "selectedStyle" in line or "setSelectedStyle" in line:
        print(f"Line {idx+1}: {line}")
