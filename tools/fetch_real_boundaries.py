import urllib.request
import json
import os

url = "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IDN/ADM2/geoBoundaries-IDN-ADM2_simplified.geojson"
print("Downloading simplified ADM2 GeoJSON...")
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=30) as res:
    data = json.loads(res.read().decode('utf-8'))

print("Total features in Indonesia ADM2:", len(data.get("features", [])))
if data.get("features"):
    sample = data["features"][0]
    print("Sample feature properties:", sample.get("properties"))

# Check for Cilacap
cilacap_feats = [f for f in data["features"] if "cilacap" in str(f.get("properties", {})).lower()]
print("Cilacap features found:", len(cilacap_feats))
if cilacap_feats:
    print("Cilacap properties:", cilacap_feats[0].get("properties"))
    geom_type = cilacap_feats[0].get("geometry", {}).get("type")
    print("Cilacap geometry type:", geom_type)
