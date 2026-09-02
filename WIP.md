# railroutes — WIP / handoff

_Updated: 2026-09-02_

## Current state
- **2026-09-02 PUBLISHED**: railroute-ts@0.2.0, @railroute-ts/{europe,india,north-america,china}@2026.9.0,
  @railroute-ts/mcp@0.1.0 — all on npm (granular token w/ 2FA bypass, removed from ~/.npmrc afterwards; Mayur
  to revoke). GitHub release v0.2.0. MCP Registry: server.json description must be ≤ 100 chars.
  Next: trusted-publisher links for all 6 (then publish.yml is tokenless), post docs/launch/2026-09-promotion-kit.md.
- **2026-09-02 — monorepo split (uncommitted while writing)**: npm workspaces at repo root. `railroute-ts` core (0.4 MB compressed,
  corridor sample only) + `packages/{europe,india,north-america,china}` = `@railroute-ts/<region>` (version 2026.9.0,
  exports `<REGION>_NETWORK` [+ `_STATIONS`], `sideEffects:false`, peerDep railroute-ts). Stations NO LONGER self-register:
  `registerStations(EUROPE_STATIONS)`. Demo + MCP migrated. CI/publish/deploy workflows are root-workspace based;
  publish.yml is a 6-way matrix that skips versions already on npm. Publish order: railroute-ts 0.2.0 → 4 packs → mcp.
  **npm org `railroute-ts` must exist first.**
- **2026-09-02 — #12 China DONE (in 0.2.0, unpublished)**: 12 Overpass tiles (western boxes split; mirrors
  overpass.kumi.systems / lz4 as fallback — main instance 504'd on the 30–40N/73–100E box), 298,319 ways →
  12,445 edges / 3.97 MB / 0.83 MB gz → BUNDLED as `networks/china`. Package now 4.2 MB compressed / 25.6 MB
  unpacked (5 networks). Accuracy: Shanghai–Beijing +2 %, Guangzhou–Beijing 0 %, Shenzhen–Wuhan +37 % (OSM tag
  gap on Wuguang HSR?). No China stations. MCP has 'china'. Spec Phases 1–4 done; remaining #13 (tag
  `networks-v1` on the release commit + CDN docs — README recipe already written) and #14 (showcase).
- **2026-09-02 — #11 North America DONE (in 0.2.0, unpublished)**: `network/fetch-narn.py` pages the FRA/BTS
  NARN ArcGIS FeatureServer (NET IN ('M','F'), 95,951 arcs, ~3 min) into the raw-ways shape with FRA node ids
  as junctions; `build-network.py` honours `ferry=yes` way tags. Result 12,943 edges / 4.24 MB / 0.95 MB gz →
  under the 1.5 MB rule so it is BUNDLED as `networks/north-america` (package now 3.4 MB compressed, 21 MB
  unpacked). Accuracy −4…−9 % vs timetable miles (shortest path ignores trackage rights). `NETWORK_URLS`
  exported for jsDelivr loading — **create the git tag `networks-v1` on the release commit** or those URLs 404.
  No NA station codes yet. MCP server: network "north-america". Next: #12 China, #13 tag + CDN docs.
- **2026-09-02 — 0.2.0 ready (uncommitted at time of writing): India network + pipeline v3.**
  `network/fetch-region.py regions/<name>.json` replaces fetch-europe.sh; `build-network.py` gained
  stitching (dead-end node merge ≤50 m across components + ≤2 km dead-end bridging + single-component
  assertion) — OSM mainline is broken into 500+ pieces that touch without sharing nodes; the old
  giant-component filter silently dropped Mumbai, Kerala, Bengaluru and ~2,500 Europe edges.
  Europe grew 38,212 → 40,693 edges (1.46 MB gz, right under the 1.5 MB bundle rule). India: 6,858
  edges / 0.28 MB gz, 8,476 stations with IR codes. Trunk accuracy ±6 % vs IR timetable; SBC–MAS +36 %
  (OSM tag gap). MCP server: network "india" + code search. Issues #9 #10 done. Publish 0.2.0 (not 0.1.1).
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
  Regenerate: `network/fetch-region.py regions/europe.json` (9 Overpass tiles, ~45 min, polite sleeps;
  merges + dedupes by way id) → `build-network.py europe-raw.json OUT europe-ferries.json regions/europe.json`.
  (Legacy files `europe-raw.json` / `rail-ferries.json` on the primary Mac predate the region configs; the
  rebuild from them was verified bit-identical: 38,212 edges / 259,890 km.) See `network/README.md`.
- Ferry stitching happens BEFORE the giant-component filter (Sicily joins via the
  Messina ferry) and must attach to junction/endpoint nodes only — intermediate
  nodes aren't in the edge graph (this bug bit once already).
- Chain contraction splits at gauge/electrified property changes — don't "optimize"
  that away or edge tags become lies.
- Node 18 unsupported (vitest styleText). History was force-pushed once (2026-08-20)
  to purge a 46 MB accidentally-committed tile — don't resurrect old refs.
