import { describe, it, expect } from 'vitest';
import { railRoute, registerStations, resolveStation } from '../src/index.js';
import { TOY_NETWORK } from './fixtures.js';

const TOY_STATIONS = [
  { code: '8400001', name: 'Alpha Central', coord: [0, 0] as [number, number] },
  { code: '8400002', name: 'Charlie Terminal', coord: [2, 0] as [number, number] },
];

describe('stations', () => {
  it('resolves a registered UIC code to its coordinates', () => {
    registerStations(TOY_STATIONS);
    expect(resolveStation('8400001')).toEqual([0, 0]);
  });

  it('resolves a station by exact name, case-insensitively', () => {
    registerStations(TOY_STATIONS);
    expect(resolveStation('alpha central')).toEqual([0, 0]);
  });

  it('railRoute accepts station codes as origin/destination', () => {
    registerStations(TOY_STATIONS);
    const r = railRoute('8400001', '8400002', { network: TOY_NETWORK });
    expect(r.properties.length).toBeGreaterThan(220);
    expect(r.properties.originStation).toBe('Alpha Central');
    expect(r.properties.destinationStation).toBe('Charlie Terminal');
  });

  it('throws a clear error for an unknown station identifier', () => {
    registerStations(TOY_STATIONS);
    expect(() => railRoute('9999999', '8400002', { network: TOY_NETWORK }))
      .toThrow(/Unknown station/);
  });
});
