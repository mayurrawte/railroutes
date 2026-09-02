# @railroute-ts/india

[![npm version](https://img.shields.io/npm/v/@railroute-ts/india.svg?style=flat)](https://www.npmjs.com/package/@railroute-ts/india)

India rail network data for [`railroute-ts`](https://github.com/mayurrawte/railroutes).
Indian Railways mainline from OpenStreetMap. 8,476 stations with Indian Railways codes (NDLS, CSMT, MAS, HWH …).

```bash
npm install railroute-ts @railroute-ts/india
```

```ts
import { railRoute } from 'railroute-ts';
import { INDIA_NETWORK } from '@railroute-ts/india';

const route = railRoute([lon1, lat1], [lon2, lat2], { network: INDIA_NETWORK });
route.properties.length;   // km
```

### Stations

```ts
import { railRoute, registerStations } from 'railroute-ts';
import { INDIA_NETWORK, INDIA_STATIONS } from '@railroute-ts/india';

registerStations(INDIA_STATIONS);   // once, at startup
railRoute('NDLS', 'CSMT', { network: INDIA_NETWORK });
```

Data is a compact edge-level GeoJSON (`INDIA_NETWORK.metadata` carries source,
license, build date, bbox, edge count and km). Versions are calendar-based
(`2026.9.x`): a bump means a data refresh, not an API change. Rebuild from source
with `network/fetch-region.py regions/india.json` in the repo.

**License:** code MIT; data ODbL-1.0 (© OpenStreetMap contributors).
