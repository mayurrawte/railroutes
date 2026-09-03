# Multimodal examples — sea + rail, door to door

Four runnable scripts combining [`searoute-ts`](https://github.com/mayurrawte/searoute-ts)
(sea, Eurostat marnet) with `railroute-ts` and its regional data packages:

| Script | Corridor |
|---|---|
| `shanghai-rotterdam-duisburg.mjs` | Asia → Europe: Shanghai → Rotterdam by sea, → Duisburg by rail; plus the no-Suez variant |
| `mundra-delhi-icd.mjs` | Jebel Ali → Mundra by sea, → Tughlakabad ICD (Delhi) by Indian Railways code |
| `la-longbeach-chicago.mjs` | Shanghai → Los Angeles by sea, → Chicago on the FRA network |
| `chongqing-duisburg-landbridge.mjs` | The China–Europe land bridge all-rail (two gauge changes) vs. the sea alternative |

```bash
cd examples/multimodal && npm install && npm start
```

Everything runs offline; no API keys. Distances are shortest paths over open
networks, not carrier itineraries — see each library's README for accuracy notes.
