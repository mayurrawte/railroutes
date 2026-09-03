import type { RailNetwork, Station } from 'railroute-ts';
import network from '../data/network.json' with { type: 'json' };
import stations from '../data/stations.json' with { type: 'json' };

/**
 * Former-USSR mainline rail (Russia, Kazakhstan, Belarus, Ukraine, Caucasus, Central Asia; 1520 mm) from OpenStreetMap — the land bridge between @railroute-ts/china and @railroute-ts/europe. Stations by English name.
 * Covers what the europe (≤ 32°E) and china (18–54°N, 73–135°E) packages do not;
 * combine with `mergeNetworks([CHINA_NETWORK, CIS_NETWORK, EUROPE_NETWORK])` for
 * Eurasia-wide routing with real gauge changes at Dostyk/Alashankou and Brest.
 * License: ODbL-1.0 (© OpenStreetMap contributors).
 */
export const CIS_NETWORK = network as unknown as RailNetwork;

/** Stations with an English name in OSM (`name:en`), keyed by that name. `registerStations(CIS_STATIONS)`. */
export const CIS_STATIONS = stations as Station[];
