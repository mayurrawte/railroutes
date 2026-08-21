import { describe, it, expect } from 'vitest';
import { railRoute, NoRouteError } from '../src/index.js';
import type { RailNetwork } from '../src/types.js';

// A(0,0) — B(1,0): electrified, 1435mm
// B(1,0) — C(2,0): NOT electrified, 1435mm
// B(1,0) — D(1,0.9) — C via D: electrified but longer (~2.15 deg vs 1 deg), 1435mm
// C(2,0) — E(3,0): 1668mm (Iberian gauge break at C)
// E(3,0) — F(4,0): ferry edge
const NET: RailNetwork = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { electrified: true, gauge: '1435' }, geometry: { type: 'LineString', coordinates: [[0, 0], [1, 0]] } },
    { type: 'Feature', properties: { electrified: false, gauge: '1435' }, geometry: { type: 'LineString', coordinates: [[1, 0], [2, 0]] } },
    { type: 'Feature', properties: { electrified: true, gauge: '1435' }, geometry: { type: 'LineString', coordinates: [[1, 0], [1, 0.9], [2, 0]] } },
    { type: 'Feature', properties: { electrified: true, gauge: '1668' }, geometry: { type: 'LineString', coordinates: [[2, 0], [3, 0]] } },
    { type: 'Feature', properties: { ferry: true, gauge: '1435' }, geometry: { type: 'LineString', coordinates: [[3, 0], [4, 0]] } },
  ],
};

describe('edge properties', () => {
  it('electrifiedOnly avoids non-electrified track even when longer', () => {
    const normal = railRoute([0, 0], [2, 0], { network: NET });
    const electric = railRoute([0, 0], [2, 0], { network: NET, electrifiedOnly: true });
    expect(normal.properties.length).toBeLessThan(230);     // direct via B–C
    expect(electric.properties.length).toBeGreaterThan(300); // detour via D
    expect(electric.geometry.coordinates).toContainEqual([1, 0.9]);
  });

  it('ferries: false excludes ferry edges', () => {
    const withFerry = railRoute([2, 0], [4, 0], { network: NET });
    expect(withFerry.properties.length).toBeGreaterThan(200);
    expect(() => railRoute([2, 0], [4, 0], { network: NET, ferries: false })).toThrow(NoRouteError);
  });

  it('gaugeChangePenaltyKm adds cost at a gauge break', () => {
    const free = railRoute([1, 0], [3, 0], { network: NET });
    const penalized = railRoute([1, 0], [3, 0], { network: NET, gaugeChangePenaltyKm: 500 });
    expect(penalized.properties.length).toBeCloseTo(free.properties.length + 500, 0);
  });

  it('reports gaugeChanges and ferryKm on the result', () => {
    const r = railRoute([1, 0], [4, 0], { network: NET });
    expect(r.properties.gaugeChanges).toBe(2);   // 1435→1668 at C, 1668→1435 at E
    expect(r.properties.ferryKm).toBeGreaterThan(100); // the E–F ferry leg ≈ 111 km
  });
});
