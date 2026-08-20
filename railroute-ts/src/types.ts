export type Position = [number, number]; // [lon, lat]

export interface RailNetwork {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry: { type: 'LineString'; coordinates: Position[] };
  }>;
}

export interface RailRouteOptions {
  network: RailNetwork;
  speedKmh?: number;
}

export interface RailRouteProperties {
  length: number;
  units: 'kilometers';
  durationHours?: number;
  legs?: number[];
  [k: string]: unknown;
}

export interface RailRouteFeature {
  type: 'Feature';
  properties: RailRouteProperties;
  geometry: { type: 'LineString'; coordinates: Position[] };
}
