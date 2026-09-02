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

**Status: v0.** Two bundled networks: **Europe-wide** (35–72N,
10W–32E — 30,628 edges, 1.25 MB gzipped) and the lighter Rhine-Alpine corridor.
Verified against real itineraries: Lisbon→Warsaw, Stockholm→Rome, London→Vienna
via the Channel Tunnel.

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

Shipped in v0.1: Europe network, UIC/station-name inputs, gauge-break and
electrification awareness, train-ferry links, K-shortest alternatives, multi-leg
itineraries, snap-distance guard.

- **MCP server** (`@railroute-ts/mcp`) so AI agents can call `rail_route` — see [`examples/mcp-server`](https://github.com/mayurrawte/railroutes/tree/main/examples/mcp-server)
- World network via `loadNetwork(url)` from CDN (North America, India, China)
- Station fallback where OSM lacks `uic_ref` (Portugal, Sweden)
- Shareable URL state in the demo

Using railroute-ts? [Tell us](https://github.com/mayurrawte/railroutes/issues/new?template=who-uses-railroute-ts.md) — it shapes what gets built next.

## License

MIT © Mayur Rawte. Network data © OpenStreetMap contributors, ODbL.
