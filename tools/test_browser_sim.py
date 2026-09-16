import os
import re

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

scripts = re.findall(r'<script src="([^"]+)"', html)
print("Scripts found in index.html:")
for s in scripts:
    print(" -", s)
