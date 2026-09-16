import os
import sys

def test_app_integration():
    print("Testing App Integration module...")
    app_file = "js/app.js"
    if not os.path.exists(app_file):
        print(f"FAIL: {app_file} does not exist.")
        sys.exit(1)
        
    with open(app_file, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Check key video embeds for all 3 Ring 1 traditions
    assert "5XteEv2MU_g" in content, "Missing Kentrung YouTube ID 5XteEv2MU_g"
    assert "Ixm0NVVzniM" in content, "Missing Maca Babad YouTube ID Ixm0NVVzniM"
    assert "Q_JAmcKSFB0" in content, "Missing Wayang Othok Obrol YouTube ID Q_JAmcKSFB0"
    
    # Check tab switching logic
    assert "openDrawer" in content, "Missing openDrawer function"
    assert "renderTranscript" in content, "Missing renderTranscript function"
    assert "renderAnalyticsModal" in content, "Missing renderAnalyticsModal function"
    assert "renderMethodologyModal" in content, "Missing renderMethodologyModal function"
    assert "applyFilters" in content, "Missing applyFilters function"
    
    # Check GIS export bindings
    assert "exportGeoJSON" in content, "Missing exportGeoJSON call"
    assert "exportCSV" in content, "Missing exportCSV call"
    
    print("ALL APP INTEGRATION CHECKS PASSED!")

if __name__ == "__main__":
    test_app_integration()
