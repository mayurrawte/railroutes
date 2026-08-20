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

const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

function dijkstra(
  g: Graph,
  src: string,
  dst: string,
  banned?: Set<string>,
): { km: number; path: string[] } | null {
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
      if (banned && banned.has(edgeKey(u, to))) continue;
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


export interface Station {
  code: string;
  name: string;
  coord: Position;
}

const stationsByCode = new Map<string, Station>();
const stationsByName = new Map<string, Station>();

/** Register stations so railRoute can accept their codes/names as endpoints. */
export function registerStations(stations: Station[]): void {
  for (const s of stations) {
    stationsByCode.set(s.code, s);
    stationsByName.set(s.name.toLowerCase(), s);
  }
}

function stationFor(id: string): Station | undefined {
  return stationsByCode.get(id) ?? stationsByName.get(id.toLowerCase());
}

/** Resolve a station code or (case-insensitive) name to coordinates. */
export function resolveStation(id: string): Position {
  const s = stationFor(id);
  if (!s) throw new Error(`Unknown station: ${id}`);
  return s.coord;
}

export function railRoute(
  origin: Position | string,
  destination: Position | string,
  options: RailRouteOptions,
): RailRouteFeature {
  const originStation = typeof origin === 'string' ? stationFor(origin) : undefined;
  const destinationStation = typeof destination === 'string' ? stationFor(destination) : undefined;
  const o = typeof origin === 'string' ? resolveStation(origin) : origin;
  const d = typeof destination === 'string' ? resolveStation(destination) : destination;
  const g = buildGraph(options.network);
  const src = snap(g, o);
  const dst = snap(g, d);
  const result = dijkstra(g, src, dst);
  if (!result) throw new NoRouteError();
  const coordinates = result.path.map((k) => g.coord.get(k)!);
  const properties: RailRouteFeature['properties'] = {
    length: result.km,
    units: 'kilometers',
  };
  if (options.speedKmh) properties.durationHours = result.km / options.speedKmh;
  if (originStation) properties.originStation = originStation.name;
  if (destinationStation) properties.destinationStation = destinationStation.name;
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

function toFeature(
  g: Graph,
  km: number,
  path: string[],
  options: { speedKmh?: number },
): RailRouteFeature {
  const properties: RailRouteFeature['properties'] = { length: km, units: 'kilometers' };
  if (options.speedKmh) properties.durationHours = km / options.speedKmh;
  return {
    type: 'Feature',
    properties,
    geometry: { type: 'LineString', coordinates: path.map((k) => g.coord.get(k)!) },
  };
}

export interface RailRouteAlternativesOptions extends RailRouteOptions {
  /** Number of routes to return (baseline + up to k-1 alternatives). Default 3. */
  k?: number;
}

/**
 * K-shortest routes (Yen's algorithm): the baseline plus up to k-1 distinct
 * alternatives, sorted by length. Returns fewer when the network offers fewer.
 */
export function railRouteAlternatives(
  origin: Position | string,
  destination: Position | string,
  options: RailRouteAlternativesOptions,
): RailRouteFeature[] {
  const k = options.k ?? 3;
  const o = typeof origin === 'string' ? resolveStation(origin) : origin;
  const d = typeof destination === 'string' ? resolveStation(destination) : destination;
  const g = buildGraph(options.network);
  const src = snap(g, o);
  const dst = snap(g, d);

  const best = dijkstra(g, src, dst);
  if (!best) throw new NoRouteError();

  const accepted: Array<{ km: number; path: string[] }> = [best];
  const candidates: Array<{ km: number; path: string[] }> = [];
  const seen = new Set<string>([best.path.join('>')]);

  while (accepted.length < k) {
    const prev = accepted[accepted.length - 1];
    for (let i = 0; i < prev.path.length - 1; i++) {
      const spur = prev.path[i];
      const rootPath = prev.path.slice(0, i + 1);
      const banned = new Set<string>();
      for (const a of accepted) {
        if (a.path.length > i && a.path.slice(0, i + 1).join('>') === rootPath.join('>')) {
          banned.add(edgeKey(a.path[i], a.path[i + 1]));
        }
      }
      // ban revisiting root nodes (except the spur itself) via their edges
      const rootSet = new Set(rootPath.slice(0, -1));
      for (const n of rootSet) for (const { to } of g.adj.get(n) ?? []) banned.add(edgeKey(n, to));

      const spurResult = dijkstra(g, spur, dst, banned);
      if (!spurResult) continue;
      const path = [...rootPath.slice(0, -1), ...spurResult.path];
      const key = path.join('>');
      if (seen.has(key)) continue;
      seen.add(key);
      let km = spurResult.km;
      for (let j = 0; j < i; j++) {
        const edges = g.adj.get(prev.path[j]) ?? [];
        km += edges.find((e) => e.to === prev.path[j + 1])?.km ?? 0;
      }
      candidates.push({ km, path });
    }
    if (!candidates.length) break;
    candidates.sort((a, b) => a.km - b.km);
    accepted.push(candidates.shift()!);
  }

  return accepted
    .sort((a, b) => a.km - b.km)
    .map((r) => toFeature(g, r.km, r.path, options));
}

/**
 * Multi-leg itinerary: routes through every waypoint in order and returns one
 * continuous Feature with per-leg distances in properties.legs.
 */
export function railRouteMulti(
  points: Array<Position | string>,
  options: RailRouteOptions,
): RailRouteFeature {
  if (points.length < 2) throw new Error('railRouteMulti needs at least two points');
  const legs: number[] = [];
  const coordinates: Position[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const leg = railRoute(points[i], points[i + 1], options);
    legs.push(leg.properties.length);
    total += leg.properties.length;
    const c = leg.geometry.coordinates;
    coordinates.push(...(i === 0 ? c : c.slice(1)));
  }
  const properties: RailRouteFeature['properties'] = {
    length: total,
    units: 'kilometers',
    legs,
  };
  if (options.speedKmh) properties.durationHours = total / options.speedKmh;
  return { type: 'Feature', properties, geometry: { type: 'LineString', coordinates } };
}
