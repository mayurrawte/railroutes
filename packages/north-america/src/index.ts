import type { RailNetwork, Station } from 'railroute-ts';
import network from '../data/network.json' with { type: 'json' };
import stations from '../data/stations.json' with { type: 'json' };


/**
 * US, Canada and Mexico mainline from the FRA/BTS North American Rail Network (main sub-network + rail ferries). Public domain. Coordinates only — no station codes yet.
 * License: Public domain (US Government work) — FRA/BTS North American Rail Network (NTAD).
 * Pass to `railRoute(a, b, { network: NORTH_AMERICA_NETWORK })`.
 */
export const NORTH_AMERICA_NETWORK = network as unknown as RailNetwork;

/**
 * Amtrak and VIA Rail stations (OSM `network=Amtrak|VIA`); the name is the key, e.g. 'Los Angeles Union Station', 'Chicago Union Station', 'Toronto Union Station'.
 * Register once to route by code or name: `registerStations(NORTH_AMERICA_STATIONS)`.
 */
export const NORTH_AMERICA_STATIONS = stations as Station[];
