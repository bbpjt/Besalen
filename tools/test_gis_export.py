import os
import sys
import re

def test_gis_export():
    print("Testing GIS Exporter module...")
    export_file = "js/export-gis.js"
    if not os.path.exists(export_file):
        print(f"FAIL: {export_file} does not exist.")
        sys.exit(1)
        
    with open(export_file, "r", encoding="utf-8") as f:
        content = f.read()
        
    assert "buildGeoJSON" in content, "Missing buildGeoJSON function"
    assert "buildCSV" in content, "Missing buildCSV function"
    assert "buildBoundaryGeoJSON" in content, "Missing buildBoundaryGeoJSON function"
    assert "downloadFile" in content, "Missing downloadFile trigger"
    assert "POINT(" in content, "Missing WKT POINT generation"
    assert "window.GISExporter" in content, "Missing window.GISExporter export"
    
    print("ALL GIS EXPORT CHECKS PASSED!")

if __name__ == "__main__":
    test_gis_export()
