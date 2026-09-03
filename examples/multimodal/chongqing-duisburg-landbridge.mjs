// All-rail China–Europe land bridge vs. the sea route, for the same door-to-door pair.
import { mergeNetworks } from 'railroute-ts';
import { CHINA_NETWORK } from '@railroute-ts/china';
import { CIS_NETWORK } from '@railroute-ts/cis';
import { EUROPE_NETWORK, EUROPE_STATIONS } from '@railroute-ts/europe';
import { sea, rail, report, registerStations } from './_lib.mjs';

registerStations(EUROPE_STATIONS);
const EURASIA = mergeNetworks([CHINA_NETWORK, CIS_NETWORK, EUROPE_NETWORK]);
report('Chongqing → Duisburg by rail (land bridge, 1435 → 1520 → 1435 mm)', [
  rail([106.55, 29.56], 'Duisburg Hauptbahnhof', EURASIA, { gaugeChangePenaltyKm: 300 }),
]);
report('Chongqing → Duisburg by sea (rail to Shanghai, ship to Rotterdam, rail to Duisburg)', [
  rail([106.55, 29.56], [121.47, 31.23], CHINA_NETWORK),
  sea('CNSHA', 'NLRTM'),
  rail([4.47, 51.92], 'Duisburg Hauptbahnhof', EUROPE_NETWORK),
]);
