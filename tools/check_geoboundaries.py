import urllib.request
import json

url = "https://www.geoboundaries.org/api/current/gbOpen/IDN/ADM2/"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=10) as res:
    meta = json.loads(res.read().decode('utf-8'))
    print("Full geojson:", meta.get("gjDownloadURL"))
    print("Simplified geojson:", meta.get("simplifiedGeometryGeoJSON"))
