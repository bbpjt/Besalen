import urllib.request
import re
import json

url = "https://drive.google.com/drive/folders/18w4WNaHh6PTtLBR11E406lFkM9far-rF?usp=sharing"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
html = urllib.request.urlopen(req, timeout=10).read().decode("utf-8", errors="ignore")

# Find patterns like ["1xyz...", "filename.jpg", ...]
# In Google drive folder HTML, data is serialized in JS arrays
matches = re.findall(r'\[\"([a-zA-Z0-9_-]{25,45})\",\[\"(.*?)\"', html)
print(f"Total potential matches: {len(matches)}")
for file_id, name in matches:
    if any(name.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]):
        print(f"File: {name} -> ID: {file_id}")
