// Trans-Pacific: sea to Los Angeles / Long Beach, rail on the FRA network to Chicago.
import { NORTH_AMERICA_NETWORK, NORTH_AMERICA_STATIONS } from '@railroute-ts/north-america';
import { sea, rail, report, registerStations } from './_lib.mjs';

registerStations(NORTH_AMERICA_STATIONS);
report('Shanghai → Los Angeles → Chicago (sea + rail)', [
  sea('CNSHA', 'USLAX'),
  rail('Los Angeles Union Station', 'Chicago Union Station', NORTH_AMERICA_NETWORK),
]);
