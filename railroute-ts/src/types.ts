export type Position = [number, number]; // [lon, lat]

export interface RailNetworkMetadata {
  name: string;
  source: string;
  license: string;
  builtAt: string;
  /** [minLon, minLat, maxLon, maxLat] */
  bbox: [number, number, number, number];
  edges: number;
  km: number;
}

export interface RailNetwork {
  type: 'FeatureCollection';
  metadata?: RailNetworkMetadata;
  features: Array<{
    type: 'Feature';
    properties: Record<string, unknown> & { gauge?: string; electrified?: boolean; ferry?: boolean };
    geometry: { type: 'LineString'; coordinates: Position[] };
  }>;
}

export interface RailRouteOptions {
  network: RailNetwork;
  speedKmh?: number;
  /** Only traverse edges tagged electrified: true. */
  electrifiedOnly?: boolean;
  /** Set false to exclude train-ferry edges. Default: allowed. */
  ferries?: boolean;
  /** Extra km added each time the route crosses a gauge break (e.g. 1435<->1668). */
  gaugeChangePenaltyKm?: number;
  /**
   * Reject origin/destination points farther than this many km from the nearest
   * rail node (throws SnapFailedError). Default: unlimited.
   */
  maxSnapDistanceKm?: number;
}

export interface RailRouteProperties {
  length: number;
  units: 'kilometers';
  durationHours?: number;
  legs?: number[];
  gaugeChanges?: number;
  ferryKm?: number;
  /** Distance (km) the origin was moved to reach the nearest rail node. */
  originSnapKm?: number;
  /** Distance (km) the destination was moved to reach the nearest rail node. */
  destinationSnapKm?: number;
  [k: string]: unknown;
}

export interface RailRouteFeature {
  type: 'Feature';
  properties: RailRouteProperties;
  geometry: { type: 'LineString'; coordinates: Position[] };
}
