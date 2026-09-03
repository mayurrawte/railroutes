// India: sea to Mundra (Gujarat), rail to the Tughlakabad ICD in Delhi by Indian Railways station code.
import { INDIA_NETWORK, INDIA_STATIONS } from '@railroute-ts/india';
import { sea, rail, report, registerStations } from './_lib.mjs';

registerStations(INDIA_STATIONS);
report('Jebel Ali → Mundra → Tughlakabad ICD (sea + rail)', [
  sea('AEJEA', 'INMUN'),
  rail([69.72, 22.84], 'TKD', INDIA_NETWORK),   // Mundra Port terminal → Tughlakabad (IR code TKD)
]);
