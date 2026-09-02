import { registerStations, type Station } from '../index.js';
import data from './india-stations.json' with { type: 'json' };

/**
 * Indian Railways stations (OSM railway=station with `ref` = IR station code,
 * e.g. NDLS = New Delhi, CSMT = Mumbai CSMT, MAS = Chennai Central, HWH =
 * Howrah, SBC = KSR Bengaluru). Importing registers them so railRoute accepts
 * the codes or (case-insensitive) English names.
 */
export const INDIA_STATIONS = data as Station[];
registerStations(INDIA_STATIONS);
