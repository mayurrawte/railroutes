# railroutes — WIP / handoff

_Updated: 2026-08-29_

## Current state — everything green, everything shipped
- **railroute-ts@0.1.0 on npm** (published 2026-08-29): gauge/electrification/ferry-aware
  routing, stations (UIC codes/names), K-shortest (Yen's), multi-leg, two bundled
  networks (Europe 8.6 MB/1.37 gz + Rhine-Alpine corridor). 37/37 tests, CI green (Node 20/22/24).
- **Interactive demo live**: https://mayurrawte.is-a.dev/railroutes/ (examples/web-demo,
  auto-deploys via Pages on push). Station pickers, draggable pins, speed slider,
  coverage + snap-distance guards, alternatives toggle.
- Issues: all feature issues closed. Only **#7 open** (npm publish automation).

## Next steps (in rough order)
1. **#7 — CI publishing**: Mayur links the npm Trusted Publisher for `railroute-ts`
   (npmjs.com → package → Access → Trusted Publisher: GitHub Actions, repo
   `mayurrawte/railroutes`, workflow `publish.yml`, environment EMPTY), then add
   `.github/workflows/publish.yml` — copy searoute-ts's publish.yml but with
   `working-directory: railroute-ts`. ⚠️ Do NOT set `registry-url` in setup-node
   (its authToken placeholder silently disables OIDC); needs npm ≥ 11.5.1.
2. Distribution: awesome-geospatial / awesome-transit PRs; a "rail leg for
   CountEmissions in 10 lines" post; cross-link from searoute-ts README (already done).
3. Feature backlog (create issues as needed): URL-state sharing in the demo,
   world network via loadNetwork CDN, station fallback where OSM lacks uic_ref (PT/SE).

## Traps (read before touching the pipeline)
- Raw data is local-only + gitignored (575 MB `network/europe-tiles/`, `europe-raw.json`).
  Regenerate: `network/fetch-europe.sh` (9 Overpass tiles, ~45 min, polite sleeps)
  → merge/dedupe by way id → `build-network.py RAW OUT rail-ferries.json`.
- Ferry stitching happens BEFORE the giant-component filter (Sicily joins via the
  Messina ferry) and must attach to junction/endpoint nodes only — intermediate
  nodes aren't in the edge graph (this bug bit once already).
- Chain contraction splits at gauge/electrified property changes — don't "optimize"
  that away or edge tags become lies.
- Node 18 unsupported (vitest styleText). History was force-pushed once (2026-08-20)
  to purge a 46 MB accidentally-committed tile — don't resurrect old refs.
