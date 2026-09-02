#!/usr/bin/env python3
"""Fetch the FRA/BTS North American Rail Network (NARN) main sub-network and
convert it to the raw-ways shape build-network.py expects.

Usage: fetch-narn.py regions/north-america.json
Writes <name>-raw.json. NARN arcs carry their own topology (FRFRANODE /
TOFRANODE), so junctions are exact; interior vertices get synthetic node ids.
NET='F' arcs (rail ferries) are tagged ferry=yes. All of NARN is standard gauge.
"""
import json, sys, time, urllib.request, urllib.parse

cfg = json.load(open(sys.argv[1]))
name, svc, where = cfg["name"], cfg["service"], cfg["where"]
FIELDS = "OBJECTID,FRAARCID,FRFRANODE,TOFRANODE,NET,PASSNGR,TRACKS,COUNTRY,KM,STRACNET"
PAGE = 2000

def get(params, tries=4):
    url = f"{svc}/query?{urllib.parse.urlencode(params)}"
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "railroutes-pipeline (github.com/mayurrawte/railroutes)"})
            return json.loads(urllib.request.urlopen(req, timeout=300).read())
        except Exception as e:
            print(f"  retry {attempt+1}: {e}", flush=True); time.sleep(15)
    sys.exit("NARN fetch failed")

total = get({"where": where, "returnCountOnly": "true", "f": "json"})["count"]
print(f"NARN arcs matching {where}: {total}", flush=True)

elements, offset = [], 0
while offset < total:
    d = get({"where": where, "outFields": FIELDS, "returnGeometry": "true", "outSR": "4326",
             "orderByFields": "OBJECTID", "resultOffset": offset, "resultRecordCount": PAGE, "f": "geojson"})
    feats = d.get("features", [])
    if not feats: break
    for f in feats:
        p = f["properties"]; g = f["geometry"]
        parts = [g["coordinates"]] if g["type"] == "LineString" else list(g["coordinates"])
        # stitch contiguous MultiLineString parts; keep the rest as separate pieces
        merged = [parts[0]]
        for part in parts[1:]:
            if merged[-1][-1] == part[0]: merged[-1] = merged[-1] + part[1:]
            elif merged[-1][-1] == part[-1]: merged[-1] = merged[-1] + part[::-1][1:]
            else: merged.append(part)
        arc = p["FRAARCID"]
        for k, coords in enumerate(merged):
            if len(coords) < 2: continue
            nodes = [f"n{p['FRFRANODE']}" if k == 0 else f"a{arc}_{k}s"] + \
                    [f"a{arc}_{k}_{i}" for i in range(1, len(coords) - 1)] + \
                    [f"n{p['TOFRANODE']}" if k == len(merged) - 1 else f"a{arc}_{k}e"]
            tags = {"railway": "rail", "gauge": cfg["gauge"], "usage": "main",
                    "narn:net": p["NET"], "narn:country": p.get("COUNTRY") or "", "narn:tracks": p.get("TRACKS")}
            if p.get("PASSNGR"): tags["passenger"] = p["PASSNGR"]
            if p["NET"] == "F": tags["ferry"] = "yes"
            elements.append({"type": "way", "id": f"{arc}_{k}", "nodes": nodes,
                             "geometry": [{"lon": c[0], "lat": c[1]} for c in coords], "tags": tags})
    offset += len(feats)
    print(f"  {offset}/{total}", flush=True)
    time.sleep(0.5)

json.dump({"elements": elements}, open(f"{name}-raw.json", "w"))
print(f"wrote {len(elements)} ways -> {name}-raw.json\nDONE")
