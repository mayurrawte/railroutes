import { describe, it, expect } from 'vitest';
import { railRoute, railRouteAlternatives, railRouteMulti, SnapFailedError } from '../src/index.js';
import { TOY_NETWORK } from './fixtures.js';

// TOY_NETWORK lives around lon 0..2, lat 0. [-30, 0] is ~3,300 km west of node A.
const FAR: [number, number] = [-30, 0];

describe('maxSnapDistanceKm', () => {
  it('railRoute throws SnapFailedError when the origin is farther than the limit', () => {
    expect(() => railRoute(FAR, [2, 0], { network: TOY_NETWORK, maxSnapDistanceKm: 50 })).toThrow(SnapFailedError);
  });

  it('the error names the endpoint and carries the snap distance', () => {
    try {
      railRoute([0, 0], FAR, { network: TOY_NETWORK, maxSnapDistanceKm: 50 });
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(SnapFailedError);
      const err = e as SnapFailedError;
      expect(err.endpoint).toBe('destination');
      expect(err.distanceKm).toBeGreaterThan(3000);
      expect(err.message).toMatch(/destination/);
    }
  });

  it('routes normally when the point is within the limit', () => {
    const r = railRoute([0, 0.01], [2, 0], { network: TOY_NETWORK, maxSnapDistanceKm: 50 });
    expect(r.properties.length).toBeGreaterThan(0);
  });

  it('is unlimited by default (backwards compatible)', () => {
    const r = railRoute(FAR, [2, 0], { network: TOY_NETWORK });
    expect(r.properties.length).toBeGreaterThan(0);
  });

  it('reports originSnapKm and destinationSnapKm on the result', () => {
    const r = railRoute([0, 0.01], [2, 0], { network: TOY_NETWORK });
    expect(r.properties.originSnapKm).toBeGreaterThan(1);
    expect(r.properties.originSnapKm).toBeLessThan(2);
    expect(r.properties.destinationSnapKm).toBeCloseTo(0, 3);
  });

  it('railRouteAlternatives and railRouteMulti honour the limit too', () => {
    expect(() => railRouteAlternatives(FAR, [2, 0], { network: TOY_NETWORK, maxSnapDistanceKm: 50, k: 2 })).toThrow(SnapFailedError);
    expect(() => railRouteMulti([[0, 0], FAR], { network: TOY_NETWORK, maxSnapDistanceKm: 50 })).toThrow(SnapFailedError);
  });
});
