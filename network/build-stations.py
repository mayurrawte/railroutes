#!/usr/bin/env python3
"""Overpass station nodes -> compact Station[] JSON for railroute-ts.

Usage: build-stations.py RAW.json OUT.json CODE_TAG [CODE_REGEX]
Keeps nodes that have CODE_TAG and a name; prefers name:en when present so
codes resolve to something an English-speaking caller can type. Dedupes by code
(first wins). CODE_REGEX (optional) drops refs that are not station codes
(e.g. '^[A-Z]{3,4}$' keeps Amtrak/VIA codes, drops platform numbers).
When CODE_TAG is 'name:en' the English name doubles as the code (China).
"""
import json, re, sys
RAW, OUT, TAG = sys.argv[1:4]
RX = re.compile(sys.argv[4]) if len(sys.argv) > 4 else None
d = json.load(open(RAW))
out, seen = [], set()
for n in d["elements"]:
    t = n.get("tags", {})
    code = (t.get(TAG) or "").strip()
    name = (t.get("name:en") or t.get("name") or "").strip()
    if not code or not name or code in seen: continue
    if RX and not RX.match(code): continue
    # heavy rail only: drop metro / light rail / tram / monorail stops
    if t.get("station") in ("subway", "light_rail", "monorail", "tram", "funicular") or \
       t.get("subway") == "yes" or t.get("light_rail") == "yes" or t.get("tram") == "yes" or t.get("train") == "no":
        continue
    if "lon" not in n:  # ways/relations fetched with `out center;`
        if not n.get("center"): continue
        n = {**n, "lon": n["center"]["lon"], "lat": n["center"]["lat"]}
    seen.add(code)
    out.append({"code": code, "name": name, "coord": [round(n["lon"], 4), round(n["lat"], 4)]})
out.sort(key=lambda s: s["code"])
json.dump(out, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
print(f"{len(out)} stations -> {OUT}")
