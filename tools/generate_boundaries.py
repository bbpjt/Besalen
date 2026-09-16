import json
import math
import os
import re

def generate_boundaries():
    print("Generating 35 Kabupaten/Kota boundaries GeoJSON...")
    with open("data/sastra_data.js", "r", encoding="utf-8") as f:
        content = f.read()
        
    match = re.search(r"window\.SASTRA_DATA\s*=\s*(\{.*?\});", content, re.DOTALL)
    if not match:
        raise ValueError("Could not parse window.SASTRA_DATA")
    data = json.loads(match.group(1))
    kabupaten_list = data["kabupaten"]
    
    features = []
    
    for idx, kab in enumerate(kabupaten_list):
        nama = kab["nama"]
        lat = kab["latitude"]
        lng = kab["longitude"]
        is_city = "Kota" in nama
        
        # Determine radius and deformation based on regency geography
        if is_city:
            rad = 0.07
            aspect = 1.0
        else:
            rad = 0.22
            aspect = 1.25 if any(w in nama for w in ["Cilacap", "Grobogan", "Banyumas", "Brebes"]) else 1.05
            
        # Add characteristic stretch for specific peninsulas / valleys
        if "Jepara" in nama:
            # Stretches north into Java sea
            angles = [i * (2 * math.pi / 16) for i in range(16)]
            coords = []
            for a in angles:
                r = rad * (1.3 if math.sin(a) > 0 else 0.8) # North is positive sin in cartesian if lat increases
                x = lng + (r * 1.1) * math.cos(a)
                y = lat + r * math.sin(a)
                coords.append([round(x, 5), round(y, 5)])
            coords.append(coords[0])
        elif "Cilacap" in nama:
            # Long east-west and Segara Anakan lagoon
            angles = [i * (2 * math.pi / 16) for i in range(16)]
            coords = []
            for a in angles:
                x = lng + (rad * 1.6) * math.cos(a)
                y = lat + (rad * 0.9) * math.sin(a)
                coords.append([round(x, 5), round(y, 5)])
            coords.append(coords[0])
        else:
            angles = [i * (2 * math.pi / 14) for i in range(14)]
            # Add subtle deterministic shape variation based on hash of name
            h = sum(ord(c) for c in nama)
            coords = []
            for i, a in enumerate(angles):
                r_var = rad * (0.88 + 0.24 * math.sin(3 * a + h % 7))
                x = lng + (r_var * aspect) * math.cos(a)
                y = lat + r_var * math.sin(a)
                coords.append([round(x, 5), round(y, 5)])
            coords.append(coords[0]) # close polygon
            
        feature = {
            "type": "Feature",
            "id": kab["kode_wilayah"],
            "geometry": {
                "type": "Polygon",
                "coordinates": [coords]
            },
            "properties": {
                "kode_wilayah": kab["kode_wilayah"],
                "nama": nama,
                "karesidenan": kab["karesidenan"],
                "zona_ekologi": kab["zona_ekologi"],
                "r1_count": kab["r1_count"],
                "r2_count": kab["r2_count"],
                "r3_count": kab["r3_count"],
                "r4_count": kab["r4_count"],
                "total_sastra": kab["total_potensi"],
                "status_keterwakilan": kab["status_keterwakilan"],
                "rencana_tindak_lanjut": kab["rencana_tindak_lanjut"],
                "centroid_lat": lat,
                "centroid_lng": lng
            }
        }
        features.append(feature)
        
    geojson = {
        "type": "FeatureCollection",
        "name": "Batas_Administratif_35_Kabupaten_Kota_Jawa_Tengah",
        "crs": {
            "type": "name",
            "properties": {
                "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
            }
        },
        "features": features
    }
    
    with open("data/jateng_kabupaten.js", "w", encoding="utf-8") as f:
        f.write("/**\n * Batas Spasial 35 Kabupaten/Kota Jawa Tengah & Agregat Sastra Lisan (2026)\n */\n")
        f.write("window.JATENG_KABUPATEN = ")
        f.write(json.dumps(geojson, indent=2, ensure_ascii=False))
        f.write(";\n")
        
    print(f"Generated data/jateng_kabupaten.js with {len(features)} regency polygons!")

if __name__ == "__main__":
    generate_boundaries()
