import type { RailNetwork, Station } from 'railroute-ts';
import network from '../data/network.json' with { type: 'json' };
import stations from '../data/stations.json' with { type: 'json' };

/**
 * Indian Railways mainline from OpenStreetMap. 8,476 stations with Indian Railways codes (NDLS, CSMT, MAS, HWH …).
 * License: ODbL-1.0 (© OpenStreetMap contributors).
 * Pass to `railRoute(a, b, { network: INDIA_NETWORK })`.
 */
export const INDIA_NETWORK = network as unknown as RailNetwork;

/**
 * Stations for this network. Register them once to route by code or name:
 * `registerStations(INDIA_STATIONS)`.
 */
export const INDIA_STATIONS = stations as Station[];
