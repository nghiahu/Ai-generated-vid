import os
import json

templates_dir = "my-video/src/compositions/layouts/templates"
hardcoded_files = []

for root, dirs, files in os.walk(templates_dir):
    for file in files:
        if file.endswith(".json"):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                
                # Check if there are any hardcoded color strings in container, items, title, or subtitle
                content_str = json.dumps(data)
                # Check for common color formats like #, rgb, rgba
                # but we must ignore standard theme boolean flags like "useAccentBg", "useSubtleThemeBg"
                # Let's search for actual color values (hex codes like #ffffff or rgb/rgba)
                import re
                hex_matches = re.findall(r'#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})', content_str)
                rgb_matches = re.findall(r'rgba?\(', content_str)
                
                if hex_matches or rgb_matches:
                    hardcoded_files.append((file, hex_matches, rgb_matches))
            except Exception as e:
                print(f"Error reading {file}: {e}")

print(f"Found {len(hardcoded_files)} JSON files with hardcoded colors:")
for name, hexs, rgbs in hardcoded_files[:10]:
    print(f"- {name}: Hex={hexs}, RGB={rgbs}")
