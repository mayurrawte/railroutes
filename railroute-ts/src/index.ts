import type { Position, RailNetwork, RailRouteOptions, RailRouteFeature } from './types.js';

export type { RailNetwork, RailNetworkMetadata, RailRouteOptions, RailRouteFeature, Position } from './types.js';

export class SnapFailedError extends Error {
  constructor(
    public readonly endpoint: 'origin' | 'destination',
    public readonly distanceKm: number,
    public readonly maxSnapDistanceKm: number,
  ) {
    super(
      `${endpoint} is ${distanceKm.toFixed(1)} km from the nearest rail node (limit ${maxSnapDistanceKm} km)`,
    );
    this.name = 'SnapFailedError';
  }
}

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

interface Edge {
  to: string;
  km: number;
  gauge?: string;
  electrified?: boolean;
  ferry?: boolean;
}

interface Graph {
  adj: Map<string, Edge[]>;
  coord: Map<string, Position>;
}

const graphCache = new WeakMap<RailNetwork, Graph>();

function buildGraph(network: RailNetwork): Graph {
  const cached = graphCache.get(network);
  if (cached) return cached;
  const adj: Graph['adj'] = new Map();
  const coord: Graph['coord'] = new Map();
  for (const f of network.features) {
    const props = f.properties ?? {};
    const gauge = typeof props.gauge === 'string' ? props.gauge : undefined;
    const electrified = typeof props.electrified === 'boolean' ? props.electrified : undefined;
    const ferry = props.ferry === true ? true : undefined;
    const c = f.geometry.coordinates;
    for (let i = 0; i < c.length - 1; i++) {
      const a = c[i], b = c[i + 1];
      const ka = key(a), kb = key(b);
      coord.set(ka, a); coord.set(kb, b);
      const km = distKm(a, b);
      if (!adj.has(ka)) adj.set(ka, []);
      if (!adj.has(kb)) adj.set(kb, []);
      adj.get(ka)!.push({ to: kb, km, gauge, electrified, ferry });
      adj.get(kb)!.push({ to: ka, km, gauge, electrified, ferry });
    }
  }
  const g = { adj, coord };
  graphCache.set(network, g);
  return g;
}

function snap(
  g: Graph,
  p: Position,
  endpoint: 'origin' | 'destination',
  maxSnapDistanceKm?: number,
): { key: string; km: number } {
  let best = '', bestKm = Infinity;
  for (const [k, c] of g.coord) {
    const d = distKm(c, p);
    if (d < bestKm) { bestKm = d; best = k; }
  }
  if (maxSnapDistanceKm !== undefined && bestKm > maxSnapDistanceKm) {
    throw new SnapFailedError(endpoint, bestKm, maxSnapDistanceKm);
  }
  return { key: best, km: bestKm };
}

const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

class MinHeap {
  private a: Array<[number, string, string]> = []; // [cost, node, gauge-state]
  get size() { return this.a.length; }
  push(item: [number, string, string]) {
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
  pop(): [number, string, string] {
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

interface RouteConstraints {
  banned?: Set<string>;
  electrifiedOnly?: boolean;
  noFerries?: boolean;
  gaugePenaltyKm?: number;
}

function dijkstra(
  g: Graph,
  src: string,
  dst: string,
  c: RouteConstraints = {},
): { km: number; path: string[] } | null {
  const penalty = c.gaugePenaltyKm ?? 0;
  // state = node + (last gauge, only when a penalty makes it matter)
  const sk = (node: string, gauge: string) => (penalty ? `${node} ${gauge}` : node);
  const dist = new Map<string, number>([[sk(src, ''), 0]]);
  const prev = new Map<string, string>(); // state -> state
  const nodeOf = new Map<string, string>([[sk(src, ''), src]]);
  const pq = new MinHeap();
  pq.push([0, src, '']);
  const done = new Set<string>();
  let final: string | null = null;
  while (pq.size) {
    const [du, u, ug] = pq.pop();
    const us = sk(u, ug);
    if (u === dst) { final = us; break; }
    if (done.has(us)) continue;
    done.add(us);
    for (const e of g.adj.get(u) ?? []) {
      if (c.banned && c.banned.has(edgeKey(u, e.to))) continue;
      if (c.electrifiedOnly && e.electrified !== true) continue;
      if (c.noFerries && e.ferry) continue;
      const eg = e.gauge ?? ug; // untagged edges inherit, never break gauge
      let cost = e.km;
      if (penalty && ug && e.gauge && e.gauge !== ug) cost += penalty;
      const vs = sk(e.to, eg);
      const nd = du + cost;
      if (nd < (dist.get(vs) ?? Infinity)) {
        dist.set(vs, nd);
        prev.set(vs, us);
        nodeOf.set(vs, e.to);
        pq.push([nd, e.to, eg]);
      }
    }
  }
  if (final === null) return null;
  const path = [nodeOf.get(final)!];
  let cur = final;
  while (prev.has(cur)) {
    cur = prev.get(cur)!;
    path.push(nodeOf.get(cur)!);
  }
  return { km: dist.get(final)!, path: path.reverse() };
}

// ---- stations ----

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

// ---- routing API ----

function constraintsOf(options: RailRouteOptions): RouteConstraints {
  return {
    electrifiedOnly: options.electrifiedOnly,
    noFerries: options.ferries === false,
    gaugePenaltyKm: options.gaugeChangePenaltyKm,
  };
}

function decorate(
  g: Graph,
  km: number,
  path: string[],
  options: RailRouteOptions,
): RailRouteFeature {
  const properties: RailRouteFeature['properties'] = { length: km, units: 'kilometers' };
  // walk the path once to count gauge breaks and ferry distance
  let gaugeChanges = 0;
  let ferryKm = 0;
  let lastGauge: string | undefined;
  for (let i = 0; i < path.length - 1; i++) {
    const e = (g.adj.get(path[i]) ?? []).find((x) => x.to === path[i + 1]);
    if (!e) continue;
    if (e.gauge) {
      if (lastGauge && e.gauge !== lastGauge) gaugeChanges++;
      lastGauge = e.gauge;
    }
    if (e.ferry) ferryKm += e.km;
  }
  properties.gaugeChanges = gaugeChanges;
  if (ferryKm) properties.ferryKm = ferryKm;
  if (options.speedKmh) properties.durationHours = km / options.speedKmh;
  return {
    type: 'Feature',
    properties,
    geometry: { type: 'LineString', coordinates: path.map((k) => g.coord.get(k)!) },
  };
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
  const oSnap = snap(g, o, 'origin', options.maxSnapDistanceKm);
  const dSnap = snap(g, d, 'destination', options.maxSnapDistanceKm);
  const result = dijkstra(g, oSnap.key, dSnap.key, constraintsOf(options));
  if (!result) throw new NoRouteError();
  const feature = decorate(g, result.km, result.path, options);
  feature.properties.originSnapKm = oSnap.km;
  feature.properties.destinationSnapKm = dSnap.km;
  if (originStation) feature.properties.originStation = originStation.name;
  if (destinationStation) feature.properties.destinationStation = destinationStation.name;
  return feature;
}

/**
 * CDN copies of the bundled networks (this repo at the `networks-v1` tag, via
 * jsDelivr) for browsers/edge runtimes that would rather `loadNetwork(url)` on
 * demand than ship the JSON in their bundle.
 */
export const NETWORK_URLS = {
  europe: 'https://cdn.jsdelivr.net/gh/mayurrawte/railroutes@networks-v1/railroute-ts/src/networks/europe-v0.json',
  india: 'https://cdn.jsdelivr.net/gh/mayurrawte/railroutes@networks-v1/railroute-ts/src/networks/india-v0.json',
  /** FRA/BTS North American Rail Network main sub-network (US, Canada, Mexico). Public domain. */
  northAmerica: 'https://cdn.jsdelivr.net/gh/mayurrawte/railroutes@networks-v1/railroute-ts/src/networks/north-america-v0.json',
  corridor: 'https://cdn.jsdelivr.net/gh/mayurrawte/railroutes@networks-v1/railroute-ts/src/networks/corridor-v0.json',
} as const;

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
  const base = constraintsOf(options);
  const o = typeof origin === 'string' ? resolveStation(origin) : origin;
  const d = typeof destination === 'string' ? resolveStation(destination) : destination;
  const g = buildGraph(options.network);
  const src = snap(g, o, 'origin', options.maxSnapDistanceKm).key;
  const dst = snap(g, d, 'destination', options.maxSnapDistanceKm).key;

  const best = dijkstra(g, src, dst, base);
  if (!best) throw new NoRouteError();

  const accepted: Array<{ km: number; path: string[] }> = [best];
  const candidates: Array<{ km: number; path: string[] }> = [];
  const seen = new Set<string>([best.path.join('>')]);

  while (accepted.length < k) {
    const prevRoute = accepted[accepted.length - 1];
    for (let i = 0; i < prevRoute.path.length - 1; i++) {
      const spur = prevRoute.path[i];
      const rootPath = prevRoute.path.slice(0, i + 1);
      const banned = new Set<string>();
      for (const a of accepted) {
        if (a.path.length > i && a.path.slice(0, i + 1).join('>') === rootPath.join('>')) {
          banned.add(edgeKey(a.path[i], a.path[i + 1]));
        }
      }
      const rootSet = new Set(rootPath.slice(0, -1));
      for (const n of rootSet) for (const { to } of g.adj.get(n) ?? []) banned.add(edgeKey(n, to));

      const spurResult = dijkstra(g, spur, dst, { ...base, banned });
      if (!spurResult) continue;
      const path = [...rootPath.slice(0, -1), ...spurResult.path];
      const pk = path.join('>');
      if (seen.has(pk)) continue;
      seen.add(pk);
      let km = spurResult.km;
      for (let j = 0; j < i; j++) {
        const edges = g.adj.get(prevRoute.path[j]) ?? [];
        km += edges.find((e) => e.to === prevRoute.path[j + 1])?.km ?? 0;
      }
      candidates.push({ km, path });
    }
    if (!candidates.length) break;
    candidates.sort((a, b) => a.km - b.km);
    accepted.push(candidates.shift()!);
  }

  return accepted
    .sort((a, b) => a.km - b.km)
    .map((r) => decorate(g, r.km, r.path, options));
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
