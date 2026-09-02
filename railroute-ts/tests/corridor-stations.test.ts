import { describe, it, expect } from 'vitest';
import { railRoute, registerStations } from '../src/index.js';
import { CORRIDOR_NETWORK } from '../src/networks/corridor.js';
import { CORRIDOR_STATIONS } from '../src/stations/corridor.js';
registerStations(CORRIDOR_STATIONS);

describe('bundled corridor stations', () => {
  it('routes by UIC code: Rotterdam Centraal (8400530) -> Milano Centrale (8301700)', () => {
    const r = railRoute('8400530', '8301700', { network: CORRIDOR_NETWORK });
    expect(r.properties.length).toBeGreaterThan(850);
    expect(r.properties.length).toBeLessThan(1100);
    expect(r.properties.originStation).toBe('Rotterdam Centraal');
  });

  it('routes by station name', () => {
    const r = railRoute('Basel SBB', 'Milano Centrale', { network: CORRIDOR_NETWORK });
    expect(r.properties.length).toBeGreaterThan(200);
    expect(r.properties.length).toBeLessThan(350); // ~280 km real-world
  });
});
