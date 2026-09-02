import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import {
  railRouteAlternativesInputSchema,
  railRouteInputSchema,
  railStationSearchInputSchema,
  runRailRoute,
  runRailRouteAlternatives,
  runRailStationSearch,
} from './tools.js';

/**
 * Build the railroute-ts MCP server with `rail_route`, `rail_route_alternatives`
 * and `rail_station_search` registered. Thin wrappers over the railroute-ts
 * public API — no new routing logic.
 */
export function createServer(): McpServer {
  const server = new McpServer({ name: 'railroute-ts', version: '0.1.0' });

  server.registerTool(
    'rail_route',
    {
      title: 'Shortest rail route',
      description:
        'Compute the shortest railway route between two points in Europe, India, North America or China (station names like "Wien Hauptbahnhof", UIC codes, Indian Railways codes like NDLS/CSMT, or [lon, lat]; pick network: "europe" | "corridor" | "india" | "north-america" | "china"). Returns distance in km, optional duration, gauge changes, train-ferry km and the route GeoJSON. Options: electrified-only, no ferries, gauge-break penalty. Pairs with the searoute MCP server for multimodal sea + rail freight distance.',
      inputSchema: railRouteInputSchema,
    },
    async (args) => runRailRoute(args),
  );

  server.registerTool(
    'rail_route_alternatives',
    {
      title: 'Alternative rail routes',
      description:
        'Return up to k distinct railway routes between two points (Yen\'s K-shortest), sorted by distance — e.g. Gotthard vs. Lötschberg–Simplon across the Alps.',
      inputSchema: railRouteAlternativesInputSchema,
    },
    async (args) => runRailRouteAlternatives(args),
  );

  server.registerTool(
    'rail_station_search',
    {
      title: 'Search rail stations',
      description:
        'Find European and Indian railway stations by name or code (substring, case-insensitive) and get their UIC code and coordinates. Use it to resolve a city to an exact station name before calling rail_route.',
      inputSchema: railStationSearchInputSchema,
    },
    async (args) => runRailStationSearch(args),
  );

  return server;
}
