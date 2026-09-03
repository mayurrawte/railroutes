// Asia → Europe, sea to Rotterdam then rail to the Duisburg inland port.
import { EUROPE_NETWORK, EUROPE_STATIONS } from '@railroute-ts/europe';
import { sea, rail, report, registerStations } from './_lib.mjs';

registerStations(EUROPE_STATIONS);
report('Shanghai → Rotterdam → Duisburg (sea + rail)', [
  sea('CNSHA', 'NLRTM'),
  rail([4.47, 51.92], 'Duisburg Hauptbahnhof', EUROPE_NETWORK),
]);
report('…and the Red-Sea-disruption variant (no Suez / Bab-el-Mandeb)', [
  sea('CNSHA', 'NLRTM', { restrictions: ['suez', 'babelmandeb'] }),
  rail([4.47, 51.92], 'Duisburg Hauptbahnhof', EUROPE_NETWORK),
]);
