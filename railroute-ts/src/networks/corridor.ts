import type { RailNetwork } from '../types.js';
import data from './corridor-v0.json' with { type: 'json' };

/** Rhine-Alpine corridor v0 (NL, W Germany, CH, N Italy) — OSM mainline rail. */
export const CORRIDOR_NETWORK = data as unknown as RailNetwork;
