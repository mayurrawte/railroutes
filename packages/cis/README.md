# @railroute-ts/cis

[![npm version](https://img.shields.io/npm/v/@railroute-ts/cis.svg?style=flat)](https://www.npmjs.com/package/@railroute-ts/cis)

Former-USSR mainline rail (Russia, Kazakhstan, Belarus, Ukraine, Caucasus, Central Asia; 1520 mm) from OpenStreetMap — the land bridge between @railroute-ts/china and @railroute-ts/europe. Stations by English name.

```bash
npm install railroute-ts @railroute-ts/cis @railroute-ts/china @railroute-ts/europe
```

## Eurasia land bridge — China → Europe by rail

```ts
import { railRoute, mergeNetworks, registerStations } from 'railroute-ts';
import { CHINA_NETWORK, CHINA_STATIONS } from '@railroute-ts/china';
import { CIS_NETWORK, CIS_STATIONS } from '@railroute-ts/cis';
import { EUROPE_NETWORK, EUROPE_STATIONS } from '@railroute-ts/europe';

const EURASIA = mergeNetworks([CHINA_NETWORK, CIS_NETWORK, EUROPE_NETWORK]);   // once, ~2 s
registerStations([...CHINA_STATIONS, ...CIS_STATIONS, ...EUROPE_STATIONS]);

const r = railRoute('Chongqing', 'Duisburg Hauptbahnhof', { network: EURASIA, gaugeChangePenaltyKm: 300 });
r.properties.length;        // ≈ 11,000 km
r.properties.gaugeChanges;  // 2 — 1435 → 1520 at Dostyk/Alashankou, 1520 → 1435 at Brest/Małaszewicze
```

The three packages are built from the same OSM data with non-overlapping boxes,
so they share node coordinates at the borders; `mergeNetworks` bridges any
remaining dead ends within 2 km. Trans-Siberian, Trans-Mongolian (via the china
package, which already contains Mongolia), Baikal–Amur and the Central Asian
corridors are included; Sakhalin and Far-East ferries where OSM tags them.

## Accuracy (2026.9.0)

| Pair | railroute-ts | Reference |
|---|---|---|
| Chongqing → Duisburg (with china + europe) | 10,745 km, 2 gauge changes | ~11,000 km land-bridge |
| Moscow → Almaty | 4,080 km | ~4,000 km |
| Moscow → Baku | 2,393 km | ~2,500 km |
| Moscow → Vladivostok (with china) | 8,408 km | 9,289 km Trans-Siberian — shortest path cuts through Manchuria |
| Moscow → Kyiv | 1,069 km | ~860 km — detour, OSM `usage=main` gap under investigation |
| Aktobe → Kandyagash | 2,961 km | ~100 km — 25 untagged OSM ways, see [#17](https://github.com/mayurrawte/railroutes/issues/17) |

Data is a compact edge-level GeoJSON (`CIS_NETWORK.metadata` carries source,
license, build date, bbox, edge count and km). Calendar versions (`2026.9.x`).
Rebuild: `network/fetch-region.py regions/cis.json` in the repo.

**License:** code MIT; data ODbL-1.0 (© OpenStreetMap contributors).
