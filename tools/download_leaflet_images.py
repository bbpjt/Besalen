import os
import urllib.request

os.makedirs("lib/leaflet/images", exist_ok=True)
images = [
    "marker-icon.png",
    "marker-icon-2x.png",
    "marker-shadow.png"
]
for img in images:
    path = f"lib/leaflet/images/{img}"
    url = f"https://unpkg.com/leaflet@1.9.4/dist/images/{img}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as res:
            with open(path, "wb") as f:
                f.write(res.read())
        print(f"[OK] Downloaded {img}")
    except Exception as e:
        print(f"[ERR] {img}: {e}")
