# @railroute-ts/north-america

[![npm version](https://img.shields.io/npm/v/@railroute-ts/north-america.svg?style=flat)](https://www.npmjs.com/package/@railroute-ts/north-america)

North America rail network data for [`railroute-ts`](https://github.com/mayurrawte/railroutes).
US, Canada and Mexico mainline from the FRA/BTS North American Rail Network (main sub-network + rail ferries). Public domain. Coordinates only — no station codes yet.

```bash
npm install railroute-ts @railroute-ts/north-america
```

```ts
import { railRoute } from 'railroute-ts';
import { NORTH_AMERICA_NETWORK } from '@railroute-ts/north-america';

const route = railRoute([lon1, lat1], [lon2, lat2], { network: NORTH_AMERICA_NETWORK });
route.properties.length;   // km
```

No station codes in this dataset yet — route by `[lon, lat]`.

Data is a compact edge-level GeoJSON (`NORTH_AMERICA_NETWORK.metadata` carries source,
license, build date, bbox, edge count and km). Versions are calendar-based
(`2026.9.x`): a bump means a data refresh, not an API change. Rebuild from source
with `network/fetch-region.py regions/north-america.json` in the repo.

**License:** code MIT; data Public domain (US Government work) — FRA/BTS North American Rail Network (NTAD).
