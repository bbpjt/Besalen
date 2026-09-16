import os
import json
import urllib.request
import time

def download_kentrung_photos():
    os.makedirs("media/kentrung", exist_ok=True)
    with open("tools/kentrung_files.json", "r") as f:
        file_map = json.load(f)
        
    print(f"Starting download of {len(file_map)} Kentrung photos...")
    downloaded = []
    
    # Download all photos from Google Drive
    items = list(file_map.items())
    for idx, (fname, file_id) in enumerate(items):
        clean_name = fname.replace("x22", "").lower()
        if not (clean_name.endswith(".jpg") or clean_name.endswith(".png")):
            clean_name += ".jpg"
        dest_path = os.path.join("media/kentrung", f"kentrung_{idx+1:02d}_{clean_name}")
        
        if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
            downloaded.append(dest_path.replace("\\", "/"))
            continue
            
        url = f"https://lh3.googleusercontent.com/d/{file_id}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as res:
                content = res.read()
                if len(content) > 1000:
                    with open(dest_path, "wb") as out:
                        out.write(content)
                    print(f"[{idx+1}/{len(items)}] Downloaded: {dest_path} ({len(content)//1024} KB)")
                    downloaded.append(dest_path.replace("\\", "/"))
            time.sleep(0.08)
        except Exception as e:
            print(f"Error downloading {fname}: {e}")
            
    print(f"Total downloaded Kentrung photos: {len(downloaded)}")
    
    # Update data/sastra_data.js gallery_images for Kentrung Blora
    if os.path.exists("data/sastra_data.js"):
        with open("data/sastra_data.js", "r", encoding="utf-8") as f:
            js_content = f.read()
        match = re.search(r"window\.SASTRA_DATA\s*=\s*(\{.*?\});", js_content, re.DOTALL)
        if match:
            sastra_data = json.loads(match.group(1))
            for item in sastra_data.get("ring1", []):
                if "kentrung" in item.get("nama", "").lower():
                    item["gallery_images"] = downloaded
            new_js = f"/**\n * Peta Sastra Lisan di Jawa Tengah\n * Balai Bahasa Provinsi Jawa Tengah\n */\nwindow.SASTRA_DATA = {json.dumps(sastra_data, ensure_ascii=False, indent=2)};\n"
            with open("data/sastra_data.js", "w", encoding="utf-8") as f:
                f.write(new_js)
            print("Successfully updated data/sastra_data.js with Kentrung gallery images.")
            
    return downloaded

if __name__ == "__main__":
    import re
    download_kentrung_photos()
