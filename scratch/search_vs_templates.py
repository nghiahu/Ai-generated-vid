import os

folder = "layoutElement/Comparision-Table"
for file in os.listdir(folder):
    if file.endswith(".html"):
        path = os.path.join(folder, file)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Search for unique text patterns seen in the screenshot
        # Like "vs" badge with circular container or specific class names
        if 'vs' in content.lower():
            # Print file name and a snippet where "vs" is defined
            print(f"File: {file}")
            idx = content.lower().find('vs')
            print(f"  Snippet: {content[max(0, idx-50):min(len(content), idx+50)].strip()}")
