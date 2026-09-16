import os
import sys
import re
import json

def verify_all():
    print("=" * 60)
    print("VERIFIKASI MENYELURUH: ATLAS SASTRA LISAN JAWA TENGAH")
    print("=" * 60)
    
    errors = []
    
    # 1. File existence
    required_files = [
        "index.html",
        "css/style.css",
        "js/app.js",
        "js/map-layers.js",
        "js/export-gis.js",
        "data/sastra_data.js",
        "data/jateng_kabupaten.js",
        "data/transkrip_data.js",
        "kentrung-Cover.jpg"
    ]
    for rf in required_files:
        if os.path.exists(rf):
            print(f"[OK] File exists: {rf}")
        else:
            errors.append(f"Missing file: {rf}")
            
    # 2. Check Sastra Data content
    with open("data/sastra_data.js", "r", encoding="utf-8") as f:
        content = f.read()
    match = re.search(r"window\.SASTRA_DATA\s*=\s*(\{.*?\});", content, re.DOTALL)
    if not match:
        errors.append("window.SASTRA_DATA could not be parsed from data/sastra_data.js")
    else:
        data = json.loads(match.group(1))
        r1 = data.get("ring1", [])
        r2 = data.get("ring2", [])
        r3 = data.get("ring3", [])
        r4 = data.get("ring4", [])
        kab = data.get("kabupaten", [])
        
        print(f"[OK] Ring 1 (Terverifikasi): {len(r1)} / 3")
        print(f"[OK] Ring 2 (Terverifikasi Teks): {len(r2)} / 44")
        print(f"[OK] Ring 3 (Perlu Verifikasi): {len(r3)} / 44")
        print(f"[OK] Ring 4 (Eksklusi Non-Sastra): {len(r4)} / 40")
        print(f"[OK] 35 Kabupaten/Kota: {len(kab)} / 35")
        
        if len(r1) != 3: errors.append(f"Ring 1 count mismatch: {len(r1)}")
        if len(r2) != 44: errors.append(f"Ring 2 count mismatch: {len(r2)}")
        if len(r3) != 44: errors.append(f"Ring 3 count mismatch: {len(r3)}")
        if len(r4) != 40: errors.append(f"Ring 4 count mismatch: {len(r4)}")
        if len(kab) != 35: errors.append(f"Kabupaten count mismatch: {len(kab)}")
        
        # Check coordinates
        for item in r1 + r2 + r3:
            lat = item.get("latitude")
            lng = item.get("longitude")
            if not (-8.5 <= lat <= -6.3 and 108.5 <= lng <= 111.8):
                errors.append(f"Coordinate out of Central Java bounds for {item.get('nama')}: ({lat}, {lng})")
                
    # 3. Check Boundaries
    with open("data/jateng_kabupaten.js", "r", encoding="utf-8") as f:
        b_content = f.read()
    b_match = re.search(r"window\.JATENG_KABUPATEN\s*=\s*(\{.*?\});", b_content, re.DOTALL)
    if not b_match:
        errors.append("window.JATENG_KABUPATEN could not be parsed")
    else:
        b_data = json.loads(b_match.group(1))
        features = b_data.get("features", [])
        print(f"[OK] Boundary Features: {len(features)} / 35")
        if len(features) != 35:
            errors.append(f"Boundary feature count mismatch: {len(features)}")
            
    # 4. Check Multimedia Ring 1 Assets
    banyumas_photos = os.listdir("media/banyumas") if os.path.exists("media/banyumas") else []
    wonosobo_photos = os.listdir("media/wonosobo") if os.path.exists("media/wonosobo") else []
    print(f"[OK] Banyumas extracted photos: {len(banyumas_photos)}")
    print(f"[OK] Wonosobo extracted photos: {len(wonosobo_photos)}")
    if len(banyumas_photos) < 10:
        errors.append("Fewer than 10 Banyumas documentation photos extracted")
    if len(wonosobo_photos) < 5:
        errors.append("Fewer than 5 Wonosobo documentation photos extracted")
        
    # Check YouTube embeds mapping in app.js
    with open("js/app.js", "r", encoding="utf-8") as f:
        app_js = f.read()
    for ytid in ["5XteEv2MU_g", "Ixm0NVVzniM", "Q_JAmcKSFB0"]:
        if ytid in app_js:
            print(f"[OK] Official YouTube ID mapped: {ytid}")
        else:
            errors.append(f"YouTube ID not mapped in app.js: {ytid}")
            
    # 5. Check GIS Exporter
    with open("js/export-gis.js", "r", encoding="utf-8") as f:
        gis_js = f.read()
    for method in ["exportGeoJSON", "exportCSV", "exportBoundaryGeoJSON", "POINT("]:
        if method in gis_js:
            print(f"[OK] GIS Exporter has feature: {method}")
        else:
            errors.append(f"GIS Exporter missing feature: {method}")
            
    print("=" * 60)
    if errors:
        print("VERIFIKASI GAGAL DENGAN KESALAHAN:")
        for e in errors:
            print(f"  [X] {e}")
        sys.exit(1)
    else:
        print("SEMUA SISTEM TERVERIFIKASI 100% SUKSES!")
        print("=" * 60)

if __name__ == "__main__":
    verify_all()
