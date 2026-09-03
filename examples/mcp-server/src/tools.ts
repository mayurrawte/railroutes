// Register the station datasets once so agents can pass station names
// ("Wien Hauptbahnhof") or codes (UIC / Indian Railways).
import { EUROPE_NETWORK, EUROPE_STATIONS } from '@railroute-ts/europe';
import { INDIA_NETWORK, INDIA_STATIONS } from '@railroute-ts/india';
import { NORTH_AMERICA_NETWORK, NORTH_AMERICA_STATIONS } from '@railroute-ts/north-america';
import { CHINA_NETWORK, CHINA_STATIONS } from '@railroute-ts/china';
import { CIS_NETWORK, CIS_STATIONS } from '@railroute-ts/cis';
import { CORRIDOR_NETWORK } from 'railroute-ts/networks/corridor';
import { CORRIDOR_STATIONS } from 'railroute-ts/stations/corridor';
import {
  NoRouteError,
  mergeNetworks,
  registerStations,
  SnapFailedError,
  railRoute,
  railRouteAlternatives,
  type Position,
  type RailNetwork,
  type RailRouteFeature,
  type RailRouteOptions,
} from 'railroute-ts';
import { z } from 'zod';

/** MCP tool result shape (a minimal subset of the SDK's CallToolResult). */
export type ToolResult = {
  content: { type: 'text'; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

// ── Shared input pieces ──────────────────────────────────────────────────────

const pointSchema = z
  .union([
    z.string().min(1).describe('Station name (case-insensitive, e.g. "Wien Hauptbahnhof") or UIC code'),
    z
      .tuple([z.number().gte(-180).lte(180), z.number().gte(-90).lte(90)])
      .describe('[longitude, latitude] in decimal degrees'),
  ])
  .describe('A station name / UIC code string, or a [longitude, latitude] coordinate pair.');

const networkSchema = z
  .enum(['europe', 'corridor', 'india', 'north-america', 'china', 'cis', 'eurasia'])
  .default('europe')
  .describe(
    '"europe": the whole continent (35–72N, 10W–32E). "corridor": the lighter Rhine-Alpine corridor (Rotterdam–Genoa), faster. "india": Indian Railways mainline (accepts IR station codes such as NDLS, CSMT, MAS, HWH). "north-america": US + Canada + Mexico mainline from the FRA/BTS North American Rail Network (Amtrak/VIA station names such as "Chicago Union Station"). "china": mainland China + Mongolia incl. HSR (English station names such as "Shanghai-Hongqiao"). "cis": Russia, Kazakhstan, Belarus, Ukraine, Caucasus, Central Asia (1520 mm). "eurasia": china + cis + europe merged — use for China–Europe land-bridge routes (Chongqing → Duisburg), reports gauge changes at Dostyk and Brest.',
  );

type NetworkName = 'europe' | 'corridor' | 'india' | 'north-america' | 'china' | 'cis' | 'eurasia';
let eurasia: RailNetwork | undefined;
const NETWORKS: Record<Exclude<NetworkName, 'eurasia'>, RailNetwork> = {
  europe: EUROPE_NETWORK,
  corridor: CORRIDOR_NETWORK,
  india: INDIA_NETWORK,
  'north-america': NORTH_AMERICA_NETWORK,
  china: CHINA_NETWORK,
  cis: CIS_NETWORK,
};
function networkFor(name: NetworkName): RailNetwork {
  if (name !== 'eurasia') return NETWORKS[name];
  return (eurasia ??= mergeNetworks([CHINA_NETWORK, CIS_NETWORK, EUROPE_NETWORK]));
}

registerStations(EUROPE_STATIONS);
registerStations(CORRIDOR_STATIONS);
registerStations(INDIA_STATIONS);
registerStations(NORTH_AMERICA_STATIONS);
registerStations(CHINA_STATIONS);
registerStations(CIS_STATIONS);
const ALL_STATIONS = [...EUROPE_STATIONS, ...INDIA_STATIONS, ...NORTH_AMERICA_STATIONS, ...CHINA_STATIONS, ...CIS_STATIONS];

const commonOptions = {
  network: networkSchema,
  speedKmh: z
    .number()
    .positive()
    .optional()
    .describe('Average speed in km/h; when given, an estimated duration in hours is returned (freight ≈ 50–80).'),
  electrifiedOnly: z.boolean().optional().describe('Only use electrified track.'),
  ferries: z.boolean().optional().describe('Set false to forbid train ferries (default: allowed).'),
  gaugeChangePenaltyKm: z
    .number()
    .nonnegative()
    .optional()
    .describe('Extra km added per gauge break (e.g. 1435↔1668 at the Spanish border) to discourage them.'),
  maxSnapDistanceKm: z
    .number()
    .positive()
    .optional()
    .describe('Reject inputs farther than this (km) from the nearest rail node.'),
};

type CommonArgs = {
  network: NetworkName;
  speedKmh?: number;
  electrifiedOnly?: boolean;
  ferries?: boolean;
  gaugeChangePenaltyKm?: number;
  maxSnapDistanceKm?: number;
};

function optionsOf(args: CommonArgs): RailRouteOptions {
  return {
    network: networkFor(args.network),
    speedKmh: args.speedKmh,
    electrifiedOnly: args.electrifiedOnly,
    ferries: args.ferries,
    gaugeChangePenaltyKm: args.gaugeChangePenaltyKm,
    maxSnapDistanceKm: args.maxSnapDistanceKm,
  };
}

const round = (n: number, d = 100) => Math.round(n * d) / d;

function summarize(feature: RailRouteFeature): Record<string, unknown> {
  const p = feature.properties;
  const out: Record<string, unknown> = {
    distanceKm: round(p.length),
    units: 'kilometers',
    gaugeChanges: p.gaugeChanges ?? 0,
    ferryKm: round(p.ferryKm ?? 0),
  };
  if (p.durationHours !== undefined) out.durationHours = round(p.durationHours);
  if (p.originSnapKm !== undefined) out.originSnapKm = round(p.originSnapKm);
  if (p.destinationSnapKm !== undefined) out.destinationSnapKm = round(p.destinationSnapKm);
  if (p.originStation) out.originStation = p.originStation;
  if (p.destinationStation) out.destinationStation = p.destinationStation;
  return out;
}

function errorResult(err: unknown): ToolResult {
  const message =
    err instanceof NoRouteError || err instanceof SnapFailedError
      ? `${err.name}: ${err.message}`
      : err instanceof Error && /^Unknown station/.test(err.message)
        ? `${err.message}. Use rail_station_search to find the exact name, or pass [lon, lat].`
        : `Failed to compute route: ${err instanceof Error ? err.message : String(err)}`;
  return { content: [{ type: 'text', text: message }], isError: true };
}

// ── rail_route ───────────────────────────────────────────────────────────────

export const railRouteInputSchema = {
  origin: pointSchema,
  destination: pointSchema,
  ...commonOptions,
  includeGeometry: z.boolean().default(true).describe('Include the route LineString GeoJSON in the result.'),
};

const RailRouteArgs = z.object(railRouteInputSchema);
export type RailRouteArgs = z.infer<typeof RailRouteArgs>;

/** Compute a single shortest rail route. Pure — safe to unit-test directly. */
export function runRailRoute(args: RailRouteArgs): ToolResult {
  try {
    const route = railRoute(args.origin as Position | string, args.destination as Position | string, optionsOf(args));
    const summary = summarize(route);
    const structured: Record<string, unknown> = { ...summary };
    if (args.includeGeometry) structured.geojson = route;

    const text =
      `Rail route: ${summary.distanceKm} km` +
      (summary.durationHours !== undefined ? `, ~${summary.durationHours} h` : '') +
      (Number(summary.gaugeChanges) > 0 ? `, ${summary.gaugeChanges} gauge change(s)` : '') +
      (Number(summary.ferryKm) > 0 ? `, ${summary.ferryKm} km by train ferry` : '') +
      '.';

    return { content: [{ type: 'text', text }], structuredContent: structured };
  } catch (err) {
    return errorResult(err);
  }
}

// ── rail_route_alternatives ──────────────────────────────────────────────────

export const railRouteAlternativesInputSchema = {
  origin: pointSchema,
  destination: pointSchema,
  k: z.number().int().gte(1).lte(5).default(3).describe('Maximum number of distinct routes to return (baseline + alternatives).'),
  ...commonOptions,
  includeGeometry: z
    .boolean()
    .default(false)
    .describe('Include each route LineString GeoJSON in the result (off by default; verbose).'),
};

const RailRouteAlternativesArgs = z.object(railRouteAlternativesInputSchema);
export type RailRouteAlternativesArgs = z.infer<typeof RailRouteAlternativesArgs>;

/** Compute up to `k` distinct routes (Yen's K-shortest). Pure — safe to unit-test directly. */
export function runRailRouteAlternatives(args: RailRouteAlternativesArgs): ToolResult {
  try {
    const routes = railRouteAlternatives(args.origin as Position | string, args.destination as Position | string, {
      ...optionsOf(args),
      k: args.k,
    });
    const alternatives = routes.map((route, i) => {
      const entry: Record<string, unknown> = { rank: i + 1, ...summarize(route) };
      if (args.includeGeometry) entry.geojson = route;
      return entry;
    });
    const text =
      `Found ${alternatives.length} alternative route(s):\n` +
      alternatives
        .map((a) => `- #${a.rank}: ${a.distanceKm} km` + (Number(a.gaugeChanges) > 0 ? `, ${a.gaugeChanges} gauge change(s)` : ''))
        .join('\n');
    return { content: [{ type: 'text', text }], structuredContent: { count: alternatives.length, alternatives } };
  } catch (err) {
    return errorResult(err);
  }
}

// ── rail_station_search ──────────────────────────────────────────────────────

export const railStationSearchInputSchema = {
  query: z.string().min(2).describe('Free text; every word must appear in the station name (case-insensitive), or an exact station code (UIC / Indian Railways).'),
  limit: z.number().int().gte(1).lte(50).default(10).describe('Maximum matches to return.'),
};

const RailStationSearchArgs = z.object(railStationSearchInputSchema);
export type RailStationSearchArgs = z.infer<typeof RailStationSearchArgs>;

/** Substring search over the bundled Europe + India stations (name or exact code). Pure — safe to unit-test directly. */
export function runRailStationSearch(args: RailStationSearchArgs): ToolResult {
  const words = args.query.toLowerCase().split(/\s+/).filter(Boolean);
  const upper = args.query.trim().toUpperCase();
  const matches = ALL_STATIONS.filter((s) => {
    if (s.code === upper) return true;
    const name = s.name.toLowerCase();
    return words.every((w) => name.includes(w));
  })
    // shorter names first: "Wien Hauptbahnhof" before "Wien Hauptbahnhof (Bahnsteige 1-2)"
    .sort((a, b) => a.name.length - b.name.length)
    .slice(0, args.limit)
    .map((s) => ({ code: s.code, name: s.name, coord: s.coord }));

  const text = matches.length
    ? `${matches.length} station(s):\n` + matches.map((m) => `- ${m.name} (UIC ${m.code}) @ [${m.coord[0]}, ${m.coord[1]}]`).join('\n')
    : `No station matches "${args.query}". Coverage follows OSM tagging (uic_ref in Europe — weak in Portugal and Sweden; ref = IR code in India; Amtrak/VIA station names in North America; English names in China); pass [lon, lat] instead.`;
  return { content: [{ type: 'text', text }], structuredContent: { count: matches.length, matches } };
}
