import os
import sys
import re
import json

def test_boundaries():
    print("Testing 35 Kabupaten/Kota boundaries GeoJSON...")
    file_path = "data/jateng_kabupaten.js"
    
    if not os.path.exists(file_path):
        print(f"FAIL: {file_path} does not exist.")
        sys.exit(1)
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    match = re.search(r"window\.JATENG_KABUPATEN\s*=\s*(\{.*?\});", content, re.DOTALL)
    if not match:
        print("FAIL: window.JATENG_KABUPATEN not found.")
        sys.exit(1)
        
    geojson = json.loads(match.group(1))
    assert geojson.get("type") == "FeatureCollection", "Must be FeatureCollection"
    
    features = geojson.get("features", [])
    print(f"Found {len(features)} boundary features.")
    assert len(features) == 35, f"Expected 35 regencies/cities, got {len(features)}"
    
    for feat in features:
        geom = feat.get("geometry", {})
        props = feat.get("properties", {})
        assert geom.get("type") in ["Polygon", "MultiPolygon"], f"Invalid geometry type for {props.get('nama')}"
        assert props.get("kode_wilayah"), f"Missing kode_wilayah for {props.get('nama')}"
        assert props.get("nama"), "Missing nama"
        assert props.get("karesidenan"), f"Missing karesidenan for {props.get('nama')}"
        assert props.get("zona_ekologi"), f"Missing zona_ekologi for {props.get('nama')}"
        assert "total_sastra" in props, f"Missing total_sastra for {props.get('nama')}"
        
    print("ALL BOUNDARIES CHECKS PASSED!")

if __name__ == "__main__":
    test_boundaries()
