registry_path = "my-video/src/compositions/layouts/index.ts"
with open(registry_path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split('\n')
for idx, line in enumerate(lines):
    if "Comparison" in line or "VersusArena" in line or "Versus" in line:
        print(f"Line {idx+1}: {line}")
