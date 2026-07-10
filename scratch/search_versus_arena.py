import os

src_dir = "my-video/src"
found = []

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith((".ts", ".tsx", ".js", ".jsx")):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            if "VersusArena" in content or "versus_arena" in content:
                found.append(file)

print("Found files referencing VersusArena:")
print(found)
