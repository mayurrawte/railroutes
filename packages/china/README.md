# @railroute-ts/china

[![npm version](https://img.shields.io/npm/v/@railroute-ts/china.svg?style=flat)](https://www.npmjs.com/package/@railroute-ts/china)

China rail network data for [`railroute-ts`](https://github.com/mayurrawte/railroutes).
Mainland China mainline including high-speed lines, from OpenStreetMap. Stations by English name (metro filtered out).

```bash
npm install railroute-ts @railroute-ts/china
```

```ts
import { railRoute } from 'railroute-ts';
import { CHINA_NETWORK } from '@railroute-ts/china';

const route = railRoute([lon1, lat1], [lon2, lat2], { network: CHINA_NETWORK });
route.properties.length;   // km
```

### Stations

Heavy-rail stations with an English name in OSM (`name:en`; metro and light-rail
stops are filtered out), keyed by that name:

```ts
import { railRoute, registerStations } from 'railroute-ts';
import { CHINA_NETWORK, CHINA_STATIONS } from '@railroute-ts/china';

registerStations(CHINA_STATIONS);   // once, at startup
railRoute('Shanghai-Hongqiao', 'Beijing', { network: CHINA_NETWORK });
```

Names follow OSM transliteration (e.g. `Shanghai-Hongqiao`, `Shanghainan`); use
`rail_station_search` in the MCP server or a substring match to find them.

Data is a compact edge-level GeoJSON (`CHINA_NETWORK.metadata` carries source,
license, build date, bbox, edge count and km). Versions are calendar-based
(`2026.9.x`): a bump means a data refresh, not an API change. Rebuild from source
with `network/fetch-region.py regions/china.json` in the repo.

**License:** code MIT; data ODbL-1.0 (© OpenStreetMap contributors).
