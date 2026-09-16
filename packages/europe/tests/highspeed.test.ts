import { describe, it, expect } from 'vitest';
import { railRoute } from 'railroute-ts';
import { EUROPE_NETWORK } from '../src/index.js';

describe('high-speed lines on the Europe network', () => {
  it('carries highspeed edges (LGVs, AVE, ICE Neubaustrecken)', () => {
    expect(EUROPE_NETWORK.features.filter((f) => f.properties.highspeed).length).toBeGreaterThan(500);
  });

  it("Paris -> Lyon: LGV Sud-Est by default, the longer PLM line with highSpeed: 'exclude'", () => {
    const hsr = railRoute([2.37, 48.84], [4.86, 45.75], { network: EUROPE_NETWORK });
    const conv = railRoute([2.37, 48.84], [4.86, 45.75], { network: EUROPE_NETWORK, highSpeed: 'exclude' });
    expect(hsr.properties.length).toBeGreaterThan(380);
    expect(hsr.properties.length).toBeLessThan(470);
    expect(conv.properties.length).toBeGreaterThan(hsr.properties.length + 40);
    expect(conv.properties.length).toBeLessThan(600);
  });
});
