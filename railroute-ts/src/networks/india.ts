import type { RailNetwork } from '../types.js';
import data from './india-v0.json' with { type: 'json' };

/**
 * India mainline rail network (OSM `railway=rail` + `usage=main`, bbox
 * 68–97.5E / 6.5–35.5N). Gauge is carried per edge: Indian Railways is
 * overwhelmingly 1676 mm broad gauge; remaining metre-gauge sections show up as
 * `gaugeChanges` on a route. Pair with `railroute-ts/stations/india` to route by
 * Indian Railways station codes (NDLS, CSMT, MAS, HWH …).
 */
export const INDIA_NETWORK = data as unknown as RailNetwork;
