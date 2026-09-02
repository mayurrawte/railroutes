import type { RailNetwork } from '../types.js';
import data from './north-america-v0.json' with { type: 'json' };

/**
 * North American mainline rail network — US, Canada and Mexico — from the
 * FRA/BTS North American Rail Network (NARN, NTAD), main sub-network
 * (`NET='M'`) plus rail-ferry links (`NET='F'`). Public domain (US Government
 * work). All standard gauge; electrification is not in the source so
 * `electrifiedOnly` has no effect here. ~4.2 MB / 0.95 MB gzipped.
 */
export const NORTH_AMERICA_NETWORK = data as unknown as RailNetwork;
