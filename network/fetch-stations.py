#!/usr/bin/env python3
"""Fetch only the stations of a region (no ways). Usage: fetch-stations.py regions/<name>.json"""
import json, sys, pathlib
sys.argv = [sys.argv[0], sys.argv[1]]
cfg = json.load(open(sys.argv[1]))
import importlib.util
spec = importlib.util.spec_from_file_location("fr", "fetch-region.py")
# reuse query() from fetch-region without running its main body: copy the minimal bits instead
import time, urllib.request, urllib.parse
MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://lz4.overpass-api.de/api/interpreter"]
def query(q, out, tries=6):
    for attempt in range(1, tries + 1):
        url = MIRRORS[(attempt - 1) % len(MIRRORS)]
        print(f"FETCH {out} (attempt {attempt}, {url.split('/')[2]})", flush=True)
        try:
            req = urllib.request.Request(url, data=urllib.parse.urlencode({"data": q}).encode(), headers={"User-Agent": "railroutes-pipeline"})
            body = urllib.request.urlopen(req, timeout=1000).read(); d = json.loads(body)
            if "elements" in d: out.write_bytes(body); print(f"  OK {len(d['elements'])} elements", flush=True); return
        except Exception as e: print(f"  failed: {e}", flush=True)
        time.sleep(30)
    sys.exit("giving up")
name = cfg["name"]; st = cfg["stations"]
if cfg.get("bbox"): lat0, lon0, lat1, lon1 = cfg["bbox"]
else:
    lat0 = min(t[0] for t in cfg["tiles"]); lon0 = min(t[1] for t in cfg["tiles"]); lat1 = max(t[2] for t in cfg["tiles"]); lon1 = max(t[3] for t in cfg["tiles"])
query(f'[out:json][timeout:600][bbox:{lat0},{lon0},{lat1},{lon1}];nwr{st["extra_filter"]};out center;', pathlib.Path(f"{name}-stations-raw.json"))
print("DONE")
