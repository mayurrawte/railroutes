import { describe, it, expect } from 'vitest';
import { railRouteAlternatives, railRouteMulti, NoRouteError } from '../src/index.js';
import { TOY_NETWORK } from './fixtures.js';
import type { RailNetwork } from '../src/types.js';

// Diamond network: two distinct paths A->C, unequal lengths.
//   A(0,0) — B(1,0) — C(2,0)        (2 deg via bottom)
//   A(0,0) — D(0.8,0.6) — C(2,0)    (~2.34 deg via top)
const DIAMOND: RailNetwork = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[0, 0], [1, 0]] } },
    { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[1, 0], [2, 0]] } },
    { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[0, 0], [0.8, 0.6]] } },
    { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[0.8, 0.6], [2, 0]] } },
  ],
};

describe('railRouteAlternatives', () => {
  it('returns the shortest route first, then distinct alternatives, sorted by length', () => {
    const routes = railRouteAlternatives([0, 0], [2, 0], { network: DIAMOND, k: 2 });
    expect(routes.length).toBe(2);
    expect(routes[0].properties.length).toBeLessThan(routes[1].properties.length);
    // best path goes via B, alternative via D
    expect(routes[0].geometry.coordinates).toContainEqual([1, 0]);
    expect(routes[1].geometry.coordinates).toContainEqual([0.8, 0.6]);
  });

  it('returns only the baseline when no alternative exists', () => {
    const routes = railRouteAlternatives([0, 0], [2, 0], { network: TOY_NETWORK, k: 3 });
    expect(routes.length).toBe(1); // linear network: one path only
  });

  it('throws NoRouteError when even the baseline is unreachable', () => {
    expect(() => railRouteAlternatives([0, 0], [5, 5], { network: TOY_NETWORK, k: 2 }))
      .toThrow(NoRouteError);
  });
});

describe('railRouteMulti', () => {
  it('routes through waypoints in order and sums the leg lengths', () => {
    // A -> C -> D on the toy network: A->C = 2 deg, C->D = back to B then up = 2 deg
    const r = railRouteMulti([[0, 0], [2, 0], [1, 1]], { network: TOY_NETWORK });
    expect(r.properties.length).toBeGreaterThan(440); // ~4 deg ≈ 445 km
    expect(r.properties.legs).toHaveLength(2);
    expect(r.properties.legs![0] + r.properties.legs![1]).toBeCloseTo(r.properties.length, 6);
    // continuous geometry passing through the C waypoint
    expect(r.geometry.coordinates).toContainEqual([2, 0]);
  });

  it('requires at least two points', () => {
    expect(() => railRouteMulti([[0, 0]], { network: TOY_NETWORK })).toThrow(/at least two/i);
  });
});

describe('railRouteAlternatives on the real corridor', () => {
  it('finds 2 distinct Basel->Milano routes in reasonable time', async () => {
    const { CORRIDOR_NETWORK } = await import('../src/networks/corridor.js');
    const t0 = performance.now();
    const routes = railRouteAlternatives([7.59, 47.55], [9.19, 45.49], { network: CORRIDOR_NETWORK, k: 2 });
    const elapsed = performance.now() - t0;
    expect(routes.length).toBe(2);
    expect(routes[1].properties.length).toBeGreaterThan(routes[0].properties.length);
    // a genuine alternative, not a near-duplicate detour
    expect(routes[1].properties.length).toBeLessThan(routes[0].properties.length * 2);
    expect(elapsed).toBeLessThan(10_000);
  }, 60_000);
});

describe('railRouteAlternatives worst case', () => {
  it('Rotterdam->Genoa k=3 stays under 10s (spur sampling)', async () => {
    const { CORRIDOR_NETWORK } = await import('../src/networks/corridor.js');
    const t0 = performance.now();
    const routes = railRouteAlternatives([4.47, 51.92], [8.92, 44.41], { network: CORRIDOR_NETWORK, k: 3 });
    expect(routes.length).toBeGreaterThanOrEqual(2);
    expect(performance.now() - t0).toBeLessThan(10_000);
  }, 120_000);
});
