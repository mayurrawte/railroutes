import { registerStations, type Station } from '../index.js';
import data from './corridor-stations.json' with { type: 'json' };

/** Rhine-Alpine corridor stations (OSM railway=station with uic_ref). Importing registers them. */
export const CORRIDOR_STATIONS = data as Station[];
registerStations(CORRIDOR_STATIONS);
