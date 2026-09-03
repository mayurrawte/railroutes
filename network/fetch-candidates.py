#!/usr/bin/env python3
"""Fetch *candidate* gap-fillers for a region: railway=rail ways with neither
`usage` nor `service` (OSM mainline that nobody tagged). build-network.py keeps a
candidate chain only when it closes a gap between two mainline components.
Usage: fetch-candidates.py regions/<name>.json  -> <name>-candidates-raw.json"""
import json, sys, time, pathlib, urllib.request, urllib.parse
cfg = json.load(open(sys.argv[1])); name = cfg["name"]
MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://lz4.overpass-api.de/api/interpreter"]
def query(q, out, tries=6):
    if out.exists() and b'"elements"' in out.read_bytes()[:500]: print(f"SKIP {out}"); return
    for attempt in range(1, tries + 1):
        url = MIRRORS[(attempt - 1) % len(MIRRORS)]; print(f"FETCH {out} (attempt {attempt}, {url.split('/')[2]})", flush=True)
        try:
            req = urllib.request.Request(url, data=urllib.parse.urlencode({"data": q}).encode(), headers={"User-Agent": "railroutes-pipeline"})
            body = urllib.request.urlopen(req, timeout=1000).read(); d = json.loads(body)
            if "elements" in d: out.write_bytes(body); print(f"  OK {len(d['elements'])} elements", flush=True); return
        except Exception as e: print(f"  failed: {e}", flush=True)
        time.sleep(30)
    sys.exit("giving up")
FILTER = '["railway"="rail"][!"usage"][!"service"]'
tdir = pathlib.Path(f"{name}-cand-tiles"); tdir.mkdir(exist_ok=True)
jobs = [(None, t) for t in cfg.get("tiles", [])] + [(iso, t) for iso, ts in (cfg.get("areas") or {}).items() for t in (ts or [None])]
for iso, t in jobs:
    bbox = ",".join(str(x) for x in t) if t else None
    hdr = "[out:json][timeout:900]" + (f"[bbox:{bbox}]" if bbox else "")
    q = f'{hdr};area["ISO3166-1"="{iso}"]["admin_level"="2"]->.a;way{FILTER}(area.a);out geom;' if iso else f'{hdr};way{FILTER};out geom;'
    tag = (f"{iso}_" if iso else "") + (bbox.replace(",", "_").replace("-", "m") if bbox else "all")
    query(q, tdir / f"tile_{tag}.json"); time.sleep(20)
seen, els = set(), []
for f in sorted(tdir.glob("tile_*.json")):
    for el in json.load(open(f))["elements"]:
        if el["id"] not in seen: seen.add(el["id"]); els.append(el)
json.dump({"elements": els}, open(f"{name}-candidates-raw.json", "w")); print(f"merged {len(els)} candidate ways\nDONE")
