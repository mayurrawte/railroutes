#!/usr/bin/env python3
"""Overpass station nodes -> compact Station[] JSON for railroute-ts.

Usage: build-stations.py RAW.json OUT.json CODE_TAG
Keeps nodes that have CODE_TAG and a name; prefers name:en when present so
codes resolve to something an English-speaking caller can type. Dedupes by code
(first wins).
"""
import json, sys
RAW, OUT, TAG = sys.argv[1:4]
d = json.load(open(RAW))
out, seen = [], set()
for n in d["elements"]:
    t = n.get("tags", {})
    code = (t.get(TAG) or "").strip()
    name = (t.get("name:en") or t.get("name") or "").strip()
    if not code or not name or code in seen: continue
    seen.add(code)
    out.append({"code": code, "name": name, "coord": [round(n["lon"], 4), round(n["lat"], 4)]})
out.sort(key=lambda s: s["code"])
json.dump(out, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
print(f"{len(out)} stations -> {OUT}")
