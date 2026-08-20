import { registerStations, type Station } from '../index.js';
import data from './europe-stations.json' with { type: 'json' };

/**
 * Europe-wide stations (OSM railway=station with uic_ref). Importing registers them.
 * Coverage follows OSM tagging: strong in DE/AT/CH/FR/PL/IT-north, absent where
 * uic_ref isn't mapped (e.g. Portugal, Sweden as of 2026-08).
 */
export const EUROPE_STATIONS = data as Station[];
registerStations(EUROPE_STATIONS);
