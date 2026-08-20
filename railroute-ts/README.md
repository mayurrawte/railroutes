# railroute-ts

> **Shortest rail route between two points.** A TypeScript/JavaScript library
> for rail route planning and distance calculation — powered by the
> OpenStreetMap rail network. Returns GeoJSON.
>
> Sibling of [searoute-ts](https://github.com/mayurrawte/searoute-ts) — together
> they cover multimodal (sea + rail) freight distance.

**Status: v0 / pre-release.** Bundled network covers the Rhine-Alpine corridor
(Netherlands, western Germany, Switzerland, northern Italy). Europe-wide
network is in progress.

```ts
import { railRoute } from 'railroute-ts';
import { CORRIDOR_NETWORK } from 'railroute-ts/networks/corridor';

const route = railRoute([4.47, 51.92], [8.92, 44.41], { network: CORRIDOR_NETWORK });
// Rotterdam → Genoa via the Gotthard base tunnel
// route.properties.length ≈ 1,183 km — GeoJSON LineString

railRoute(rotterdam, genoa, { network: CORRIDOR_NETWORK, speedKmh: 80 });
// → properties.durationHours ≈ 14.8
```

## Why

- 🛤️ **Realistic rail routes** over actual track geometry, not straight lines.
- 🗺️ **Returns GeoJSON** — drop straight into Leaflet, Mapbox, deck.gl, MapLibre.
- 🚉 Snaps origin/destination to the nearest point on the network.
- ⏱️ ETA from average speed.
- 🧊 Zero runtime dependencies.

## Roadmap

- Europe-wide network (bundled) + world via `loadNetwork(url)`
- Station codes (UIC) as inputs, like searoute-ts's UN/LOCODE ports
- Gauge-break and electrification awareness
- Train-ferry links
- K-shortest alternatives, multi-leg itineraries

## License

MIT © Mayur Rawte. Network data © OpenStreetMap contributors, ODbL.
