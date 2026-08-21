# railroutes

> Rail route planning for JavaScript/TypeScript — shortest rail routes over the
> OpenStreetMap railway network, returned as GeoJSON.

**🗺️ [Try the interactive demo](https://mayurrawte.github.io/railroutes/)** — click two points in Europe, see the rail route. ([source](examples/web-demo))

This monorepo holds:

| Directory | What it is |
|---|---|
| [`railroute-ts/`](railroute-ts/) | The library — `railRoute(origin, destination)` → GeoJSON `Feature<LineString>` with distance and ETA |
| [`network/`](network/) | The data pipeline — raw OSM rail ways → compact, routable network assets (junction splitting, chain contraction, geometry simplification) |

**Status: v0 — [on npm](https://www.npmjs.com/package/railroute-ts)** (`npm install railroute-ts`).
Two bundled networks: **Europe-wide** (35–72N, 10W–32E; verified Lisbon→Warsaw,
Stockholm→Rome, London→Vienna via the Channel Tunnel) and the lighter
**Rhine-Alpine corridor**. Verified against real-world rail distances:

| Route | Computed | Real-world |
|---|---|---|
| Rotterdam → Genoa | 1,183 km | ~1,200 km (via Gotthard base tunnel) |
| Rotterdam → Basel | 709 km | ~700 km |
| Cologne → Milan | 840 km | ~850 km |

## Motivation

Sea freight has [searoute](https://github.com/eurostat/searoute) (Java),
[searoute-py](https://github.com/genthalili/searoute-py) (Python), and
[searoute-ts](https://github.com/mayurrawte/searoute-ts) (JS/TS — same author
as this repo). Rail freight has **nothing installable**: the only open option
is running your own routing server (GraphHopper/OSRM/OpenRailRouting) against
a multi-gigabyte OSM extract.

But rail distance is the missing leg of every multimodal freight calculation:

- **Quoting** — port-to-door pricing needs the rail leg, not a road-distance
  approximation.
- **Emissions reporting** — [EU CountEmissions](https://transport.ec.europa.eu/transport-themes/clean-transport/count-emissions-eu_en)
  and GLEC-framework CO₂e accounting require per-mode distances. Rail is the
  mode shippers move *to*; you can't report what you can't measure.
- **Visualisation** — logistics dashboards drawing straight lines across the
  Alps look broken. Real track geometry as GeoJSON drops straight into
  Leaflet/Mapbox/deck.gl.

`railroute-ts` applies the searoute recipe to rail: curate the network once,
ship it as data, and make routing a zero-infrastructure `npm install`.
Together, `searoute-ts` + `railroute-ts` cover sea + rail multimodal distance
in one stack.

## How it works

1. **Pipeline** (`network/build-network.py`): OSM `railway=rail` + `usage=main`
   ways → split at shared junction nodes → keep the giant connected component →
   contract degree-2 chains into single edges → simplify geometry
   (Douglas-Peucker, ~100 m). The corridor compresses from 148 MB raw OSM to a
   **1.6 MB asset (0.29 MB gzipped)** with no loss of routable connectivity.
2. **Library** (`railroute-ts/`): builds an adjacency graph from the network,
   snaps origin/destination to the nearest node, runs Dijkstra, and decorates
   the result with `length`, `units`, and `durationHours`.

## Roadmap

- Europe-wide bundled network; world network via `loadNetwork(url)` from CDN
- UIC station codes as inputs (the rail equivalent of searoute-ts's UN/LOCODE ports)
- Gauge-break awareness (1435/1520/1668/1000 mm) and electrification properties
- Train-ferry links (Messina, Trelleborg, …)
- K-shortest alternatives and multi-leg itineraries

## References

- **[eurostat/searoute](https://github.com/eurostat/searoute)** — the original
  sea-route engine whose architecture (curated network + Dijkstra + passage
  semantics) this project adapts to rail.
- **[searoute-ts](https://github.com/mayurrawte/searoute-ts)** — the sibling
  library for sea routes; railroute-ts mirrors its API deliberately.
- **[OpenStreetMap railway data](https://wiki.openstreetmap.org/wiki/Railways)** —
  the source network (© OpenStreetMap contributors, ODbL). Fetched via the
  [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API).
- **[OpenRailwayMap](https://openrailwaymap.org/)** — visualisation and tagging
  reference for the OSM rail layer.
- **[OpenRailRouting](https://github.com/geofabrik/OpenRailRouting)** — the
  self-hosted (GraphHopper-based) alternative; the contrast that motivates a
  zero-infra library.
- **[GLEC Framework](https://www.smartfreightcentre.org/en/our-programs/global-logistics-emissions-council/)** /
  EU CountEmissions — the emissions-accounting standards that make per-mode
  rail distance commercially necessary.

## License

MIT © Mayur Rawte. Network data © OpenStreetMap contributors,
[ODbL](https://opendatacommons.org/licenses/odbl/).
