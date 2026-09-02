# @railroute-ts/china

[![npm version](https://img.shields.io/npm/v/@railroute-ts/china.svg?style=flat)](https://www.npmjs.com/package/@railroute-ts/china)

China rail network data for [`railroute-ts`](https://github.com/mayurrawte/railroutes).
Mainland China mainline including high-speed lines, from OpenStreetMap. Coordinates only — no station codes yet.

```bash
npm install railroute-ts @railroute-ts/china
```

```ts
import { railRoute } from 'railroute-ts';
import { CHINA_NETWORK } from '@railroute-ts/china';

const route = railRoute([lon1, lat1], [lon2, lat2], { network: CHINA_NETWORK });
route.properties.length;   // km
```

No station codes in this dataset yet — route by `[lon, lat]`.

Data is a compact edge-level GeoJSON (`CHINA_NETWORK.metadata` carries source,
license, build date, bbox, edge count and km). Versions are calendar-based
(`2026.9.x`): a bump means a data refresh, not an API change. Rebuild from source
with `network/fetch-region.py regions/china.json` in the repo.

**License:** code MIT; data ODbL-1.0 (© OpenStreetMap contributors).
