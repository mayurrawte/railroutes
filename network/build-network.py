#!/usr/bin/env python3
"""Pipeline v2: raw Overpass ways -> compact edge-level network GeoJSON.

- splits ways at junctions, keeps the giant connected component
- carries gauge / electrified onto edges; chain contraction only merges
  edges whose properties match
- stitches train-ferry ways (route=ferry + railway=ferry) into the network
  by connecting their endpoints to the nearest rail node
Usage: build-network.py RAW.json OUT.json [FERRIES.json|-] [regions/NAME.json]
The optional region config adds a `metadata` block (source, license, bbox…).
"""
import json, math, sys, datetime
from collections import defaultdict
sys.setrecursionlimit(100000)

SRC, OUT = sys.argv[1], sys.argv[2]
FERRIES = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != '-' else None
REGION = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else None

def dist_km(a, b):
    dx = (b[0]-a[0]) * math.cos(math.radians((a[1]+b[1])/2)) * 111.32
    return math.hypot(dx, (b[1]-a[1]) * 111.32)

def rdp(pts, eps):
    if len(pts) < 3: return pts
    def perp(p,a,b):
        if a==b: return math.hypot(p[0]-a[0],p[1]-a[1])
        t=max(0,min(1,((p[0]-a[0])*(b[0]-a[0])+(p[1]-a[1])*(b[1]-a[1]))/((b[0]-a[0])**2+(b[1]-a[1])**2)))
        return math.hypot(p[0]-(a[0]+t*(b[0]-a[0])), p[1]-(a[1]+t*(b[1]-a[1])))
    dmax,idx=0,0
    for i in range(1,len(pts)-1):
        dd=perp(pts[i],pts[0],pts[-1])
        if dd>dmax: dmax,idx=dd,i
    if dmax>eps: return rdp(pts[:idx+1],eps)[:-1]+rdp(pts[idx:],eps)
    return [pts[0],pts[-1]]

def way_props(tags):
    gauge = (tags.get('gauge') or '').split(';')[0].strip() or None
    e = tags.get('electrified')
    electrified = None if e is None else (e not in ('no', 'none'))
    return gauge, electrified

def way_is_ferry(tags):
    # NARN NET='F' arcs arrive pre-stitched with ferry=yes (no separate ferries file)
    return tags.get('ferry') == 'yes' or tags.get('route') == 'ferry'

d = json.load(open(SRC))
ways = [w for w in d['elements'] if w.get('geometry') and w.get('nodes')]

use = defaultdict(int)
for w in ways:
    for n in w['nodes']: use[n] += 1
    use[w['nodes'][0]] += 1; use[w['nodes'][-1]] += 1

# edges: (a, b, coords, gauge, electrified)
edges = []
for w in ways:
    gauge, elec = way_props(w.get('tags', {}))
    fer = way_is_ferry(w.get('tags', {}))
    seg_n, seg_c = [], []
    for nid, g in zip(w['nodes'], w['geometry']):
        c = [round(g['lon'],4), round(g['lat'],4)]
        seg_n.append(nid); seg_c.append(c)
        if use[nid] > 1 and len(seg_n) > 1:
            edges.append((seg_n[0], seg_n[-1], seg_c, gauge, elec, fer))
            seg_n, seg_c = [nid], [c]
    if len(seg_n) > 1:
        edges.append((seg_n[0], seg_n[-1], seg_c, gauge, elec, fer))

# train ferries: stitch BEFORE the component filter so islands (Sicily,
# Scandinavia-via-ferry) join the main component through the ferry edges.
if FERRIES:
    # only nodes that are edge endpoints (junctions / way ends) exist in the
    # edge graph — stitching to an intermediate node would leave the ferry
    # in its own component.
    all_coord = {}
    for w in ways:
        for nid, g in zip(w['nodes'], w['geometry']):
            if use[nid] > 1:
                all_coord[nid] = [round(g['lon'],4), round(g['lat'],4)]
    items = list(all_coord.items())
    def nearest(p):
        best, bd = None, 1e9
        for nid, c in items:
            dd = dist_km(c, p)
            if dd < bd: bd, best = dd, nid
        return best, bd
    fd = json.load(open(FERRIES))
    fnum = 0
    stitched = 0
    for w in fd.get('elements', []):
        if not w.get('geometry'): continue
        coords = [[round(g['lon'],4), round(g['lat'],4)] for g in w['geometry']]
        ends = []
        ok = True
        for endpoint in (coords[0], coords[-1]):
            nid, dd = nearest(endpoint)
            if dd > 10: ok = False; break
            ends.append((nid, dd, endpoint))
        if not ok: continue
        fa, fb = f"ferry{fnum}a", f"ferry{fnum}b"; fnum += 1
        # connectors rail-node -> berth (plain track), then the ferry edge itself
        for fn, (nid, dd, endpoint) in zip((fa, fb), ends):
            edges.append((nid, fn, [all_coord[nid], endpoint], None, None))
        edges.append((fa, fb, coords, None, None, True))
        stitched += 1
    print(f"ferries stitched: {stitched}")

# ---- stitch tagging gaps ------------------------------------------------------
# OSM mainline is frequently broken into pieces that touch (or nearly touch)
# without sharing a node id: a way end 5 m from another way's end, or a short
# untagged segment. Left alone, the giant-component filter silently drops whole
# regions (India: Mumbai, Kerala, Bangalore; 520 components). Two passes:
#   1. merge edge-graph nodes closer than MERGE_KM (same physical point)
#   2. bridge remaining components to the main one with a connector edge when a
#      dead-end node lies within BRIDGE_KM of the main component (a missing link)
MERGE_KM, BRIDGE_KM, MIN_COMP_EDGES = 0.05, 2.0, 5

node_coord = {}
for a, b, coords, *_ in edges:
    node_coord[a] = coords[0]; node_coord[b] = coords[-1]

def rewire(edge, a2, b2):
    """Re-point an edge at new endpoint node ids AND snap its geometry ends to them,
    otherwise the emitted GeoJSON (which is keyed by coordinates downstream) stays split."""
    a, b, coords, *rest = edge
    coords = [node_coord[a2]] + coords[1:-1] + [node_coord[b2]] if len(coords) > 1 else [node_coord[a2], node_coord[b2]]
    return (a2, b2, coords, *rest)

def components(edge_list):
    adj = defaultdict(set)
    for a, b, *_ in edge_list:
        adj[a].add(b); adj[b].add(a)
    seen = set(); comps = []
    for start in adj:
        if start in seen: continue
        comp, stack = set(), [start]
        while stack:
            u = stack.pop()
            if u in seen: continue
            seen.add(u); comp.add(u)
            stack.extend(adj[u] - seen)
        comps.append(comp)
    return comps

# pass 1: coordinate merge — ONLY across different components and only when one
# side is a dead end. Merging every close pair would fuse parallel tracks of a
# double-track line (4–10 m apart) into junctions and defeat chain contraction.
comps = components(edges)
comp_of = {}
for i, c in enumerate(comps):
    for n in c: comp_of[n] = i
cparent = list(range(len(comps)))
def cfind(x):
    while cparent[x] != x:
        cparent[x] = cparent[cparent[x]]; x = cparent[x]
    return x
deg = defaultdict(int)
for a, b, *_ in edges:
    deg[a] += 1; deg[b] += 1
cell = MERGE_KM / 111.32
grid = defaultdict(list)
for n, c in node_coord.items():
    grid[(int(c[0] / cell), int(c[1] / cell))].append(n)
parent = {n: n for n in node_coord}
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]; x = parent[x]
    return x
merged_nodes = 0
for (gx, gy), ns in grid.items():
    for n in ns:
        if deg[n] != 1: continue
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for m in grid.get((gx + dx, gy + dy), ()):
                    if m == n or cfind(comp_of[n]) == cfind(comp_of[m]): continue
                    if dist_km(node_coord[n], node_coord[m]) <= MERGE_KM:
                        parent[find(n)] = find(m)
                        cparent[cfind(comp_of[n])] = cfind(comp_of[m])
                        merged_nodes += 1
edges = [rewire(e, find(e[0]), find(e[1])) for e in edges if find(e[0]) != find(e[1])]
print(f"stitch pass 1: merged {merged_nodes} touching dead-ends across {len(comps)} components")

# pass 2: bridge components to the main one
bridged = 0
while True:
    comps = components(edges)
    comps.sort(key=len, reverse=True)
    main = comps[0]
    deg = defaultdict(int)
    for a, b, *_ in edges:
        deg[a] += 1; deg[b] += 1
    bcell = BRIDGE_KM / 111.32
    mgrid = defaultdict(list)
    for n in main:
        c = node_coord[n]; mgrid[(int(c[0] / bcell), int(c[1] / bcell))].append(n)
    new_edges, remap = [], {}
    for comp in comps[1:]:
        if len(comp) < MIN_COMP_EDGES: continue
        best = (BRIDGE_KM, None, None)
        for n in comp:
            if deg[n] != 1: continue
            c = node_coord[n]; gx, gy = int(c[0] / bcell), int(c[1] / bcell)
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    for m in mgrid.get((gx + dx, gy + dy), ()):
                        dd = dist_km(c, node_coord[m])
                        if dd < best[0]: best = (dd, n, m)
        if best[1] is not None:
            dd, n, m = best
            if dd <= MERGE_KM:
                remap[n] = m            # (near-)coincident: fuse the nodes, a 0 km edge would be dropped at emit
            else:
                new_edges.append((n, m, [node_coord[n], node_coord[m]], None, None))
    if not new_edges and not remap: break
    if remap:
        edges = [rewire(e, remap.get(e[0], e[0]), remap.get(e[1], e[1])) for e in edges
                 if remap.get(e[0], e[0]) != remap.get(e[1], e[1])]
    edges.extend(new_edges); bridged += len(new_edges) + len(remap)
print(f"stitch pass 2: bridged {bridged} components (gap ≤ {BRIDGE_KM} km); "
      f"{len(comps)} components remain, main has {len(main)} nodes")
kept = [e for e in edges if e[0] in main]

# contract degree-2 chains, but only across edges with IDENTICAL properties
deg = defaultdict(int)
for a, b, *_ in kept:
    deg[a] += 1; deg[b] += 1
by_node = defaultdict(list)
for i, (a, b, *_r) in enumerate(kept):
    by_node[a].append(i); by_node[b].append(i)
used = [False] * len(kept)
contracted = []
anchors = [n for n in deg if deg[n] != 2]
for start in anchors:
    for ei in by_node[start]:
        if used[ei]: continue
        a, b, coords, gauge, elec = kept[ei][:5]
        if len(kept[ei]) > 5 and kept[ei][5]: continue
        used[ei] = True
        cur = b if a == start else a
        chain = coords if a == start else coords[::-1]
        while deg[cur] == 2:
            nxt = [j for j in by_node[cur] if not used[j]]
            if not nxt: break
            j = nxt[0]
            na, nb, nc, ng, ne = kept[j][:5]
            if len(kept[j]) > 5 and kept[j][5]: break
            if (ng, ne) != (gauge, elec): break  # property change: keep edges separate
            used[j] = True
            seg = nc if na == cur else nc[::-1]
            chain = chain + seg[1:]
            cur = nb if na == cur else na
        contracted.append((start, cur, chain, gauge, elec))
for i, e in enumerate(kept):
    if not used[i]:
        contracted.append(e)
kept = contracted

feats = []
def emit(coords, gauge, elec, ferry=False):
    simp = rdp(coords, 0.001)
    km = sum(dist_km(simp[i], simp[i+1]) for i in range(len(simp)-1))
    if km == 0: return
    props = {"km": round(km, 3)}
    if gauge: props["gauge"] = gauge
    if elec is not None: props["electrified"] = elec
    if ferry: props["ferry"] = True
    feats.append({"type":"Feature","properties":props,
                  "geometry":{"type":"LineString","coordinates":simp}})

for e in kept:
    a, b, coords, gauge, elec = e[:5]
    ferry = len(e) > 5 and e[5]
    emit(coords, gauge, elec, ferry=ferry)

# sanity: the emitted network must be a single connected component
oadj = defaultdict(set)
for f in feats:
    c = f["geometry"]["coordinates"]; a, b = tuple(c[0]), tuple(c[-1]); oadj[a].add(b); oadj[b].add(a)
oseen, ocomps = set(), 0
for s0 in oadj:
    if s0 in oseen: continue
    ocomps += 1; st = [s0]
    while st:
        u = st.pop()
        if u in oseen: continue
        oseen.add(u); st.extend(oadj[u] - oseen)
if ocomps != 1:
    sys.exit(f"ERROR: output has {ocomps} connected components (expected 1) — check stitching")

fc = {"type":"FeatureCollection","features":feats}
if REGION:
    lats = [c[1] for f in feats for c in f["geometry"]["coordinates"]]
    lons = [c[0] for f in feats for c in f["geometry"]["coordinates"]]
    fc["metadata"] = {
        "name": REGION["name"], "source": REGION["source"], "license": REGION["license"],
        "builtAt": datetime.date.today().isoformat(),
        "bbox": [round(min(lons),2), round(min(lats),2), round(max(lons),2), round(max(lats),2)],
        "edges": len(feats), "km": round(sum(f["properties"]["km"] for f in feats)),
    }
out = json.dumps(fc, separators=(',',':'))
open(OUT,'w').write(out)
tagged = sum(1 for f in feats if 'gauge' in f['properties'])
print(f"edges: {len(feats):,} ({tagged:,} with gauge); size: {len(out)/1e6:.2f} MB")
