import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadNetwork, railRoute } from '../src/index.js';
import { TOY_NETWORK } from './fixtures.js';

afterEach(() => vi.unstubAllGlobals());

describe('loadNetwork', () => {
  it('fetches a network usable by railRoute', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(TOY_NETWORK))));
    const net = await loadNetwork('https://example.com/net.json');
    const r = railRoute([0, 0], [2, 0], { network: net });
    expect(r.properties.length).toBeGreaterThan(220);
  });

  it('throws a clear error on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })));
    await expect(loadNetwork('https://example.com/missing.json')).rejects.toThrow(/404/);
  });

  it('rejects payloads that are not a GeoJSON FeatureCollection', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ hello: 'world' }))));
    await expect(loadNetwork('https://example.com/bad.json')).rejects.toThrow(/FeatureCollection/);
  });
});
