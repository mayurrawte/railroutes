#!/usr/bin/env python3
"""Pipeline v2: raw Overpass ways -> compact edge-level network GeoJSON.

- splits ways at junctions, keeps the giant connected component
- carries gauge / electrified onto edges; chain contraction only merges
  edges whose properties match
- stitches train-ferry ways (route=ferry + railway=ferry) into the network
  by connecting their endpoints to the nearest rail node
Usage: build-network.py RAW.json OUT.json [FERRIES.json]
"""
import json, math, sys
from collections import defaultdict
sys.setrecursionlimit(100000)

SRC, OUT = sys.argv[1], sys.argv[2]
FERRIES = sys.argv[3] if len(sys.argv) > 3 else None

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
    seg_n, seg_c = [], []
    for nid, g in zip(w['nodes'], w['geometry']):
        c = [round(g['lon'],4), round(g['lat'],4)]
        seg_n.append(nid); seg_c.append(c)
        if use[nid] > 1 and len(seg_n) > 1:
            edges.append((seg_n[0], seg_n[-1], seg_c, gauge, elec))
            seg_n, seg_c = [nid], [c]
    if len(seg_n) > 1:
        edges.append((seg_n[0], seg_n[-1], seg_c, gauge, elec))

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

# giant component
adj = defaultdict(set)
for a, b, *_ in edges:
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
main = max(comps, key=len)
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

fc = {"type":"FeatureCollection","features":feats}
out = json.dumps(fc, separators=(',',':'))
open(OUT,'w').write(out)
tagged = sum(1 for f in feats if 'gauge' in f['properties'])
print(f"edges: {len(feats):,} ({tagged:,} with gauge); size: {len(out)/1e6:.2f} MB")
