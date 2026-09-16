import os
import sys

def test_map_layers():
    print("Testing Leaflet MapLayers controller module...")
    map_file = "js/map-layers.js"
    if not os.path.exists(map_file):
        print(f"FAIL: {map_file} does not exist.")
        sys.exit(1)
        
    with open(map_file, "r", encoding="utf-8") as f:
        content = f.read()
        
    assert "window.MapLayers" in content, "Missing window.MapLayers export"
    assert "initMap" in content, "Missing initMap method"
    assert "renderMarkers" in content, "Missing renderMarkers method"
    assert "toggleBoundaries" in content, "Missing toggleBoundaries method"
    assert "flyToLocation" in content, "Missing flyToLocation method"
    assert "pin-r1" in content and "pin-r2" in content and "pin-r3" in content, "Missing marker class definitions"
    assert "cartodb" in content.lower() or "openstreetmap" in content.lower(), "Missing base tile configuration"
    
    print("ALL MAP LAYERS CHECKS PASSED!")

if __name__ == "__main__":
    test_map_layers()
