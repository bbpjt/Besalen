import urllib.request
import re

url = "https://drive.google.com/drive/folders/18w4WNaHh6PTtLBR11E406lFkM9far-rF?usp=sharing"
req = urllib.request.Request(url, headers={
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
})
html = urllib.request.urlopen(req, timeout=10).read().decode("utf-8", errors="ignore")

# Let's search for "kentrung" or file extensions in the HTML
matches = re.findall(r'[a-zA-Z0-9_\-\.\s]{3,50}\.(?:jpg|jpeg|png|mp4|docx|pdf)', html, re.IGNORECASE)
print("Filename matches in HTML:", set(matches))
