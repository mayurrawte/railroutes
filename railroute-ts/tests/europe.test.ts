import { describe, it, expect } from 'vitest';
import { railRoute } from '../src/index.js';
import { EUROPE_NETWORK } from '../src/networks/europe.js';

const km = (a: [number, number], b: [number, number]) =>
  railRoute(a, b, { network: EUROPE_NETWORK }).properties.length;

describe('bundled Europe network', () => {
  it('Lisbon -> Warsaw (~3,000 km real-world rail)', () => {
    const d = km([-9.14, 38.71], [21.0, 52.23]);
    expect(d).toBeGreaterThan(2600);
    expect(d).toBeLessThan(3900);
  });

  it('Stockholm -> Rome (~2,600 km)', () => {
    const d = km([18.06, 59.33], [12.5, 41.9]);
    expect(d).toBeGreaterThan(2300);
    expect(d).toBeLessThan(3100);
  });

  it('London -> Vienna via the Channel Tunnel (~1,600 km)', () => {
    const d = km([-0.12, 51.53], [16.37, 48.19]);
    expect(d).toBeGreaterThan(1400);
    expect(d).toBeLessThan(2000);
  });

  it('Rotterdam -> Genoa matches the corridor network result (~1,183 km)', () => {
    const d = km([4.47, 51.92], [8.92, 44.41]);
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1350);
  });
});
