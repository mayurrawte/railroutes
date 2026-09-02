import type { RailNetwork } from '../types.js';
import data from './china-v0.json' with { type: 'json' };

/**
 * China mainline rail network (OSM `railway=rail` + `usage=main`, bbox
 * 73–135E / 18–54N; includes connected lines in neighbouring countries that OSM
 * tags as mainline within the box). Standard gauge throughout with real
 * `electrified` tags; high-speed and conventional lines are both present, so the
 * shortest path may take an HSR alignment. No station codes — route by
 * coordinates (or add stations with `registerStations`).
 */
export const CHINA_NETWORK = data as unknown as RailNetwork;
