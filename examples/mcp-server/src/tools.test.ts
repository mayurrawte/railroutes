import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  railRouteAlternativesInputSchema,
  railRouteInputSchema,
  railStationSearchInputSchema,
  runRailRoute,
  runRailRouteAlternatives,
  runRailStationSearch,
} from './tools.js';

const routeArgs = (input: Record<string, unknown>) => z.object(railRouteInputSchema).parse(input);
const altArgs = (input: Record<string, unknown>) => z.object(railRouteAlternativesInputSchema).parse(input);
const searchArgs = (input: Record<string, unknown>) => z.object(railStationSearchInputSchema).parse(input);

describe('rail_route', () => {
  it('routes between station names on the Europe network with distance + geometry', () => {
    const res = runRailRoute(routeArgs({ origin: 'Wien Hauptbahnhof', destination: 'Berlin Hauptbahnhof' }));
    expect(res.isError).toBeFalsy();
    const sc = res.structuredContent as { distanceKm: number; geojson: { geometry: { type: string } } };
    // Vienna → Berlin by rail ≈ 650–750 km
    expect(sc.distanceKm).toBeGreaterThan(600);
    expect(sc.distanceKm).toBeLessThan(800);
    expect(sc.geojson.geometry.type).toBe('LineString');
    expect(res.content[0].text).toContain('Rail route');
  });

  it('accepts [lon, lat] coordinates, the corridor network, and a speed', () => {
    const res = runRailRoute(
      routeArgs({ origin: [4.47, 51.92], destination: [8.92, 44.41], network: 'corridor', speedKmh: 80, includeGeometry: false }),
    );
    expect(res.isError).toBeFalsy();
    const sc = res.structuredContent as { distanceKm: number; durationHours: number; geojson?: unknown };
    expect(sc.distanceKm).toBeGreaterThan(1100);
    expect(sc.distanceKm).toBeLessThan(1300);
    expect(sc.durationHours).toBeCloseTo(sc.distanceKm / 80, 1);
    expect(sc.geojson).toBeUndefined();
  });

  it('reports gauge changes when crossing into Iberia', () => {
    const res = runRailRoute(routeArgs({ origin: [-3.69, 40.41], destination: [2.35, 48.86], includeGeometry: false }));
    expect(res.isError).toBeFalsy();
    const sc = res.structuredContent as { gaugeChanges: number };
    expect(sc.gaugeChanges).toBeGreaterThanOrEqual(1);
  });

  it('returns an isError result for an unknown station', () => {
    const res = runRailRoute(routeArgs({ origin: 'Nowhere Central', destination: 'Berlin Hauptbahnhof' }));
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/Unknown station/);
  });

  it('returns an isError result when a point is too far from the network', () => {
    const res = runRailRoute(routeArgs({ origin: [0, 0], destination: 'Berlin Hauptbahnhof', maxSnapDistanceKm: 50 }));
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/SnapFailedError/);
  });
});

describe('rail_route_alternatives', () => {
  it('returns distinct routes sorted by distance', () => {
    const res = runRailRouteAlternatives(altArgs({ origin: [7.59, 47.55], destination: [9.19, 45.49], network: 'corridor', k: 2 }));
    expect(res.isError).toBeFalsy();
    const sc = res.structuredContent as { count: number; alternatives: { distanceKm: number }[] };
    expect(sc.count).toBe(2);
    expect(sc.alternatives[0].distanceKm).toBeLessThanOrEqual(sc.alternatives[1].distanceKm);
    expect(res.content[0].text).toContain('alternative');
  });
});

describe('rail_station_search', () => {
  it('finds stations by case-insensitive substring and returns code + coordinates', () => {
    const res = runRailStationSearch(searchArgs({ query: 'hauptbahnhof wien' }));
    expect(res.isError).toBeFalsy();
    const sc = res.structuredContent as { matches: { code: string; name: string; coord: [number, number] }[] };
    expect(sc.matches.length).toBeGreaterThan(0);
    expect(sc.matches[0].name.toLowerCase()).toContain('wien');
    expect(sc.matches[0].coord).toHaveLength(2);
  });

  it('caps results at limit', () => {
    const res = runRailStationSearch(searchArgs({ query: 'bahnhof', limit: 3 }));
    const sc = res.structuredContent as { matches: unknown[] };
    expect(sc.matches.length).toBe(3);
  });
});
