import { describe, it, expect } from 'vitest';
import { railRoute, registerStations } from 'railroute-ts';
import { CHINA_NETWORK, CHINA_STATIONS } from '../src/index.js';

registerStations(CHINA_STATIONS);

describe('China stations (English names)', () => {
  it('ships a few thousand named stations', () => {
    expect(CHINA_STATIONS.length).toBeGreaterThan(5000);
    // metro stops are filtered out (these were Chongqing Rail Transit stops in the raw data)
    const names = new Set(CHINA_STATIONS.map((s) => s.name));
    expect(names.has('Chongqing Library')).toBe(false);
    expect(names.has('Chongqing North Station South Square')).toBe(false);
    expect(names.has('Shanghai-Hongqiao')).toBe(true);
  });
  it('routes Shanghai-Hongqiao -> Beijing by English name (~1,300 km)', () => {
    const r = railRoute('Shanghai-Hongqiao', 'Beijing', { network: CHINA_NETWORK });
    expect(r.properties.length).toBeGreaterThan(1200);
    expect(r.properties.length).toBeLessThan(1500);
  }, 30_000);
});
