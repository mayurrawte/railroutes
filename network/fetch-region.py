#!/usr/bin/env python3
"""Fetch a region's mainline rail (and stations / train ferries) from Overpass.

Usage: fetch-region.py regions/<name>.json
Writes <name>-tiles/tile_*.json, <name>-raw.json (ways deduped by id),
<name>-stations-raw.json and, if enabled, <name>-ferries.json.
Polite: sequential, retries, 30 s between tiles. Re-runs skip finished tiles.
"""
import json, sys, time, urllib.request, urllib.parse, pathlib

MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter",
           "https://lz4.overpass-api.de/api/interpreter"]
cfg = json.load(open(sys.argv[1]))
name = cfg["name"]
if cfg.get("source") == "narn":
    import subprocess; sys.exit(subprocess.call([sys.executable, "fetch-narn.py", sys.argv[1]]))
tiles_dir = pathlib.Path(f"{name}-tiles"); tiles_dir.mkdir(exist_ok=True)

def query(q, out, tries=6):
    if out.exists():
        try:
            if "elements" in json.load(open(out)): print(f"SKIP {out}"); return
        except Exception: pass
    for attempt in range(1, tries + 1):
        url = MIRRORS[(attempt - 1) % len(MIRRORS)]
        print(f"FETCH {out} (attempt {attempt}, {url.split('/')[2]})", flush=True)
        try:
            req = urllib.request.Request(url, data=urllib.parse.urlencode({"data": q}).encode(),
                                         headers={"User-Agent": "railroutes-pipeline (github.com/mayurrawte/railroutes)"})
            body = urllib.request.urlopen(req, timeout=1000).read()
            d = json.loads(body)
            if "elements" in d:
                out.write_bytes(body); print(f"  OK {len(body)/1e6:.1f} MB, {len(d['elements'])} elements"); return
        except Exception as e:
            print(f"  failed: {e}")
        time.sleep(60)
    sys.exit(f"giving up on {out}")

for t in cfg["tiles"]:
    bbox = ",".join(str(x) for x in t)
    out = tiles_dir / ("tile_" + bbox.replace(",", "_").replace("-", "m") + ".json")
    query(f'[out:json][timeout:900][bbox:{bbox}];way{cfg["way_filter"]};out geom;', out)
    time.sleep(30)

# merge tiles, dedupe ways by id (a way crossing a tile edge appears twice)
seen, elements = set(), []
for f in sorted(tiles_dir.glob("tile_*.json")):
    for el in json.load(open(f))["elements"]:
        if el["id"] not in seen:
            seen.add(el["id"]); elements.append(el)
json.dump({"elements": elements}, open(f"{name}-raw.json", "w"))
print(f"merged {len(elements)} ways -> {name}-raw.json")

# stations (one query for the whole region bbox — points are small)
lat0 = min(t[0] for t in cfg["tiles"]); lon0 = min(t[1] for t in cfg["tiles"])
lat1 = max(t[2] for t in cfg["tiles"]); lon1 = max(t[3] for t in cfg["tiles"])
st = cfg.get("stations")
if st:
    flt = st.get("extra_filter") or f'["railway"="station"]["{st["code_tag"]}"]'
    query(f'[out:json][timeout:600][bbox:{lat0},{lon0},{lat1},{lon1}];node{flt};out;',
          pathlib.Path(f"{name}-stations-raw.json"))
if cfg.get("ferries"):
    query(f'[out:json][timeout:600][bbox:{lat0},{lon0},{lat1},{lon1}];way["route"="ferry"]["railway"="ferry"];out geom;',
          pathlib.Path(f"{name}-ferries.json"))
print("DONE")
