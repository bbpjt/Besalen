import os
import zipfile

def create_package():
    zip_filename = "Atlas_Sastra_Lisan_Jateng_Siap_Pakai.zip"
    print(f"Creating package: {zip_filename}...")
    
    include_dirs = ["css", "js", "data", "media", "gis_exports"]
    include_files = [
        "index.html",
        "kentrung-Cover.jpg",
        "README.md"
    ]
    
    total_files = 0
    with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in include_files:
            if os.path.exists(f):
                zf.write(f, f)
                total_files += 1
                
        for d in include_dirs:
            if os.path.exists(d):
                for root, dirs, files in os.walk(d):
                    for file in files:
                        if file.endswith((".pyc", ".DS_Store", ".tmp")):
                            continue
                        file_path = os.path.join(root, file)
                        rel_path = os.path.relpath(file_path, ".")
                        zf.write(file_path, rel_path)
                        total_files += 1
                        
    size_mb = os.path.getsize(zip_filename) / (1024 * 1024)
    print(f"[OK] Package created: {zip_filename} ({total_files} files, {size_mb:.2f} MB)")

if __name__ == "__main__":
    create_package()
