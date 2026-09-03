import 'searoute-ts/ports';
import 'searoute-ts/eca';
import { seaRoute } from 'searoute-ts';
import { railRoute, registerStations } from 'railroute-ts';

const km = (n) => `${Math.round(n).toLocaleString('en')} km`;

/** Sea leg between UN/LOCODE port codes or [lon, lat], with a rough CO₂e. */
export function sea(origin, destination, opts = {}) {
  const r = seaRoute(origin, destination, { units: 'kilometers', emissions: true, vesselClass: 'panamax', returnPassages: true, ...opts });
  const p = r.properties;
  return { mode: 'sea', from: origin, to: destination, km: p.length, co2eTonnes: p.co2eTonnes, via: p.passages ?? [], geojson: r };
}

/** Rail leg on a given network; origin/destination may be station names/codes or [lon, lat]. */
export function rail(origin, destination, network, opts = {}) {
  const r = railRoute(origin, destination, { network, speedKmh: 60, ...opts });
  const p = r.properties;
  return { mode: 'rail', from: origin, to: destination, km: p.length, hours: p.durationHours, gaugeChanges: p.gaugeChanges ?? 0, ferryKm: p.ferryKm ?? 0, geojson: r };
}

export function report(title, legs) {
  console.log(`\n${title}`);
  let total = 0;
  for (const l of legs) {
    total += l.km;
    const extra = l.mode === 'sea'
      ? `${l.via.length ? 'via ' + l.via.join(', ') + ', ' : ''}~${l.co2eTonnes.toFixed(0)} t CO₂e (panamax, rough)`
      : `~${l.hours.toFixed(0)} h at 60 km/h${l.gaugeChanges ? `, ${l.gaugeChanges} gauge change(s)` : ''}${l.ferryKm ? `, ${km(l.ferryKm)} by train ferry` : ''}`;
    console.log(`  ${l.mode.padEnd(4)} ${String(l.from).padEnd(28)} → ${String(l.to).padEnd(28)} ${km(l.km).padStart(10)}   ${extra}`);
  }
  console.log(`  ${'total'.padEnd(4)} ${''.padEnd(59)} ${km(total).padStart(10)}`);
}

export { registerStations };
