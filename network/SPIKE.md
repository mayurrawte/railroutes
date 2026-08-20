# Network feasibility spike — 2026-08-20

**Question:** can a routable rail network ship inside an npm package, like searoute-ts bundles the Eurostat marnet (6.4 MB)?

**Answer: yes, comfortably — for Europe. World needs the CDN loader pattern.**

## Method
- Overpass API: `way[railway=rail][usage=main]` for Switzerland (dense-rail worst case per km²)
- Rounded coords to 4 decimals (~11 m), Douglas-Peucker simplify at ~100 m tolerance

## Measured (Switzerland)
| Stage | Size |
|---|---|
| Raw Overpass JSON | 11 MB, 10,463 ways, 101,814 pts |
| Simplified minified GeoJSON | **1.24 MB** (21,670 pts) |
| gzipped | **0.11 MB** |
| Track-km covered | 3,899 km |

## Extrapolation (by route-km, CH = 3.9k km)
| Scope | Route-km | Est. minified | Est. gzip |
|---|---|---|---|
| Europe (~230k km) | ~59× CH | ~73 MB → **~25–40 MB after graph dedup** | **~3–6 MB** |
| World (~1.3M km) | ~330× CH | too big to bundle | ~20–30 MB via `loadNetwork(url)` |

Notes:
- Raw ways still contain parallel tracks as separate ways; collapsing to
  route centerlines + merging segments between junctions (graph edges, not raw
  ways) should cut another 30–50%. So Europe lands in searoute-marnet territory.
- searoute-ts precedent: 6.4 MB data dir bundled, plus multi-resolution
  subpath exports (20 km / 50 km) and runtime `loadNetwork(url)` — reuse all
  three patterns here. A 50 km-class "corridor" resolution could make even
  the world network bundleable.

## Rail-specific graph properties to carry (the moat)
- gauge (1435/1520/1668/1000 …) → gauge-break penalties at borders (≈ searoute's canal restrictions)
- electrification (freight relevance), max axle load if present
- ferry links (`route=ferry` w/ rail) — Messina, Sassnitz–Trelleborg, train ferries
- border crossings; Channel Tunnel; key freight corridors (RFC1–11)

## Pipeline plan (network repo)
1. Geofabrik Europe PBF → osmium tags-filter `railway=rail usage=main,branch`
2. Collapse parallel tracks → centerline; snap junctions; build edge graph
3. Simplify per edge (100 m); emit versioned GeoJSON releases (5/20/50 km-class)
4. Stations/terminals layer: `railway=station` w/ UIC codes → the "ports" equivalent

## Verdict
Same architecture as searoute-ts transfers 1:1. Europe-first bundle, world via CDN.
No blocker found.
