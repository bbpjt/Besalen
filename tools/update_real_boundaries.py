import urllib.request
import json
import re
import os

print("Fetching authentic GeoBoundaries dataset...")
url = "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IDN/ADM2/geoBoundaries-IDN-ADM2_simplified.geojson"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=30) as res:
    gb_data = json.loads(res.read().decode('utf-8'))

# Load metadata from sastra_data.js
with open("data/sastra_data.js", "r", encoding="utf-8") as f:
    s_content = f.read()
s_data = json.loads(re.search(r"window\.SASTRA_DATA\s*=\s*(\{.*?\});", s_content, re.DOTALL).group(1))
kab_metadata_list = s_data["kabupaten"]

# Build lookup from GeoBoundaries features
gb_features_by_name = {}
for feat in gb_data["features"]:
    s_name = feat["properties"]["shapeName"].lower().strip()
    gb_features_by_name[s_name] = feat

output_features = []

for idx, kab in enumerate(kab_metadata_list):
    orig_name = kab["nama"]
    clean = orig_name.lower().replace("kabupaten ", "").replace("kota ", "").strip()
    
    # Matching
    found_feat = None
    if orig_name.lower() in gb_features_by_name:
        found_feat = gb_features_by_name[orig_name.lower()]
    elif "kota " in orig_name.lower() and ("kota " + clean) in gb_features_by_name:
        found_feat = gb_features_by_name["kota " + clean]
    elif clean in gb_features_by_name:
        found_feat = gb_features_by_name[clean]
        
    if not found_feat:
        raise ValueError(f"Could not find boundary for {orig_name}")
        
    kab_id = "KAB-" + str(kab.get("kode_wilayah", f"33{idx+1:02d}")).replace(".", "")
    out_feat = {
        "type": "Feature",
        "id": kab_id,
        "geometry": found_feat["geometry"],
        "properties": {
            "id": kab_id,
            "kode_wilayah": kab.get("kode_wilayah", ""),
            "nama": kab["nama"],
            "karesidenan": kab["karesidenan"],
            "zona_ekologi": kab["zona_ekologi"],
            "total_sastra": kab["total_potensi"],
            "r1_count": kab["r1_count"],
            "r2_count": kab["r2_count"],
            "r3_count": kab["r3_count"],
            "latitude": kab["latitude"],
            "longitude": kab["longitude"]
        }
    }
    output_features.append(out_feat)

geojson_payload = {
    "type": "FeatureCollection",
    "name": "Batas_Administrasi_35_Kabupaten_Kota_Jawa_Tengah",
    "crs": {
        "type": "name",
        "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" }
    },
    "features": output_features
}

# 1. Save data/jateng_kabupaten.js
js_code = f"/**\n * Batas Wilayah Administratif Resmi 35 Kabupaten/Kota Jawa Tengah\n * Sumber Geometri: GeoBoundaries IDN ADM2 Authoritative\n */\nwindow.JATENG_KABUPATEN = {json.dumps(geojson_payload, ensure_ascii=False, indent=2)};\n"
with open("data/jateng_kabupaten.js", "w", encoding="utf-8") as f:
    f.write(js_code)
print(f"[OK] Successfully wrote data/jateng_kabupaten.js with {len(output_features)} authentic boundaries.")

# 2. Save gis_exports/jateng_35_kabupaten_agregat.geojson
with open("gis_exports/jateng_35_kabupaten_agregat.geojson", "w", encoding="utf-8") as f:
    json.dump(geojson_payload, f, ensure_ascii=False, indent=2)
print("[OK] Successfully updated gis_exports/jateng_35_kabupaten_agregat.geojson")
