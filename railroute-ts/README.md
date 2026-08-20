# railroute-ts

> **Shortest rail route between two points.** A TypeScript/JavaScript library
> for rail route planning and distance calculation — powered by the
> OpenStreetMap rail network. Returns GeoJSON.
>
> Sibling of [searoute-ts](https://github.com/mayurrawte/searoute-ts) — together
> they cover multimodal (sea + rail) freight distance.

**Status: v0 / pre-release.** Two bundled networks: **Europe-wide** (35–72N,
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

## Roadmap

- World network via `loadNetwork(url)` from CDN
- Station codes (UIC) as inputs, like searoute-ts's UN/LOCODE ports
- Gauge-break and electrification awareness
- Train-ferry links
- K-shortest alternatives, multi-leg itineraries

## License

MIT © Mayur Rawte. Network data © OpenStreetMap contributors, ODbL.
