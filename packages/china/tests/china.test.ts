import { describe, it, expect } from 'vitest';
import { railRoute } from 'railroute-ts';

describe('China network', () => {
  it('Shanghai -> Beijing ≈ 1,300–1,500 km (Jinghu HSR 1,318 km / conventional 1,463 km)', async () => {
    const { CHINA_NETWORK } = await import('../src/index.js');
    const r = railRoute([121.47, 31.23], [116.4, 39.9], { network: CHINA_NETWORK });
    expect(r.properties.length).toBeGreaterThan(1250);
    expect(r.properties.length).toBeLessThan(1550);
  }, 30_000);

  it('Guangzhou -> Beijing ≈ 2,300 km (Jingguang line 2,298 km)', async () => {
    const { CHINA_NETWORK } = await import('../src/index.js');
    const r = railRoute([113.26, 23.13], [116.4, 39.9], { network: CHINA_NETWORK });
    expect(r.properties.length).toBeGreaterThan(2100);
    expect(r.properties.length).toBeLessThan(2500);
  }, 30_000);

  it('Chongqing -> Alashankou (China–Europe land bridge exit) is routable and long (~3,100–3,800 km)', async () => {
    const { CHINA_NETWORK } = await import('../src/index.js');
    const r = railRoute([106.55, 29.56], [82.57, 45.17], { network: CHINA_NETWORK });
    expect(r.properties.length).toBeGreaterThan(3000);
    expect(r.properties.length).toBeLessThan(4800);
  }, 30_000);

  it('carries ODbL metadata with a China-sized bbox', async () => {
    const { CHINA_NETWORK } = await import('../src/index.js');
    const meta = CHINA_NETWORK.metadata!;
    expect(meta.name).toBe('china');
    expect(meta.license).toMatch(/ODbL/);
    expect(meta.bbox[0]).toBeLessThan(80);
    expect(meta.bbox[2]).toBeGreaterThan(125);
  });
});
