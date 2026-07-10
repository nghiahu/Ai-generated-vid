import os

dir_paths = ["my-video/src/components/layout", "my-video/src/compositions"]
found_lines = []

for dir_path in dir_paths:
    if not os.path.exists(dir_path):
        continue
    for root, dirs, files in os.walk(dir_path):
        for file in files:
            if file.endswith((".ts", ".tsx", ".js", ".jsx")):
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                for idx, line in enumerate(lines):
                    if "claude" in line.lower() or "d96b43" in line.lower():
                        found_lines.append((file, idx+1, line.strip()))

print(f"Found {len(found_lines)} references:")
for file, line_num, text in found_lines:
    print(f"- {file}:{line_num}: {text}")
