import { describe, it, expect } from 'vitest';
import { railRoute, mergeNetworks, registerStations } from 'railroute-ts';
import { CHINA_NETWORK } from '@railroute-ts/china';
import { EUROPE_NETWORK, EUROPE_STATIONS } from '@railroute-ts/europe';
import { CIS_NETWORK, CIS_STATIONS } from '../src/index.js';

registerStations(EUROPE_STATIONS);
registerStations(CIS_STATIONS);

describe('CIS network', () => {
  it('Moscow -> Vladivostok ≈ 8,500–9,900 km (Trans-Siberian 9,289 km; the shortest path may cut through Manchuria via Manzhouli)', () => {
    const r = railRoute([37.66, 55.77], [131.88, 43.11], { network: mergeNetworks([CIS_NETWORK, CHINA_NETWORK]) });
    expect(r.properties.length).toBeGreaterThan(8400);
    expect(r.properties.length).toBeLessThan(9900);
  }, 60_000);

  it('Moscow -> Almaty ≈ 3,900–4,800 km, all 1520 mm', () => {
    const r = railRoute([37.66, 55.77], [76.94, 43.24], { network: mergeNetworks([CIS_NETWORK, CHINA_NETWORK]) });
    expect(r.properties.length).toBeGreaterThan(3600);
    expect(r.properties.length).toBeLessThan(4800);
    expect(r.properties.gaugeChanges ?? 0).toBe(0);
  }, 60_000);
});

describe('Eurasia land bridge (china + cis + europe)', () => {
  const EURASIA = mergeNetworks([CHINA_NETWORK, CIS_NETWORK, EUROPE_NETWORK]);

  it('Chongqing -> Duisburg ≈ 10,000–12,000 km with two gauge changes', () => {
    const r = railRoute([106.55, 29.56], [6.78, 51.43], { network: EURASIA, gaugeChangePenaltyKm: 300 });
    expect(r.properties.length).toBeGreaterThan(9500);
    expect(r.properties.length).toBeLessThan(12500);
    expect(r.properties.gaugeChanges).toBe(2);
  }, 120_000);

  it('Beijing -> Moscow ≈ 7,500–8,500 km (Trans-Mongolian 7,826 km)', () => {
    const r = railRoute([116.4, 39.9], [37.66, 55.77], { network: EURASIA });
    expect(r.properties.length).toBeGreaterThan(7000);
    expect(r.properties.length).toBeLessThan(8800);
  }, 120_000);
});
