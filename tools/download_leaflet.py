import os
import urllib.request

os.makedirs("lib/leaflet", exist_ok=True)

files = {
    "lib/leaflet/leaflet.js": "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
    "lib/leaflet/leaflet.css": "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
}

for path, url in files.items():
    if not os.path.exists(path) or os.path.getsize(path) < 1000:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10) as res:
                with open(path, "wb") as f:
                    f.write(res.read())
            print(f"[OK] Downloaded: {path} ({os.path.getsize(path)} bytes)")
        except Exception as e:
            print(f"[ERR] Failed to download {url}: {e}")
    else:
        print(f"[EXISTS] {path}")
