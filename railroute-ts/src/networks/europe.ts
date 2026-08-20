import type { RailNetwork } from '../types.js';
import data from './europe-v0.json' with { type: 'json' };

/** Europe-wide OSM mainline rail network (35–72N, 10W–32E). */
export const EUROPE_NETWORK = data as unknown as RailNetwork;
