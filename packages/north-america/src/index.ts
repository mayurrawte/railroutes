import type { RailNetwork } from 'railroute-ts';
import network from '../data/network.json' with { type: 'json' };


/**
 * US, Canada and Mexico mainline from the FRA/BTS North American Rail Network (main sub-network + rail ferries). Public domain. Coordinates only — no station codes yet.
 * License: Public domain (US Government work) — FRA/BTS North American Rail Network (NTAD).
 * Pass to `railRoute(a, b, { network: NORTH_AMERICA_NETWORK })`.
 */
export const NORTH_AMERICA_NETWORK = network as unknown as RailNetwork;
