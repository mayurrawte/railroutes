import { describe, it, expect } from 'vitest';
import { railRoute } from '../src/index.js';
import { EUROPE_NETWORK } from '../src/networks/europe.js';

describe('train ferries on the Europe network', () => {
  it('Rome -> Palermo crosses the Messina strait ferry (~900 km, ferryKm > 0)', () => {
    const r = railRoute([12.5, 41.9], [13.36, 38.12], { network: EUROPE_NETWORK });
    expect(r.properties.length).toBeGreaterThan(700);
    expect(r.properties.length).toBeLessThan(1200);
    expect(r.properties.ferryKm).toBeGreaterThan(1);
  });

  it('with ferries disabled, Sicily is unreachable or the route changes', () => {
    const withF = railRoute([12.5, 41.9], [13.36, 38.12], { network: EUROPE_NETWORK });
    let without: number | null = null;
    try {
      without = railRoute([12.5, 41.9], [13.36, 38.12], { network: EUROPE_NETWORK, ferries: false }).properties.length;
    } catch { /* NoRouteError acceptable */ }
    if (without !== null) expect(without).not.toBe(withF.properties.length);
    else expect(withF.properties.ferryKm).toBeGreaterThan(0);
  });
});
