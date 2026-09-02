# network/ — data pipeline

Turns OpenStreetMap (or other) rail data into the compact edge-level GeoJSON
that `railroute-ts` bundles or serves from a CDN. Raw downloads are large and
gitignored; everything is reproducible from a region config.

```bash
# 1. fetch (Overpass, tiled, polite — Europe ≈ 45 min, India ≈ 10 min)
python3 fetch-region.py regions/india.json
#    -> india-tiles/, india-raw.json, india-stations-raw.json[, india-ferries.json]

# 2. build the network (junction split → giant component → chain contraction → RDP)
python3 build-network.py india-raw.json ../railroute-ts/src/networks/india-v0.json - regions/india.json
#    3rd arg: ferries file or '-' ; 4th arg: region config → writes a `metadata` block

# 3. stations (code tag per region: uic_ref for Europe, ref = IR code for India)
python3 build-stations.py india-stations-raw.json ../railroute-ts/src/stations/india-stations.json ref
```

Region configs live in `regions/*.json`: tiles (lat0,lon0,lat1,lon1), the
Overpass way filter, whether to fetch train ferries, and the station code tag.
Bundling rule (see `docs/superpowers/specs/2026-09-02-global-networks-design.md`):
≤ 1.5 MB gzipped → bundled subpath export; larger → GitHub Release asset + `loadNetwork(url)`.

Traps are listed in `../WIP.md` (ferry stitching order, chain contraction at
property changes, Overpass politeness).
