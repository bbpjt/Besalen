import os
import sys
import re
import json

def test_data_integrity():
    print("Testing data integrity...")
    data_file = "data/sastra_data.js"
    transkrip_file = "data/transkrip_data.js"
    
    if not os.path.exists(data_file):
        print(f"FAIL: {data_file} does not exist.")
        sys.exit(1)
        
    if not os.path.exists(transkrip_file):
        print(f"FAIL: {transkrip_file} does not exist.")
        sys.exit(1)
        
    with open(data_file, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Extract window.SASTRA_DATA JSON payload
    match = re.search(r"window\.SASTRA_DATA\s*=\s*(\{.*?\});", content, re.DOTALL)
    if not match:
        print("FAIL: window.SASTRA_DATA not found in data/sastra_data.js")
        sys.exit(1)
        
    data = json.loads(match.group(1))
    
    # Verify counts
    r1 = data.get("ring1", [])
    r2 = data.get("ring2", [])
    r3 = data.get("ring3", [])
    r4 = data.get("ring4", [])
    kab = data.get("kabupaten", [])
    
    print(f"Counts: Ring1={len(r1)}, Ring2={len(r2)}, Ring3={len(r3)}, Ring4={len(r4)}, Kab={len(kab)}")
    
    assert len(r1) == 3, f"Expected 3 Ring 1 items, got {len(r1)}"
    assert len(r2) == 44, f"Expected 44 Ring 2 items, got {len(r2)}"
    assert len(r3) == 44, f"Expected 44 Ring 3 items, got {len(r3)}"
    assert len(r4) == 40, f"Expected 41 Ring 4 items, got {len(r4)}"
    assert len(kab) == 35, f"Expected 35 Kabupaten, got {len(kab)}"
    
    # Check coordinates for spatial items (Ring 1, 2, 3)
    for ring_name, ring_items in [("Ring 1", r1), ("Ring 2", r2), ("Ring 3", r3)]:
        for item in ring_items:
            lat = item.get("latitude")
            lng = item.get("longitude")
            assert lat is not None and lng is not None, f"Missing coords in {ring_name}: {item.get('nama')}"
            assert -8.5 <= lat <= -6.3, f"Invalid latitude {lat} for {item.get('nama')}"
            assert 108.5 <= lng <= 111.8, f"Invalid longitude {lng} for {item.get('nama')}"
            
    # Check media fields for Ring 1
    for item in r1:
        assert item.get("youtube_url") or item.get("media_files"), f"Missing multimedia in Ring 1 item: {item.get('nama')}"
        
    print("ALL DATA INTEGRITY CHECKS PASSED!")

if __name__ == "__main__":
    test_data_integrity()
