import { describe, it, expect } from 'vitest';
import { railRoute } from '../src/index.js';
import { EUROPE_NETWORK } from '../src/networks/europe.js';
import '../src/stations/europe.js';

describe('bundled Europe stations', () => {
  it('routes St Pancras International -> Wien Hauptbahnhof (~1,600 km)', () => {
    const r = railRoute('London St. Pancras International', 'Wien Hauptbahnhof', { network: EUROPE_NETWORK });
    expect(r.properties.length).toBeGreaterThan(1400);
    expect(r.properties.length).toBeLessThan(2000);
  });

  it('routes by UIC code: Warszawa Centralna (5100065) -> Wien Hauptbahnhof (8101003)', () => {
    const r = railRoute('5100065', '8101003', { network: EUROPE_NETWORK });
    expect(r.properties.length).toBeGreaterThan(600); // ~700 km real-world
    expect(r.properties.length).toBeLessThan(900);
    expect(r.properties.originStation).toBe('Warszawa Centralna');
  });
});
