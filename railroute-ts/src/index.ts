import type { Position, RailNetwork, RailRouteOptions, RailRouteFeature } from './types.js';

export type { RailNetwork, RailRouteOptions, RailRouteFeature, Position } from './types.js';

export class NoRouteError extends Error {
  constructor(message = 'No rail route found between origin and destination') {
    super(message);
    this.name = 'NoRouteError';
  }
}

function distKm(a: Position, b: Position): number {
  const dx = (b[0] - a[0]) * Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180) * 111.32;
  const dy = (b[1] - a[1]) * 111.32;
  return Math.hypot(dx, dy);
}

const key = (p: Position) => `${p[0]},${p[1]}`;

interface Graph {
  adj: Map<string, Array<{ to: string; km: number }>>;
  coord: Map<string, Position>;
}

const graphCache = new WeakMap<RailNetwork, Graph>();

function buildGraph(network: RailNetwork): Graph {
  const cached = graphCache.get(network);
  if (cached) return cached;
  const adj: Graph['adj'] = new Map();
  const coord: Graph['coord'] = new Map();
  const link = (a: Position, b: Position) => {
    const ka = key(a), kb = key(b);
    coord.set(ka, a); coord.set(kb, b);
    const km = distKm(a, b);
    if (!adj.has(ka)) adj.set(ka, []);
    if (!adj.has(kb)) adj.set(kb, []);
    adj.get(ka)!.push({ to: kb, km });
    adj.get(kb)!.push({ to: ka, km });
  };
  for (const f of network.features) {
    const c = f.geometry.coordinates;
    for (let i = 0; i < c.length - 1; i++) link(c[i], c[i + 1]);
  }
  const g = { adj, coord };
  graphCache.set(network, g);
  return g;
}

function snap(g: Graph, p: Position): string {
  let best = '', bestKm = Infinity;
  for (const [k, c] of g.coord) {
    const d = distKm(c, p);
    if (d < bestKm) { bestKm = d; best = k; }
  }
  return best;
}

class MinHeap {
  private a: Array<[number, string]> = [];
  get size() { return this.a.length; }
  push(item: [number, string]) {
    const a = this.a;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): [number, string] {
    const a = this.a;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

function dijkstra(g: Graph, src: string, dst: string): { km: number; path: string[] } | null {
  const dist = new Map<string, number>([[src, 0]]);
  const prev = new Map<string, string>();
  const pq = new MinHeap();
  pq.push([0, src]);
  const done = new Set<string>();
  while (pq.size) {
    const [du, u] = pq.pop();
    if (u === dst) break;
    if (done.has(u)) continue;
    done.add(u);
    for (const { to, km } of g.adj.get(u) ?? []) {
      const nd = du + km;
      if (nd < (dist.get(to) ?? Infinity)) {
        dist.set(to, nd);
        prev.set(to, u);
        pq.push([nd, to]);
      }
    }
  }
  if (!dist.has(dst)) return null;
  const path = [dst];
  while (path[path.length - 1] !== src) path.push(prev.get(path[path.length - 1])!);
  return { km: dist.get(dst)!, path: path.reverse() };
}

export function railRoute(origin: Position, destination: Position, options: RailRouteOptions): RailRouteFeature {
  const g = buildGraph(options.network);
  const src = snap(g, origin);
  const dst = snap(g, destination);
  const result = dijkstra(g, src, dst);
  if (!result) throw new NoRouteError();
  const coordinates = result.path.map((k) => g.coord.get(k)!);
  const properties: RailRouteFeature['properties'] = {
    length: result.km,
    units: 'kilometers',
  };
  if (options.speedKmh) properties.durationHours = result.km / options.speedKmh;
  return { type: 'Feature', properties, geometry: { type: 'LineString', coordinates } };
}

/** Fetch a rail network (GeoJSON FeatureCollection of LineStrings) at runtime. */
export async function loadNetwork(url: string): Promise<RailNetwork> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`loadNetwork: ${url} responded ${res.status} ${res.statusText}`.trim());
  }
  const data = (await res.json()) as RailNetwork;
  if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    throw new Error('loadNetwork: payload is not a GeoJSON FeatureCollection');
  }
  return data;
}
