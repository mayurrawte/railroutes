import { describe, it, expect } from 'vitest';
import { railRoute, registerStations } from 'railroute-ts';
import { NORTH_AMERICA_NETWORK, NORTH_AMERICA_STATIONS } from '../src/index.js';

registerStations(NORTH_AMERICA_STATIONS);

describe('North America stations (Amtrak / VIA)', () => {
  it('ships the Amtrak / VIA station list (OSM network=Amtrak|VIA)', () => {
    expect(NORTH_AMERICA_STATIONS.length).toBeGreaterThan(500);
  });
  it('routes Los Angeles Union Station -> Chicago Union Station by name (~3,400 km)', () => {
    const r = railRoute('Los Angeles Union Station', 'Chicago Union Station', { network: NORTH_AMERICA_NETWORK });
    expect(r.properties.length).toBeGreaterThan(3200);
    expect(r.properties.length).toBeLessThan(3700);
    expect(r.properties.originStation).toMatch(/Los Angeles/i);
  }, 30_000);
});
