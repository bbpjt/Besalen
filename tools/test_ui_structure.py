import os
import sys

def test_ui_structure():
    print("Testing HTML and CSS UI structure...")
    index_file = "index.html"
    css_file = "css/style.css"
    
    if not os.path.exists(index_file):
        print(f"FAIL: {index_file} does not exist.")
        sys.exit(1)
        
    if not os.path.exists(css_file):
        print(f"FAIL: {css_file} does not exist.")
        sys.exit(1)
        
    with open(index_file, "r", encoding="utf-8") as f:
        html = f.read()
        
    required_ids = [
        "map", "stat-r1", "stat-r2", "stat-r3", "stat-kab",
        "btn-export-gis", "btn-analytics", "btn-methodology",
        "floating-panel", "search-input", "filter-r1", "filter-r2", "filter-r3",
        "select-karesidenan", "select-ekologi", "toggle-boundaries",
        "detail-drawer", "drawer-close-btn", "drawer-title", "drawer-badge",
        "tab-profil", "tab-tuturan", "tab-media", "tab-transkrip", "tab-pustaka",
        "modal-export", "modal-analytics", "modal-methodology"
    ]
    
    for rid in required_ids:
        assert f'id="{rid}"' in html or f"id='{rid}'" in html, f"Missing required element id: {rid}"
        
    # Check script references
    required_scripts = [
        "data/sastra_data.js", "data/jateng_kabupaten.js", "data/transkrip_data.js",
        "js/export-gis.js", "js/map-layers.js", "js/app.js"
    ]
    for script in required_scripts:
        assert script in html, f"Missing script reference: {script}"
        
    with open(css_file, "r", encoding="utf-8") as f:
        css = f.read()
        
    assert "box-shadow" in css and "0px #000" in css, "Missing Neobrutalist hard shadow in CSS"
    assert "border" in css, "Missing border definitions in CSS"
    
    print("ALL UI STRUCTURE CHECKS PASSED!")

if __name__ == "__main__":
    test_ui_structure()
