# railroutes — WIP / handoff

_Updated: 2026-09-02_

## Current state
- **2026-09-02 growth batch (uncommitted)**: `examples/mcp-server` = `@railroute-ts/mcp` 0.1.0
  (rail_route / rail_route_alternatives / rail_station_search, 8 tests, builds, stdio
  smoke-tested). Publish order: (1) `railroute-ts@0.1.1`, (2) `cd examples/mcp-server && npm install && npm publish --access public`
  under a new `railroute-ts` npm org, (3) `mcp-publisher login github && mcp-publisher publish`
  (server.json present; mcpName io.github.mayurrawte/railroute). No lockfile committed yet — run
  `npm install` once 0.1.1 is on npm. `.github/workflows/publish.yml` added (OIDC, working-directory).
  searoute-ts README now has a "Multimodal" section + MCP cross-link (was NOT there before,
  despite the note below) — commit that repo too. `who-uses` issue template added; README roadmap refreshed.
- **0.1.1 ready to publish (uncommitted/unpublished as of 2026-09-02)**: adds
  `maxSnapDistanceKm` + `SnapFailedError` and `originSnapKm`/`destinationSnapKm`
  on results — previously `[0,0]` (Gulf of Guinea) silently snapped to Tarifa and
  returned a confident 3,700 km route. 43/43 tests. Publish: `npm login && npm publish`
  in `railroute-ts/` (CI publish still blocked on #7).
- **CI was RED on main from 2026-08-21 to 2026-09-02** (every push): the
  Rotterdam→Genoa k=3 wall-clock test took ~12.5s on ubuntu-latest vs a 10s budget
  (passes in ~5s locally, which is why it went unnoticed). Fixed: budget is 30s when
  `process.env.CI` is set. Verify the badge is green after the next push.
- **railroute-ts@0.1.0 on npm** (published 2026-08-29): gauge/electrification/ferry-aware
  routing, stations (UIC codes/names), K-shortest (Yen's), multi-leg, two bundled
  networks (Europe 8.6 MB/1.37 gz + Rhine-Alpine corridor).
- npm downloads: 269 (week of 17 Aug) → 162 (week of 24 Aug). No promotion done yet.
- **Interactive demo live**: https://mayurrawte.is-a.dev/railroutes/ (examples/web-demo,
  auto-deploys via Pages on push). Station pickers, draggable pins, speed slider,
  coverage + snap-distance guards, alternatives toggle.
- Issues: all feature issues closed. Only **#7 open** (npm publish automation).

## Next steps (in rough order)
0. **Global networks roadmap filed 2026-09-02**: spec at docs/superpowers/specs/2026-09-02-global-networks-design.md,
   issues #9–#14 (pipeline generalisation → India bundled → North America via NARN/CDN → China via CDN → networks-v1 release → multimodal showcase). Start with #9.
1. **#7 — CI publishing**: Mayur links the npm Trusted Publisher for `railroute-ts`
   (npmjs.com → package → Access → Trusted Publisher: GitHub Actions, repo
   `mayurrawte/railroutes`, workflow `publish.yml`, environment EMPTY), then add
   `.github/workflows/publish.yml` — copy searoute-ts's publish.yml but with
   `working-directory: railroute-ts`. ⚠️ Do NOT set `registry-url` in setup-node
   (its authToken placeholder silently disables OIDC); needs npm ≥ 11.5.1.
2. Distribution: awesome-geospatial / awesome-transit PRs; a "rail leg for
   CountEmissions in 10 lines" post; cross-link from searoute-ts README (DONE 2026-09-02, uncommitted).
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
