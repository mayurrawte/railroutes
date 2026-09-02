import type { RailNetwork } from 'railroute-ts';
import network from '../data/network.json' with { type: 'json' };


/**
 * Mainland China mainline including high-speed lines, from OpenStreetMap. Coordinates only — no station codes yet.
 * License: ODbL-1.0 (© OpenStreetMap contributors).
 * Pass to `railRoute(a, b, { network: CHINA_NETWORK })`.
 */
export const CHINA_NETWORK = network as unknown as RailNetwork;
