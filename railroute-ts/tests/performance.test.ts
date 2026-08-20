import { describe, it, expect } from 'vitest';
import { railRoute } from '../src/index.js';
import { CORRIDOR_NETWORK } from '../src/networks/corridor.js';

const ROTTERDAM: [number, number] = [4.47, 51.92];
const GENOA: [number, number] = [8.92, 44.41];

describe('performance', () => {
  it('caches the built graph: 10 warm calls cost less than 5 cold calls', () => {
    // a structural clone is a different object -> cache miss -> cold build
    const coldNetwork = { ...CORRIDOR_NETWORK, features: [...CORRIDOR_NETWORK.features] };
    const t0 = performance.now();
    railRoute(ROTTERDAM, GENOA, { network: coldNetwork });
    const cold = performance.now() - t0;

    railRoute(ROTTERDAM, GENOA, { network: CORRIDOR_NETWORK }); // warm the cache
    const t1 = performance.now();
    for (let i = 0; i < 10; i++) railRoute(ROTTERDAM, GENOA, { network: CORRIDOR_NETWORK });
    const warm10 = performance.now() - t1;

    expect(warm10).toBeLessThan(cold * 5);
  });
});
