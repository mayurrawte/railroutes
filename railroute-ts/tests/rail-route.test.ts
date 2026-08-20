import { describe, it, expect } from 'vitest';
import { railRoute, NoRouteError } from '../src/index.js';
import { TOY_NETWORK } from './fixtures.js';

describe('railRoute', () => {
  it('routes along the network between two snapped points', () => {
    const r = railRoute([0, 0], [2, 0], { network: TOY_NETWORK });
    expect(r.type).toBe('Feature');
    expect(r.geometry.type).toBe('LineString');
    // A -> B -> C = 2 degrees ≈ 222.6 km
    expect(r.properties.length).toBeGreaterThan(220);
    expect(r.properties.length).toBeLessThan(226);
    expect(r.properties.units).toBe('kilometers');
    // path passes through B
    expect(r.geometry.coordinates).toContainEqual([1, 0]);
  });

  it('routes around, not across: A to D goes via B (~2 deg), not diagonal (~1.41 deg)', () => {
    const r = railRoute([0, 0], [1, 1], { network: TOY_NETWORK });
    expect(r.properties.length).toBeGreaterThan(220); // 2 deg via B, not 157 km diagonal
  });

  it('snaps off-network points to the nearest node', () => {
    const r = railRoute([0.1, 0.05], [1.9, -0.05], { network: TOY_NETWORK });
    expect(r.geometry.coordinates[0]).toEqual([0, 0]);
    expect(r.geometry.coordinates.at(-1)).toEqual([2, 0]);
  });

  it('computes durationHours from speedKmh', () => {
    const r = railRoute([0, 0], [2, 0], { network: TOY_NETWORK, speedKmh: 100 });
    expect(r.properties.durationHours).toBeCloseTo(r.properties.length / 100, 5);
  });

  it('throws NoRouteError when origin and destination are on disconnected components', () => {
    expect(() => railRoute([0, 0], [5, 5], { network: TOY_NETWORK })).toThrow(NoRouteError);
  });
});
