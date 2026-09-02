import { describe, it, expect } from 'vitest';
import { railRoute, resolveStation } from '../src/index.js';

describe('India network', () => {
  it('routes New Delhi -> Mumbai CSMT by Indian Railways station codes (~1,384 km)', async () => {
    const { INDIA_NETWORK } = await import('../src/networks/india.js');
    await import('../src/stations/india.js');
    const r = railRoute('NDLS', 'CSMT', { network: INDIA_NETWORK });
    // IR timetable distance New Delhi–Mumbai CSMT via Kota/Vadodara: 1,384 km
    expect(r.properties.length).toBeGreaterThan(1300);
    expect(r.properties.length).toBeLessThan(1500);
    expect(r.properties.originStation).toMatch(/New Delhi/i);
  }, 30_000);

  it('routes Chennai -> Howrah (~1,660 km) and stays on broad gauge', async () => {
    const { INDIA_NETWORK } = await import('../src/networks/india.js');
    await import('../src/stations/india.js');
    const r = railRoute('MAS', 'HWH', { network: INDIA_NETWORK });
    expect(r.properties.length).toBeGreaterThan(1550);
    expect(r.properties.length).toBeLessThan(1800);
    expect(r.properties.gaugeChanges ?? 0).toBe(0);
  }, 30_000);

  it('carries metadata (source, license, bbox) on the bundled network', async () => {
    const { INDIA_NETWORK } = await import('../src/networks/india.js');
    const meta = (INDIA_NETWORK as unknown as { metadata: { name: string; license: string; bbox: number[] } }).metadata;
    expect(meta.name).toBe('india');
    expect(meta.license).toMatch(/ODbL/);
    expect(meta.bbox).toHaveLength(4);
  });

  it('resolves an IR code to coordinates', async () => {
    await import('../src/stations/india.js');
    const [lon, lat] = resolveStation('SBC'); // KSR Bengaluru
    expect(lon).toBeCloseTo(77.57, 0);
    expect(lat).toBeCloseTo(12.98, 0);
  });
});
