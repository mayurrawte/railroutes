# railroute-ts — global networks (India, North America, China) — design

_2026-09-02. Status: proposed. Owner: Mayur._

## Goal

Make `railroute-ts` useful outside Europe by shipping three more networks with
the same API (`railRoute(a, b, { network })`), the same edge properties
(`gauge`, `electrified`, `ferry`) and station-code inputs where a public code
system exists. Multimodal positioning (sea leg via searoute-ts + rail leg) is
strongest on exactly these corridors: China ↔ Europe rail, Indian port → ICD,
US West Coast port → Chicago.

Non-goals for v0.2: timetables, operators, speed limits, world-wide single
network, Africa/LatAm/Australia (later, same pipeline).

## Evidence gathered (2026-09-02)

| Region | Source | Raw size | Tag coverage | Station codes |
|---|---|---|---|---|
| Europe (shipped) | OSM Overpass, `railway=rail` + `usage=main` | 436,667 ways → 30,628 edges, 8.2 MB (1.25 MB gz) | gauge 99.9 %, electrified 99.6 % | `uic_ref` on 12,886 stations |
| **India** | same Overpass query, bbox 6.5,68 → 35.5,97.5 | **51,942 ways** (~12 % of Europe → est. 4k edges, ~1 MB) | gauge 99.5 %, electrified 97.4 % | **8,689 stations tagged `ref`** = Indian Railways codes (NDLS, CSMT, MAS…) |
| **China** | same Overpass query, bbox 18,73 → 54,135 | **298,293 ways** (~68 % of Europe → est. 20k edges, ~5.5 MB) | gauge 99.8 %, electrified 98.9 % | none in OSM; names (zh + `name:en`) only |
| **North America** | FRA/BTS **North American Rail Network (NARN)**, ArcGIS FeatureServer `NTAD_North_American_Rail_Network_Lines`, updated 2026-07-21, US-government work, **public domain** | 302,771 arcs total; `NET='M'` (main sub-network): **US 81,533 arcs / 213,395 km, CA 12,455 / 44,790 km, MX 1,948 / 15,959 km** | no gauge/electrified fields (all 1435 mm; electrification ≈ NEC only). Has `PASSNGR`, `TRACKS`, `STRACNET`, owners, **`NET='F'` rail-ferry arcs** and **pre-built topology** (`FRFRANODE`/`TOFRANODE`) | none in NARN; Amtrak codes could come from OSM `ref` later |

Overpass counts are cheap (`out count;`), full geometry for China will not fit
one Overpass call — tile it like Europe (9 tiles worked for 436k ways) or use
the Geofabrik `china-latest.osm.pbf` + `osmium tags-filter w/railway=rail` route.
US OSM count timed out at 180 s; irrelevant because NARN is the better source.

## Decisions

1. **Distribution: not everything is bundled.** Europe already costs 8.2 MB in
   the npm tarball. Rule: a network ships as a bundled subpath only if ≤ 1.5 MB
   gzipped; otherwise it is a versioned asset on a GitHub Release, served via
   jsDelivr (`https://cdn.jsdelivr.net/gh/mayurrawte/railroutes@networks-v1/…`)
   and loaded with the existing `loadNetwork(url)`. Expected: **India bundled**
   (`railroute-ts/networks/india`), **China and North America via CDN** with
   documented URLs and a `NETWORK_URLS` constant exported from the core so
   callers never hard-code them. Optionally a later `@railroute-ts/networks`
   package for offline users.
2. **One pipeline, region configs.** `network/build-network.py` stays the
   single edge builder. Add `network/regions/<name>.json` describing bbox tiles,
   source (`overpass` | `narn`), ferry file, and station source. `fetch-europe.sh`
   becomes `fetch-region.sh <name>`. A new `fetch-narn.py` pages the ArcGIS REST
   endpoint (`resultOffset`, 2,000 records/page, `where=NET IN ('M','F')`,
   `outFields=FRAARCID,FRFRANODE,TOFRANODE,NET,PASSNGR,TRACKS,COUNTRY,KM`,
   `f=geojson`) and converts arcs to the same "raw ways" shape the builder
   expects (node ids = FRA node ids, so junction splitting is exact).
3. **Edge properties stay the same three.** NARN gets `gauge: "1435"`,
   `electrified: null` (unknown), `ferry: NET==='F'`. India keeps OSM gauge
   (mostly 1676; metre-gauge remnants become real gauge changes — a feature,
   not a bug). China 1435 with real electrified tags.
4. **Station codes:** India from OSM `railway=station` + `ref` (same shape as
   the Europe `uic_ref` dataset → `railroute-ts/stations/india`). China and NA
   ship name-only station lists later; `rail_station_search` in the MCP server
   already covers name lookup.
5. **Coverage guards:** each network exports its bbox; the core throws
   `SnapFailedError` when `maxSnapDistanceKm` is set (done in 0.1.1). The demo
   gets a network switcher and per-network coverage outline.
6. **Licensing:** OSM-derived networks stay ODbL with attribution; NARN is
   public domain — say so per file in `NOTICE` and in each network's JSON
   `metadata` block (`source`, `license`, `fetchedAt`, `bbox`, `edges`).

## Phases (each is a GitHub issue; ship in this order)

1. **Pipeline generalisation** — region config + `fetch-region.sh` + `metadata`
   block in output; re-run Europe to prove no diff in edge count/length (#9).
2. **India** — fetch (2–3 tiles), build, stations from `ref`, bundle,
   verify Delhi→Mumbai ≈ 1,384 km (IR: 1,384 km via Kota), Chennai→Kolkata
   ≈ 1,660 km, gauge change on a metre-gauge remnant; README + demo (#10).
3. **North America (NARN)** — `fetch-narn.py`, build with FRA topology,
   verify LA→Chicago ≈ 3,500 km (BNSF Transcon ≈ 2,200 mi), Vancouver→Toronto,
   Laredo→Mexico City; publish as CDN asset; `NETWORK_URLS.northAmerica` (#11).
4. **China** — tiled Overpass or Geofabrik+osmium, build, verify
   Shanghai→Beijing ≈ 1,318 km (HSR) / 1,463 km (conventional — keep both
   `usage=main` classes, HSR is `highspeed=yes`), Chongqing→Alashankou (Europe
   land-bridge start); CDN asset (#12).
5. **CDN release + docs** — `networks-v1` release tag with all assets,
   `loadNetwork` recipe in README and MCP server (`network: "url"` option),
   size/perf table (#13).
6. **Multimodal showcase** — one worked example per corridor combining
   searoute-ts + railroute-ts: Shanghai→Rotterdam→Duisburg, Mundra→Delhi ICD,
   LA/Long Beach→Chicago. Blog post + LinkedIn (#14).

## Risks

- Overpass load for China: ~300k ways. Mitigation: tiles + 30 s pauses (Europe
  took ~45 min), or Geofabrik (1.1 GB pbf, offline, reproducible — preferred
  for CI-less re-runs).
- China place names: bundle both `name` and `name:en`; MCP search matches
  either.
- NARN "main sub network" may include long out-of-service stretches mislabelled
  — cross-check a few known abandoned lines; `X`/`A`/`R` are excluded anyway.
- Bundle size creep: enforce the 1.5 MB-gz rule in a CI size check.

## Addendum 2026-09-02 (evening): data packages instead of bundling

Decision 1 above (bundle ≤ 1.5 MB gz) was superseded the same day once four
regions existed: bundling everything made `npm install railroute-ts` 4.2 MB
compressed / 25 MB unpacked for users who need one region. Shipped shape:

- `railroute-ts` — core algorithm + types + `loadNetwork` + the small Rhine-Alpine
  corridor sample (~30 KB).
- `@railroute-ts/europe`, `@railroute-ts/india`, `@railroute-ts/north-america`,
  `@railroute-ts/china` — one data package per region (`packages/<region>/`),
  exporting `<REGION>_NETWORK` and, where codes exist, `<REGION>_STATIONS`.
  `sideEffects: false`; calendar versions (`2026.9.x`); peer-dep on the core.
- Stations no longer self-register on import — call `registerStations(...)`.
  Explicit, tree-shakable, no surprise globals.
- The 1.5 MB-gz rule still applies per data file (guard test in every package);
  a region that outgrows it gets a lighter resolution tier, not a CDN-only path.
- `NETWORK_URLS` + jsDelivr (`networks-v1` tag) remain for runtime loading.
- Repo is an npm workspace; CI/publish/deploy workflows run from the root.
  `publish.yml` is a matrix over the six publishable workspaces and skips
  versions already on npm, so one release publishes whatever changed.
