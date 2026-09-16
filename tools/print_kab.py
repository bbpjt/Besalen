import json, re
with open("data/sastra_data.js", "r", encoding="utf-8") as f:
    s_content = f.read()
s_data = json.loads(re.search(r"window\.SASTRA_DATA\s*=\s*(\{.*?\});", s_content, re.DOTALL).group(1))
print("Sample kab object:", s_data["kabupaten"][0])
