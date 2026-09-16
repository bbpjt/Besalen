import json
import re

with open("data/sastra_data.js", "r", encoding="utf-8") as f:
    s_content = f.read()
s_data = json.loads(re.search(r"window\.SASTRA_DATA\s*=\s*(\{.*?\});", s_content, re.DOTALL).group(1))
our_35_kabs = s_data["kabupaten"]
print(f"Our 35 kabupaten/kota count: {len(our_35_kabs)}")

with open("tools/fetch_real_boundaries.py") as f:
    pass

import urllib.request
url = "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IDN/ADM2/geoBoundaries-IDN-ADM2_simplified.geojson"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=30) as res:
    geo_data = json.loads(res.read().decode('utf-8'))

all_gb_shapes = {f["properties"]["shapeName"].lower(): f for f in geo_data["features"]}

matched = []
unmatched = []
for k in our_35_kabs:
    orig_name = k["nama"]
    # clean: "Kabupaten Cilacap" -> "cilacap", "Kota Magelang" -> "kota magelang" or "magelang"
    clean = orig_name.lower().replace("kabupaten ", "").replace("kota ", "").strip()
    
    # Try exact shapeName
    found = None
    for s_name, feat in all_gb_shapes.items():
        if s_name == clean or s_name == orig_name.lower():
            found = feat
            break
        elif "kota " in orig_name.lower() and s_name == ("kota " + clean):
            found = feat
            break
            
    if found:
        matched.append((orig_name, found["properties"]["shapeName"]))
    else:
        unmatched.append(orig_name)

print(f"Direct matched: {len(matched)} / 35")
print(f"Unmatched: {unmatched}")
