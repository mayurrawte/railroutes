import type { RailNetwork, Station } from 'railroute-ts';
import network from '../data/network.json' with { type: 'json' };
import stations from '../data/stations.json' with { type: 'json' };


/**
 * Mainland China mainline including high-speed lines, from OpenStreetMap. Coordinates only — no station codes yet.
 * License: ODbL-1.0 (© OpenStreetMap contributors).
 * Pass to `railRoute(a, b, { network: CHINA_NETWORK })`.
 */
export const CHINA_NETWORK = network as unknown as RailNetwork;

/**
 * Stations with English names (OSM `name:en`; the name doubles as the code, e.g. 'Shanghai-Hongqiao', 'Beijing', 'Guangzhou').
 * Register once to route by code or name: `registerStations(CHINA_STATIONS)`.
 */
export const CHINA_STATIONS = stations as Station[];
