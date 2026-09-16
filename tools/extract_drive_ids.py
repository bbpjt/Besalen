import urllib.request
import re
import json

url = "https://drive.google.com/drive/folders/18w4WNaHh6PTtLBR11E406lFkM9far-rF?usp=sharing"
req = urllib.request.Request(url, headers={
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
})
html = urllib.request.urlopen(req, timeout=10).read().decode("utf-8", errors="ignore")

# Find snippets containing the filenames and their IDs
# Google Drive encodes items like: [\"1ABC...\", ... \"IMG_7296.JPG\"]
# Let's search for the ID right before or after the filename
results = {}
for fname in re.findall(r'(?:x22)?(IMG_\d+\.JPG|2026\d+_\d+\.jpg)', html, re.IGNORECASE):
    # Find position of fname in html
    pos = 0
    while True:
        idx = html.find(fname, pos)
        if idx == -1:
            break
        # Take a window of 300 chars before and after
        window = html[max(0, idx - 400):min(len(html), idx + 400)]
        # Search for Drive file IDs (length 33, alphanumeric, dash, underscore)
        ids = re.findall(r'[\"\\\']([a-zA-Z0-9_-]{33})[\"\\\']', window)
        for fid in ids:
            if fid not in ["18w4WNaHh6PTtLBR11E406lFkM9far-rF"]: # skip folder ID
                results[fname] = fid
                break
        pos = idx + len(fname)

print(f"Mapped {len(results)} files to IDs:")
for k, v in sorted(results.items()):
    print(f"  {k} -> {v}")

with open("tools/kentrung_files.json", "w") as f:
    json.dump(results, f, indent=2)
