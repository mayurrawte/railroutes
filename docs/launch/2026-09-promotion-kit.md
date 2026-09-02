# Promotion kit — railroute-ts + searoute-ts (September 2026)

Post only AFTER `railroute-ts@0.2.0`, `@railroute-ts/*@2026.9.0` and `@railroute-ts/mcp` are on npm.
Order: forum replies + list PRs (one afternoon) → r/supplychain + LinkedIn → Show HN.
Voice: plain, specific numbers, admit limitations. Never ask for stars or votes.

---

## 1. Reply — OSM community: "Finding distance between two stations in OpenRailwayMap"
https://community.openstreetmap.org/t/finding-distance-between-two-stations-in-openrailway-map/121952

> Late to this, but it is now a two-line answer without self-hosting anything.
> I built `railroute-ts` (npm, MIT) on top of OSM `railway=rail` + `usage=main`. It ships the
> Europe network (~40k edges, 1.5 MB gzipped) with the 12,886 stations that carry `uic_ref`, so:
>
> ```ts
> import { railRoute, registerStations } from 'railroute-ts';
> import { EUROPE_NETWORK, EUROPE_STATIONS } from '@railroute-ts/europe';
> registerStations(EUROPE_STATIONS);
> railRoute('Wien Hauptbahnhof', 'Berlin Hauptbahnhof', { network: EUROPE_NETWORK }).properties.length
> // 754 km
> ```
>
> Multiple pairs: loop it — the graph is built once and cached, a route is ~100–400 ms.
> India (`@railroute-ts/india`, station codes from `ref`), North America (FRA NARN) and China
> are separate data packages. Runs in Node or the browser, no server.
>
> Honest limits: it is a shortest-path over mainline track, not an operator's routing — it
> ignores timetables and trackage rights, and where `usage=main` is missing OSM it detours
> (I list the corridors I know about in the README). Which brings me to the OSM side:
> building the graph showed that mainline ways in India come as ~500 disconnected pieces
> that touch without sharing a node; the library stitches them, but the underlying tagging
> gaps (Bengaluru–Chennai, Shenzhen–Wuhan) are things mappers could fix in minutes.
>
> Repo + demo: https://github.com/mayurrawte/railroutes · https://mayurrawte.is-a.dev/railroutes/

## 2. Reply — GraphHopper forum: "Railway and waterway routing in GH 10.x"
https://discuss.graphhopper.com/t/railway-and-waterway-routing-in-gh-10-x/9396

> If the goal is distances/geometry rather than a full GH deployment, there is a lighter
> route now: `railroute-ts` (rail, OSM mainline, Europe/India/North America/China as data
> packages) and `searoute-ts` (sea, Eurostat marnet, canals/straits, ECA zones). Both are
> plain TypeScript, no server, GeoJSON out, and they share the same API shape so a sea leg
> plus a rail leg is two calls. Not a GraphHopper replacement for turn-by-turn or
> timetable-aware routing — but for freight quoting, CO₂e (GLEC/CountEmissions) and
> visualisation it is usually all that is needed. Links: github.com/mayurrawte/railroutes,
> github.com/mayurrawte/searoute-ts.

## 3. Comment — DEV.to "The Open Railway Map API"
https://dev.to/max_kleiner_9d12e786b3ecc/the-open-railway-map-api-13fg

> Nice write-up. For readers who land here wanting the *distance* between two stations
> rather than the tiles: `railroute-ts` routes over the same OSM data offline —
> `railRoute('NDLS', 'CSMT', { network: INDIA_NETWORK })` → 1,434 km. Europe, India,
> North America, China. github.com/mayurrawte/railroutes

## 4. PR — MobilityData/awesome-transit (README, "Rail" or "Routing" section)

- [railroute-ts](https://github.com/mayurrawte/railroutes) - Shortest rail route and distance between two points or station codes (UIC, Indian Railways) over OpenStreetMap / FRA NARN networks; Europe, India, North America, China; TypeScript, runs in browser or Node, GeoJSON output, MCP server for AI agents.

## 5. PR — sacridini/Awesome-Geospatial (Routing section, next to OSRM / pgRouting)

- [searoute-ts](https://github.com/mayurrawte/searoute-ts) - Shortest maritime route between ports (UN/LOCODE) or coordinates on the Eurostat marnet; canals/straits restrictions, vessel draft, ECA zones, CO₂e; TypeScript.
- [railroute-ts](https://github.com/mayurrawte/railroutes) - Shortest rail route over OpenStreetMap / FRA NARN with gauge, electrification and train-ferry awareness; Europe, India, North America, China; TypeScript.

## 6. Nudge — eurostat/searoute PR #81 (comment)

> Friendly ping — happy to trim this to a single line if the "Other implementations"
> section feels too much. searoute-ts is now at ~20k downloads/month, so a pointer here
> would save people rediscovering it.

## 7. Post — r/supplychain (crosspost r/logistics). Title:
**"Door-to-door freight distance (sea + rail) in 20 lines, no API subscription — open source"**

> Every quoting/emissions tool I looked at charges per call for sea distance (one sells the
> Eurostat network back to you at $1,199/month). The network is open data, so I put the
> routing in two free libraries and now they connect:
>
> Shanghai → Rotterdam by sea: 19,753 km via Suez (or 23,800 km round the Cape if you block
> Suez/Bab-el-Mandeb), ~4,400 t CO₂e for a Panamax on a rough GLEC-style factor.
> Rotterdam → Genoa by rail: 1,180 km via the Gotthard, 0 gauge changes.
> Same for Mundra → Delhi ICD (Indian Railways station codes) and LA/Long Beach → Chicago
> (FRA rail network). Runs in a spreadsheet script, a browser tab, or an AI agent (MCP).
>
> [code snippet from README multimodal section] · repo links
>
> What it is not: a carrier's routing engine. It ignores schedules, slot availability and
> trackage rights; it is a distance/geometry layer for quoting, CO₂e and maps. Corrections
> from people who do this for a living are the most useful thing I can get.

## 8. LinkedIn (Mayur's voice, 3 short paragraphs)

> Two years ago I ported a sea-routing library to TypeScript because we needed port-to-port
> distances at Shipthis without paying per call. It is at ~20k downloads a month now.
>
> This month I added the missing half: rail. railroute-ts routes over OpenStreetMap and the
> US FRA network — Europe, India, North America, China — with station codes as inputs
> (NDLS → CSMT = 1,434 km). Sea leg + rail leg = door-to-door distance and a defensible
> CO₂e number, all open source, all offline.
>
> Building it taught me something about OSM: India's mainline is ~500 disconnected pieces
> that touch without sharing a node. The library stitches them; the tagging gaps are listed
> in the README if you map. Links in comments.

## 9. Show HN (Tue–Thu, 8:00–9:30 ET; repo in first comment; reply to everything for 3–4 h)
**Show HN: Railroute-ts – rail distance between two stations over OpenStreetMap, offline**

First comment: what it does, the four regions + sizes, the stitching story (500 components),
the accuracy table (±6 % India, −4…−9 % NARN, +2 % Shanghai–Beijing) INCLUDING the bad
corridors, what it is not (timetables, trackage rights), and that searoute-ts is the sibling.
