# railroute-ts

> **Shortest rail route between two points.** A TypeScript/JavaScript library
> for rail route planning and distance calculation — powered by the
> OpenStreetMap rail network. Returns GeoJSON.
>
> Sibling of [searoute-ts](https://github.com/mayurrawte/searoute-ts) — together
> they cover multimodal (sea + rail) freight distance.

[![npm version](https://img.shields.io/npm/v/railroute-ts.svg?style=flat)](https://www.npmjs.com/package/railroute-ts)
[![npm downloads](https://img.shields.io/npm/dw/railroute-ts.svg?style=flat)](https://www.npmjs.com/package/railroute-ts)
[![CI](https://github.com/mayurrawte/railroutes/actions/workflows/ci.yml/badge.svg)](https://github.com/mayurrawte/railroutes/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/railroute-ts.svg?style=flat)](https://github.com/mayurrawte/railroutes/blob/main/railroute-ts/LICENSE)

```bash
npm install railroute-ts @railroute-ts/europe    # core + the region(s) you need
```

| Data package | Coverage | Stations | Gzipped |
|---|---|---|---|
| [`@railroute-ts/europe`](https://www.npmjs.com/package/@railroute-ts/europe) | Europe, 35–72N 10W–32E (OSM) | 12,886 with UIC codes | 1.46 MB |
| [`@railroute-ts/india`](https://www.npmjs.com/package/@railroute-ts/india) | Indian Railways mainline (OSM) | 8,476 with IR codes (NDLS, CSMT …) | 0.28 MB |
| [`@railroute-ts/north-america`](https://www.npmjs.com/package/@railroute-ts/north-america) | US + Canada + Mexico (FRA/BTS NARN, public domain) | 638 Amtrak/VIA stations by name | 0.95 MB |
| [`@railroute-ts/china`](https://www.npmjs.com/package/@railroute-ts/china) | Mainland China + Mongolia incl. HSR (OSM) | 9,326 stations by English name | 0.83 MB |
| [`@railroute-ts/cis`](https://www.npmjs.com/package/@railroute-ts/cis) | Russia, Kazakhstan, Belarus, Ukraine, Caucasus, Central Asia (OSM, 1520 mm) | by English name | — |

The core package is ~0.4 MB compressed (almost all of it the Rhine-Alpine
corridor sample network); install the regions you route in. Data packages are versioned by
calendar (`2026.9.x` = data refresh) and can also be fetched at runtime from a
CDN with `loadNetwork(NETWORK_URLS.europe)`.

**🗺️ [Try the interactive demo](https://mayurrawte.is-a.dev/railroutes/)** — click two points in Europe and see the rail route, computed in your browser.

**Status: v0.2.** Four regions — Europe (40,693 edges), India (6,858),
North America (12,943) and China (12,445) — verified against real itineraries:
Lisbon→Warsaw, London→Vienna via the Channel Tunnel, New Delhi→Mumbai CSMT, Los
Angeles→Chicago, Shanghai→Beijing, Guangzhou→Beijing.

```ts
import { railRoute, registerStations } from 'railroute-ts';
import { EUROPE_NETWORK, EUROPE_STATIONS } from '@railroute-ts/europe';   // npm i @railroute-ts/europe
import { CORRIDOR_NETWORK } from 'railroute-ts/networks/corridor';        // built-in sample: Rhine-Alpine only

const route = railRoute([4.47, 51.92], [8.92, 44.41], { network: CORRIDOR_NETWORK });
// Rotterdam → Genoa via the Gotthard base tunnel
// route.properties.length ≈ 1,183 km — GeoJSON LineString

railRoute(rotterdam, genoa, { network: CORRIDOR_NETWORK, speedKmh: 80 });
// → properties.durationHours ≈ 14.8

// station codes (UIC) or names — register a stations dataset once
registerStations(EUROPE_STATIONS);        // 12,886 stations (OSM uic_ref)
railRoute('London St. Pancras International', 'Wien Hauptbahnhof', { network: EUROPE_NETWORK });
railRoute('5100065', '8101003', { network: EUROPE_NETWORK });  // Warszawa Centralna → Wien Hbf
```

## Why

- 🛤️ **Realistic rail routes** over actual track geometry, not straight lines.
- 🗺️ **Returns GeoJSON** — drop straight into Leaflet, Mapbox, deck.gl, MapLibre.
- 🚉 Snaps origin/destination to the nearest point on the network.
- ⏱️ ETA from average speed.
- 🛤️ K-shortest alternatives — `railRouteAlternatives(a, b, { k: 3 })` (Yen's algorithm).
- 🧭 Multi-leg itineraries — `railRouteMulti([a, b, c])`, per-leg distances in `properties.legs`.
- 🧊 Zero runtime dependencies.

## How to

### Point to point

```ts
import { railRoute } from 'railroute-ts';
import { EUROPE_NETWORK } from '@railroute-ts/europe';

const route = railRoute([4.47, 51.92], [8.92, 44.41], { network: EUROPE_NETWORK });
route.properties.length;   // km
route.geometry;            // LineString along real track — drop into Leaflet/Mapbox/deck.gl
```

### Stations — UIC codes or names

```ts
registerStations(EUROPE_STATIONS);

railRoute('8400530', '8301700', { network: EUROPE_NETWORK });               // UIC codes
railRoute('Basel SBB', 'Milano Centrale', { network: EUROPE_NETWORK });     // names (case-insensitive)
// result carries properties.originStation / destinationStation
```

### ETA

```ts
railRoute(a, b, { network: EUROPE_NETWORK, speedKmh: 80 }).properties.durationHours;
```

### Alternatives (Yen's K-shortest)

```ts
import { railRouteAlternatives } from 'railroute-ts';
const routes = railRouteAlternatives(basel, milano, { network: EUROPE_NETWORK, k: 3 });
// Feature[], sorted by length — baseline first
```

### Multi-leg itineraries

```ts
import { railRouteMulti } from 'railroute-ts';
const trip = railRouteMulti([rotterdam, basel, milano], { network: EUROPE_NETWORK });
trip.properties.legs;      // per-leg km
```

### Custom / remote networks

```ts
import { loadNetwork } from 'railroute-ts';
const net = await loadNetwork('https://example.com/rail.json'); // GeoJSON FeatureCollection of LineStrings
railRoute(a, b, { network: net });
```

### India — Indian Railways station codes

```ts
import { railRoute, registerStations } from 'railroute-ts';
import { INDIA_NETWORK, INDIA_STATIONS } from '@railroute-ts/india';   // npm i @railroute-ts/india
registerStations(INDIA_STATIONS);   // 8,476 stations, IR codes from OSM `ref`

railRoute('NDLS', 'CSMT', { network: INDIA_NETWORK, speedKmh: 55 });
// New Delhi → Mumbai CSMT ≈ 1,434 km (IR timetable: 1,384 km), ~26 h at freight speed
railRoute('HWH', 'MAS', { network: INDIA_NETWORK });   // Howrah → Chennai Central ≈ 1,747 km
railRoute('SBC', [72.84, 18.94], { network: INDIA_NETWORK }); // codes and coordinates mix freely
```

Accuracy on trunk corridors is within ±6 % of Indian Railways timetable
distances (Delhi–Mumbai +4 %, Delhi–Howrah −0 %, Ahmedabad–Mumbai Central 0 %,
Delhi–Jammu −1 %, Secunderabad–Howrah +2 %). Where OSM lacks a `usage=main` tag
on a link the route detours — Bengaluru–Chennai is currently +36 % for that
reason; fixes are OSM edits, and the network is rebuilt from OSM on each release.
Gauge is carried per edge (broad 1676 mm dominates; remaining metre-gauge shows
up as `gaugeChanges`). Coverage box: 68–95E, 8–34N; Sri Lanka, Pakistan and
Bangladesh mainlines are not connected to the Indian graph.

### North America — US, Canada, Mexico (FRA/BTS NARN)

```ts
import { railRoute } from 'railroute-ts';
import { NORTH_AMERICA_NETWORK } from '@railroute-ts/north-america';   // npm i @railroute-ts/north-america

railRoute([-118.24, 34.05], [-87.63, 41.88], { network: NORTH_AMERICA_NETWORK, speedKmh: 40 });
// Los Angeles → Chicago ≈ 3,399 km (BNSF Transcon timetable: 2,200 mi / 3,540 km), ~85 h at intermodal speed
railRoute([-123.1, 49.28], [-79.38, 43.65], { network: NORTH_AMERICA_NETWORK }); // Vancouver → Toronto ≈ 4,275 km
railRoute([-99.5, 27.5], [-99.13, 19.43], { network: NORTH_AMERICA_NETWORK });   // Laredo → Mexico City ≈ 1,186 km
```

Source is the Federal Railroad Administration's **North American Rail Network**
(main sub-network `NET='M'` plus rail-ferry links), published by BTS in the
National Transportation Atlas Database — a US Government work in the public
domain, updated July 2026. It ships its own topology, so no snapping heuristics
were needed. Shortest-path distances run **4–9 % below** published timetable
miles (LA–Chicago −4 %, New York–Chicago −6 %, Seattle–LA −9 %) because the
graph takes the geometrically shortest owner-agnostic path; trackage rights and
ownership are in the source but not (yet) modelled. All edges are standard
gauge; the source has no electrification field, so `electrifiedOnly` is a no-op
on this network. Stations: 638 Amtrak/VIA stations by name (`NORTH_AMERICA_STATIONS`).

### China — mainline and high-speed

```ts
import { railRoute } from 'railroute-ts';
import { CHINA_NETWORK } from '@railroute-ts/china';   // npm i @railroute-ts/china

railRoute([121.47, 31.23], [116.4, 39.9], { network: CHINA_NETWORK });   // Shanghai → Beijing ≈ 1,347 km (Jinghu HSR: 1,318 km)
railRoute([113.26, 23.13], [116.4, 39.9], { network: CHINA_NETWORK });   // Guangzhou → Beijing ≈ 2,302 km (Jingguang: 2,298 km)
railRoute([106.55, 29.56], [82.57, 45.17], { network: CHINA_NETWORK });  // Chongqing → Alashankou ≈ 3,476 km — the China–Europe land-bridge exit
```

OSM `usage=main` for China (bbox 73–135E, 18–54N — connected lines in
neighbouring countries inside the box come along). Conventional and high-speed
alignments are both present, so the shortest path may pick an HSR alignment;
trunk corridors verify within a few percent (Shanghai–Beijing +2 %,
Guangzhou–Beijing 0 %, Beijing–Harbin +4 %). Where OSM misses a mainline tag the
route detours (Shanghai–Chengdu +13 %, Shenzhen–Wuhan +37 % today). Standard
gauge with real `electrified` tags. Stations: 9,326 heavy-rail stations by English
name (`CHINA_STATIONS`, e.g. `'Shanghai-Hongqiao'`, `'Beijing'`).

### Gauge, electrification, ferries

```ts
railRoute(a, b, { network: EUROPE_NETWORK, electrifiedOnly: true });      // electric traction only
railRoute(a, b, { network: EUROPE_NETWORK, ferries: false });             // no train ferries
railRoute(a, b, { network: EUROPE_NETWORK, gaugeChangePenaltyKm: 200 });  // penalize 1435↔1668/1520 breaks
// results carry properties.gaugeChanges and properties.ferryKm
// Rome → Palermo crosses the Messina train ferry; Rostock–Trelleborg links Scandinavia
```

### Snap distance

Inputs are snapped to the nearest rail node. Results report how far that was
(`properties.originSnapKm` / `destinationSnapKm`), and you can refuse points that
are too far from the network — e.g. a point in the sea, or outside the bundled
coverage — instead of getting a confident route from the wrong place:

```ts
railRoute([0, 0], 'Warsaw Central', { network: EUROPE_NETWORK, maxSnapDistanceKm: 50 });
// throws SnapFailedError: origin is 4072.3 km from the nearest rail node (limit 50 km)
```

### Errors

- Unknown station id → `Error('Unknown station: …')`
- Point farther than `maxSnapDistanceKm` from the network → `SnapFailedError` (`.endpoint`, `.distanceKm`)
- No path between the snapped points → `NoRouteError`

## Routing across regions (`mergeNetworks`)

Data packages are built from the same OSM source with non-overlapping boxes, so
they can be combined into one graph. `mergeNetworks` concatenates them and
bridges border dead ends within 2 km:

```ts
import { railRoute, mergeNetworks } from 'railroute-ts';
import { CHINA_NETWORK } from '@railroute-ts/china';
import { CIS_NETWORK } from '@railroute-ts/cis';
import { EUROPE_NETWORK } from '@railroute-ts/europe';

const EURASIA = mergeNetworks([CHINA_NETWORK, CIS_NETWORK, EUROPE_NETWORK]);
railRoute([106.55, 29.56], [6.78, 51.43], { network: EURASIA, gaugeChangePenaltyKm: 300 });
// Chongqing → Duisburg, the China–Europe land bridge: ~11,000 km, gaugeChanges: 2
```

The merged graph is built once and cached like any other network.

## Loading networks from a CDN instead of installing

Every data package is also served from this repo (tag `networks-v1`) via
jsDelivr, for browsers and edge runtimes that would rather fetch on demand:

```ts
import { railRoute, loadNetwork, NETWORK_URLS } from 'railroute-ts';
const network = await loadNetwork(NETWORK_URLS.northAmerica);   // or .europe / .india / .china / .corridor
railRoute([-118.24, 34.05], [-87.63, 41.88], { network });
```

## Multimodal: sea + rail with searoute-ts

```ts
import 'searoute-ts/ports';
import { seaRoute } from 'searoute-ts';
import { railRoute } from 'railroute-ts';
import { EUROPE_NETWORK } from '@railroute-ts/europe';

const sea  = seaRoute('CNSHA', 'NLRTM', { units: 'kilometers' });   // ≈ 19,753 km via Suez
const rail = railRoute([4.47, 51.92], [8.92, 44.41], { network: EUROPE_NETWORK }); // ≈ 1,180 km
const doorToDoor = sea.properties.length + rail.properties.length;
```

Same GeoJSON shape on both sides, so the legs concatenate onto one map.

## Use from an AI agent (MCP)

A companion [Model Context Protocol](https://modelcontextprotocol.io) server,
[`@railroute-ts/mcp`](https://www.npmjs.com/package/@railroute-ts/mcp)
([source](https://github.com/mayurrawte/railroutes/tree/main/examples/mcp-server)),
gives Claude Desktop, the `claude` CLI or any MCP client three tools:
`rail_route`, `rail_route_alternatives` and `rail_station_search`. Everything
runs locally — no API key, no network calls.

```bash
claude mcp add railroute -- npx -y @railroute-ts/mcp
```

## Roadmap

Shipped in v0.1–0.2: Europe, India, North America and China networks, UIC/IR station-code inputs, gauge-break and
electrification awareness, train-ferry links, K-shortest alternatives, multi-leg
itineraries, snap-distance guard.

- **MCP server** (`@railroute-ts/mcp`) so AI agents can call `rail_route` — see [`examples/mcp-server`](https://github.com/mayurrawte/railroutes/tree/main/examples/mcp-server)
- Trackage-rights-aware routing on NARN (#19)
- `highspeed` edge flag so HSR vs conventional can be filtered
- Further regions via the same pipeline ([design](https://github.com/mayurrawte/railroutes/blob/main/docs/superpowers/specs/2026-09-02-global-networks-design.md)): Japan, Russia/Central Asia (1520 mm), Australia, Brazil
- Station fallback where OSM lacks `uic_ref` (Portugal, Sweden)
- Shareable URL state in the demo

Using railroute-ts? [Tell us](https://github.com/mayurrawte/railroutes/issues/new?template=who-uses-railroute-ts.md) — it shapes what gets built next.

## Migrating from 0.1.x

0.1.0 bundled Europe inside the core. From 0.2.0 the data lives in
`@railroute-ts/<region>` packages and stations are registered explicitly:

```diff
-import { EUROPE_NETWORK } from 'railroute-ts/networks/europe';
-import 'railroute-ts/stations/europe';
+import { registerStations } from 'railroute-ts';
+import { EUROPE_NETWORK, EUROPE_STATIONS } from '@railroute-ts/europe';
+registerStations(EUROPE_STATIONS);
```

`railroute-ts/networks/corridor` and `railroute-ts/stations/corridor` stay in the
core (the corridor stations no longer self-register — call `registerStations`).

## License

MIT © Mayur Rawte. Network data © OpenStreetMap contributors, ODbL.
