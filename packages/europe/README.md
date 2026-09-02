# @railroute-ts/europe

[![npm version](https://img.shields.io/npm/v/@railroute-ts/europe.svg?style=flat)](https://www.npmjs.com/package/@railroute-ts/europe)

Europe rail network data for [`railroute-ts`](https://github.com/mayurrawte/railroutes).
Europe-wide mainline rail (35–72N, 10W–32E) from OpenStreetMap, with gauge, electrification and train-ferry links (Messina, Rostock–Trelleborg). 12,886 stations with UIC codes.

```bash
npm install railroute-ts @railroute-ts/europe
```

```ts
import { railRoute } from 'railroute-ts';
import { EUROPE_NETWORK } from '@railroute-ts/europe';

const route = railRoute([lon1, lat1], [lon2, lat2], { network: EUROPE_NETWORK });
route.properties.length;   // km
```

### Stations

```ts
import { railRoute, registerStations } from 'railroute-ts';
import { EUROPE_NETWORK, EUROPE_STATIONS } from '@railroute-ts/europe';

registerStations(EUROPE_STATIONS);   // once, at startup
railRoute('Wien Hauptbahnhof', 'Berlin Hauptbahnhof', { network: EUROPE_NETWORK });
```

Data is a compact edge-level GeoJSON (`EUROPE_NETWORK.metadata` carries source,
license, build date, bbox, edge count and km). Versions are calendar-based
(`2026.9.x`): a bump means a data refresh, not an API change. Rebuild from source
with `network/fetch-region.py regions/europe.json` in the repo.

**License:** code MIT; data ODbL-1.0 (© OpenStreetMap contributors).
