import type { RailNetwork, Station } from 'railroute-ts';
import network from '../data/network.json' with { type: 'json' };
import stations from '../data/stations.json' with { type: 'json' };

/**
 * Europe-wide mainline rail (35–72N, 10W–32E) from OpenStreetMap, with gauge, electrification and train-ferry links (Messina, Rostock–Trelleborg). 12,886 stations with UIC codes.
 * License: ODbL-1.0 (© OpenStreetMap contributors).
 * Pass to `railRoute(a, b, { network: EUROPE_NETWORK })`.
 */
export const EUROPE_NETWORK = network as unknown as RailNetwork;

/**
 * Stations for this network. Register them once to route by code or name:
 * `registerStations(EUROPE_STATIONS)`.
 */
export const EUROPE_STATIONS = stations as Station[];
