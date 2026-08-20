import { describe, it, expect } from 'vitest';
import { railRoute } from '../src/index.js';
import { CORRIDOR_NETWORK } from '../src/networks/corridor.js';

const ROTTERDAM: [number, number] = [4.47, 51.92];
const GENOA: [number, number] = [8.92, 44.41];
const BASEL: [number, number] = [7.59, 47.55];

describe('bundled Rhine-Alpine corridor network', () => {
  it('routes Rotterdam -> Genoa at a realistic rail distance (~1,200 km)', () => {
    const r = railRoute(ROTTERDAM, GENOA, { network: CORRIDOR_NETWORK });
    expect(r.properties.length).toBeGreaterThan(1100);
    expect(r.properties.length).toBeLessThan(1350);
  });

  it('routes Rotterdam -> Basel (~700 km)', () => {
    const r = railRoute(ROTTERDAM, BASEL, { network: CORRIDOR_NETWORK });
    expect(r.properties.length).toBeGreaterThan(650);
    expect(r.properties.length).toBeLessThan(800);
  });

  it('answers in under 5 seconds', () => {
    const t0 = performance.now();
    railRoute(ROTTERDAM, GENOA, { network: CORRIDOR_NETWORK });
    expect(performance.now() - t0).toBeLessThan(5000);
  });
});
