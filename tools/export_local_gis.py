import json
import os
import re

def export_local():
    os.makedirs("gis_exports", exist_ok=True)
    
    with open("data/sastra_data.js", "r", encoding="utf-8") as f:
        content = f.read()
    match = re.search(r"window\.SASTRA_DATA\s*=\s*(\{.*?\});", content, re.DOTALL)
    data = json.loads(match.group(1))
    
    # 1. Point GeoJSON
    items = data["ring1"] + data["ring2"] + data["ring3"]
    features = []
    for item in items:
        feat = {
            "type": "Feature",
            "id": item["id"],
            "geometry": {
                "type": "Point",
                "coordinates": [float(item["longitude"]), float(item["latitude"])]
            },
            "properties": {
                "id": item["id"],
                "nama": item["nama"],
                "ring_kategori": item["ring"],
                "ring_level": item["ring_level"],
                "kabupaten": item["kabupaten"],
                "karesidenan": item["karesidenan"],
                "zona_ekologi": item["zona_ekologi"],
                "maestro": item.get("maestro", ""),
                "formula_teks": item.get("unsur_teks") or item.get("bentuk_tuturan", ""),
                "ringkasan_ilmiah": item.get("ringkasan_ilmiah") or item.get("catatan_kritis", ""),
                "sumber_ilmiah": item.get("sumber_ilmiah") or item.get("sumber_ilmiah_1") or item.get("sumber_referensi", ""),
                "youtube_url": item.get("youtube_url", "")
            }
        }
        features.append(feat)
        
    point_geojson = {
        "type": "FeatureCollection",
        "name": "Peta_Sastra_Lisan_Jawa_Tengah_2026",
        "crs": {
            "type": "name",
            "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" }
        },
        "features": features
    }
    with open("gis_exports/sastra_lisan_jateng.geojson", "w", encoding="utf-8") as f:
        json.dump(point_geojson, f, indent=2, ensure_ascii=False)
    print("Exported gis_exports/sastra_lisan_jateng.geojson (91 points)")
    
    # 2. Coordinates CSV with WKT
    with open("gis_exports/sastra_lisan_jateng_coords.csv", "w", encoding="utf-8") as f:
        headers = ["id", "nama", "ring_kategori", "ring_level", "kabupaten", "karesidenan", "zona_ekologi", "latitude", "longitude", "wkt_geom", "youtube_url"]
        f.write(",".join(headers) + "\n")
        for item in items:
            lat = float(item["latitude"])
            lng = float(item["longitude"])
            wkt = f"POINT({lng} {lat})"
            row = [
                f'"{item["id"]}"',
                f'"{item["nama"]}"',
                f'"{item["ring"]}"',
                str(item["ring_level"]),
                f'"{item["kabupaten"]}"',
                f'"{item["karesidenan"]}"',
                f'"{item["zona_ekologi"]}"',
                str(lat),
                str(lng),
                f'"{wkt}"',
                f'"{item.get("youtube_url", "")}"'
            ]
            f.write(",".join(row) + "\n")
    print("Exported gis_exports/sastra_lisan_jateng_coords.csv (91 rows)")
    
    # 3. Polygon GeoJSON
    with open("data/jateng_kabupaten.js", "r", encoding="utf-8") as f:
        b_content = f.read()
    b_match = re.search(r"window\.JATENG_KABUPATEN\s*=\s*(\{.*?\});", b_content, re.DOTALL)
    b_data = json.loads(b_match.group(1))
    with open("gis_exports/jateng_35_kabupaten_agregat.geojson", "w", encoding="utf-8") as f:
        json.dump(b_data, f, indent=2, ensure_ascii=False)
    print("Exported gis_exports/jateng_35_kabupaten_agregat.geojson (35 polygons)")

if __name__ == "__main__":
    export_local()
