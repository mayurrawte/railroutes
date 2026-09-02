import type { Station } from '../index.js';
import data from './corridor-stations.json' with { type: 'json' };

/**
 * Rhine-Alpine corridor stations (OSM railway=station with uic_ref).
 * Register once with `registerStations(CORRIDOR_STATIONS)` to route by code/name.
 */
export const CORRIDOR_STATIONS = data as Station[];
