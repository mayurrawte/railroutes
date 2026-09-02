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
npm install railroute-ts
```

**🗺️ [Try the interactive demo](https://mayurrawte.is-a.dev/railroutes/)** — click two points in Europe and see the rail route, computed in your browser.

**Status: v0.2.** Four bundled networks: **Europe-wide** (35–72N, 10W–32E —
40,693 edges, 1.46 MB gzipped), **India** (Indian Railways mainline — 6,858
edges, 0.28 MB gzipped, routes by IR station codes), **North America** (US +
Canada + Mexico from the FRA/BTS North American Rail Network — 12,943 edges,
0.95 MB gzipped, public domain) and the lighter Rhine-Alpine corridor. Verified
against real itineraries: Lisbon→Warsaw, London→Vienna via the Channel Tunnel,
New Delhi→Mumbai CSMT, Los Angeles→Chicago, Vancouver→Toronto. China is next
([roadmap](#roadmap)). The package installs at 3.4 MB compressed.

```ts
import { railRoute } from 'railroute-ts';
import { EUROPE_NETWORK } from 'railroute-ts/networks/europe';    // all of Europe
import { CORRIDOR_NETWORK } from 'railroute-ts/networks/corridor'; // lighter: Rhine-Alpine only

const route = railRoute([4.47, 51.92], [8.92, 44.41], { network: CORRIDOR_NETWORK });
// Rotterdam → Genoa via the Gotthard base tunnel
// route.properties.length ≈ 1,183 km — GeoJSON LineString

railRoute(rotterdam, genoa, { network: CORRIDOR_NETWORK, speedKmh: 80 });
// → properties.durationHours ≈ 14.8

// station codes (UIC) or names, via the bundled stations datasets
import 'railroute-ts/stations/europe';   // 12,886 stations (OSM uic_ref)
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
import { EUROPE_NETWORK } from 'railroute-ts/networks/europe';

const route = railRoute([4.47, 51.92], [8.92, 44.41], { network: EUROPE_NETWORK });
route.properties.length;   // km
route.geometry;            // LineString along real track — drop into Leaflet/Mapbox/deck.gl
```

### Stations — UIC codes or names

```ts
import 'railroute-ts/stations/europe'; // side-effect: registers 12,886 stations

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
import { railRoute } from 'railroute-ts';
import { INDIA_NETWORK } from 'railroute-ts/networks/india';
import 'railroute-ts/stations/india';   // 8,476 stations, IR codes from OSM `ref`

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
import { NORTH_AMERICA_NETWORK } from 'railroute-ts/networks/north-america';

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
on this network. No station codes yet — pass coordinates.

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

## Loading networks from a CDN instead of bundling

Every bundled network is also served from this repo (tag `networks-v1`) via
jsDelivr, for browsers and edge runtimes that would rather fetch on demand:

```ts
import { railRoute, loadNetwork, NETWORK_URLS } from 'railroute-ts';
const network = await loadNetwork(NETWORK_URLS.northAmerica);   // or .europe / .india / .corridor
railRoute([-118.24, 34.05], [-87.63, 41.88], { network });
```

## Multimodal: sea + rail with searoute-ts

```ts
import 'searoute-ts/ports';
import { seaRoute } from 'searoute-ts';
import { railRoute } from 'railroute-ts';
import { EUROPE_NETWORK } from 'railroute-ts/networks/europe';

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

Shipped in v0.1–0.2: Europe, India and North America networks, UIC/IR station-code inputs, gauge-break and
electrification awareness, train-ferry links, K-shortest alternatives, multi-leg
itineraries, snap-distance guard.

- **MCP server** (`@railroute-ts/mcp`) so AI agents can call `rail_route` — see [`examples/mcp-server`](https://github.com/mayurrawte/railroutes/tree/main/examples/mcp-server)
- China network — [design](https://github.com/mayurrawte/railroutes/blob/main/docs/superpowers/specs/2026-09-02-global-networks-design.md), issue [#12](https://github.com/mayurrawte/railroutes/issues/12)
- Station codes for North America (Amtrak/VIA) and China; trackage-rights-aware routing on NARN
- Station fallback where OSM lacks `uic_ref` (Portugal, Sweden)
- Shareable URL state in the demo

Using railroute-ts? [Tell us](https://github.com/mayurrawte/railroutes/issues/new?template=who-uses-railroute-ts.md) — it shapes what gets built next.

## License

MIT © Mayur Rawte. Network data © OpenStreetMap contributors, ODbL.
