export type Position = [number, number]; // [lon, lat]

export interface RailNetwork {
  type: 'FeatureCollection';
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
}

export interface RailRouteProperties {
  length: number;
  units: 'kilometers';
  durationHours?: number;
  legs?: number[];
  gaugeChanges?: number;
  ferryKm?: number;
  [k: string]: unknown;
}

export interface RailRouteFeature {
  type: 'Feature';
  properties: RailRouteProperties;
  geometry: { type: 'LineString'; coordinates: Position[] };
}
