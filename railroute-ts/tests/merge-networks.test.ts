import { describe, it, expect } from 'vitest';
import { mergeNetworks, railRoute, NoRouteError } from '../src/index.js';
import type { RailNetwork } from '../src/types.js';

// Two networks that meet at a border but do not share a node: a 0.9 km gap.
const WEST: RailNetwork = {
  type: 'FeatureCollection',
  metadata: { name: 'west', source: 't', license: 'x', builtAt: '2026', bbox: [0, 0, 1, 0], edges: 1, km: 111 },
  features: [{ type: 'Feature', properties: { gauge: '1435' }, geometry: { type: 'LineString', coordinates: [[0, 0], [1, 0]] } }],
};
const EAST: RailNetwork = {
  type: 'FeatureCollection',
  metadata: { name: 'east', source: 't', license: 'x', builtAt: '2026', bbox: [1.008, 0, 2, 0], edges: 1, km: 110 },
  features: [{ type: 'Feature', properties: { gauge: '1520' }, geometry: { type: 'LineString', coordinates: [[1.008, 0], [2, 0]] } }],
};

describe('mergeNetworks', () => {
  it('separately, the two networks cannot route across the border', () => {
    expect(() => railRoute([0, 0], [2, 0], { network: WEST, maxSnapDistanceKm: 50 })).toThrow(); // snaps dst 111 km
    expect(() => railRoute([0, 0], [2, 0], { network: EAST, maxSnapDistanceKm: 50 })).toThrow(); // snaps src 112 km
  });

  it('merged, dead ends within bridgeKm are connected and the route crosses (with a gauge change)', () => {
    const merged = mergeNetworks([WEST, EAST]);
    const r = railRoute([0, 0], [2, 0], { network: merged });
    expect(r.properties.length).toBeGreaterThan(220);
    expect(r.properties.length).toBeLessThan(224);
    expect(r.properties.gaugeChanges).toBe(1);
  });

  it('does not bridge gaps wider than bridgeKm', () => {
    const merged = mergeNetworks([WEST, EAST], { bridgeKm: 0.5 });
    expect(() => railRoute([0, 0], [2, 0], { network: merged })).toThrow(NoRouteError);
  });

  it('merges metadata: names joined, bbox union, edges summed', () => {
    const merged = mergeNetworks([WEST, EAST]);
    expect(merged.metadata?.name).toBe('west+east');
    expect(merged.metadata?.bbox).toEqual([0, 0, 2, 0]);
    expect(merged.metadata?.edges).toBe(3); // 1 + 1 + connector
  });

  it("never bridges dead ends inside the same network (that is the pipeline's job)", () => {
    const merged = mergeNetworks([EAST, { ...WEST, metadata: undefined }]);
    expect(merged.features.filter((f) => f.properties.connector).length).toBe(1);
    const alone = mergeNetworks([WEST]);
    expect(alone.features.length).toBe(1);
  });
});
