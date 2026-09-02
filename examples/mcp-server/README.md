# @railroute-ts/mcp

[![npm version](https://img.shields.io/npm/v/@railroute-ts/mcp.svg?style=flat)](https://www.npmjs.com/package/@railroute-ts/mcp)
[![license](https://img.shields.io/npm/l/@railroute-ts/mcp.svg?style=flat)](https://github.com/mayurrawte/railroutes/blob/main/railroute-ts/LICENSE)

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes
[`railroute-ts`](https://github.com/mayurrawte/railroutes) to AI agents, so they
can compute real railway routes across Europe, India, North America and China ("how far is Rotterdam to Genoa by
rail, and does it cross a gauge break?") instead of guessing.

It is a thin wrapper over the `railroute-ts` public API — no new routing logic.
Everything runs locally over stdio; the Europe, India and China (OpenStreetMap) and
North America (FRA/BTS NARN) rail networks are bundled, so there are no API keys and no network calls.

Pairs with [`@searoute-ts/mcp`](https://www.npmjs.com/package/@searoute-ts/mcp)
for **multimodal sea + rail** freight distance and emissions.

## Tools

### `rail_route`

Shortest railway route between two points. Returns distance in km, optional
duration, gauge changes, train-ferry km, snap distances and the route GeoJSON.

| Argument | Type | Notes |
| --- | --- | --- |
| `origin`, `destination` | station name / UIC code `string` or `[lon, lat]` | required |
| `network` | `"europe"` \| `"corridor"` \| `"india"` \| `"north-america"` \| `"china"` | default `europe`; `corridor` = Rhine-Alpine only, faster; `india` = Indian Railways mainline, accepts IR codes (NDLS, CSMT, MAS, HWH); `north-america` = US/Canada/Mexico (FRA NARN, coordinates only); `china` = mainland China incl. HSR (coordinates only) |
| `speedKmh` | number | fills an estimated duration in hours |
| `electrifiedOnly` | boolean | only electrified track |
| `ferries` | boolean | `false` forbids train ferries (Messina, Rostock–Trelleborg …) |
| `gaugeChangePenaltyKm` | number | extra km per gauge break, to discourage them |
| `maxSnapDistanceKm` | number | reject inputs too far from the rail network |
| `includeGeometry` | boolean | include the route GeoJSON (default `true`) |

### `rail_route_alternatives`

Up to `k` distinct routes (Yen's K-shortest), sorted by distance — e.g.
Gotthard vs. Lötschberg–Simplon across the Alps. Same options as `rail_route`;
geometry off by default.

### `rail_station_search`

Substring search over the bundled stations — 12,886 European (OSM `uic_ref`) and 8,476 Indian (OSM `ref` = Indian Railways code) — or an exact code.
Returns name, UIC code and coordinates — resolve "vienna main station" to
`Wien Hauptbahnhof` before routing. Coverage follows OSM tagging: strong in
DE/AT/CH/FR/PL/IT, weak in Portugal and Sweden (pass `[lon, lat]` there).

## Install & run

```bash
npm install -g @railroute-ts/mcp   # or use npx, below
```

### Claude Code / `claude` CLI

```bash
claude mcp add railroute -- npx -y @railroute-ts/mcp
```

### Claude Desktop / any MCP client

```json
{
  "mcpServers": {
    "railroute": {
      "command": "npx",
      "args": ["-y", "@railroute-ts/mcp"]
    }
  }
}
```

Then ask: *"Rail distance from Wien Hauptbahnhof to Berlin Hauptbahnhof at 80 km/h?"*
→ `Rail route: 754.14 km, ~9.43 h.`

## Multimodal with searoute

Add both servers and the agent can chain them:

> Shanghai → Rotterdam by sea (`sea_route`, ~19,700 km via Suez), then
> Rotterdam → Genoa by rail (`rail_route`, ~1,180 km via the Gotthard base tunnel).

## Development

```bash
npm install
npm test        # vitest, exercises the tools directly (no MCP transport)
npm run dev     # tsx src/index.ts — stdio server
```

## License

MIT © Mayur Rawte. Network data © OpenStreetMap contributors, ODbL.
