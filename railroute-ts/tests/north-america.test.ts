import { describe, it, expect } from 'vitest';
import { railRoute, NETWORK_URLS } from '../src/index.js';
import { NORTH_AMERICA_NETWORK as NA } from '../src/networks/north-america.js';

describe('North America network (FRA/BTS NARN)', () => {
  it('Los Angeles -> Chicago ≈ 3,540 km (BNSF Transcon ≈ 2,200 mi)', () => {
    const r = railRoute([-118.24, 34.05], [-87.63, 41.88], { network: NA });
    expect(r.properties.length).toBeGreaterThan(3300);
    expect(r.properties.length).toBeLessThan(3900);
    expect(r.properties.gaugeChanges ?? 0).toBe(0);
  }, 30_000);

  it('Vancouver -> Toronto stays inside Canada-connected mainline (~4,400–4,700 km)', () => {
    const r = railRoute([-123.1, 49.28], [-79.38, 43.65], { network: NA });
    expect(r.properties.length).toBeGreaterThan(4200);
    expect(r.properties.length).toBeLessThan(4900);
  }, 30_000);

  it('Laredo -> Mexico City crosses the border into the Mexican network (~1,200 km)', () => {
    const r = railRoute([-99.5, 27.5], [-99.13, 19.43], { network: NA });
    expect(r.properties.length).toBeGreaterThan(1000);
    expect(r.properties.length).toBeLessThan(1500);
  }, 30_000);

  it('carries public-domain metadata and exposes the CDN URL', () => {
    expect(NA.metadata?.license).toMatch(/Public domain/);
    expect(NA.metadata?.edges).toBeGreaterThan(10000);
    expect(NETWORK_URLS.northAmerica).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/gh\/mayurrawte\/railroutes@networks-v1\/.*north-america-v0\.json$/);
  });
});
