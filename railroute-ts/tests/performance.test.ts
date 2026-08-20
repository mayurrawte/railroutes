import { describe, it, expect } from 'vitest';
import { railRoute } from '../src/index.js';
import { CORRIDOR_NETWORK } from '../src/networks/corridor.js';

const ROTTERDAM: [number, number] = [4.47, 51.92];
const GENOA: [number, number] = [8.92, 44.41];

describe('performance', () => {
  it('caches the built graph: 10 repeat calls take well under 1s total', () => {
    railRoute(ROTTERDAM, GENOA, { network: CORRIDOR_NETWORK }); // warm
    const t0 = performance.now();
    for (let i = 0; i < 10; i++) {
      railRoute(ROTTERDAM, GENOA, { network: CORRIDOR_NETWORK });
    }
    const elapsed = performance.now() - t0;
    expect(elapsed).toBeLessThan(300);
  });
});
