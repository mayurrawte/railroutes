#!/usr/bin/env python3
"""Pipeline v0: raw Overpass ways -> compact edge-level network GeoJSON.

Splits ways at junctions, simplifies each edge's geometry (RDP ~100m),
drops tiny disconnected components, emits a FeatureCollection of edges.
"""
import json, math, sys
from collections import defaultdict
sys.setrecursionlimit(100000)

SRC, OUT = sys.argv[1], sys.argv[2]

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

d = json.load(open(SRC))
ways = [w for w in d['elements'] if w.get('geometry') and w.get('nodes')]

use = defaultdict(int)
for w in ways:
    for n in w['nodes']: use[n] += 1
    use[w['nodes'][0]] += 1; use[w['nodes'][-1]] += 1

edges = []
for w in ways:
    seg_n, seg_c = [], []
    for nid, g in zip(w['nodes'], w['geometry']):
        c = [round(g['lon'],4), round(g['lat'],4)]
        seg_n.append(nid); seg_c.append(c)
        if use[nid] > 1 and len(seg_n) > 1:
            edges.append((seg_n[0], seg_n[-1], seg_c))
            seg_n, seg_c = [nid], [c]
    if len(seg_n) > 1:
        edges.append((seg_n[0], seg_n[-1], seg_c))

# connected components over node ids; keep the giant one
adj = defaultdict(set)
for a, b, _ in edges:
    adj[a].add(b); adj[b].add(a)
seen, comp_of = set(), {}
comps = []
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

feats = []
for a, b, coords in kept:
    simp = rdp(coords, 0.001)
    km = sum(dist_km(simp[i], simp[i+1]) for i in range(len(simp)-1))
    if km == 0: continue
    feats.append({"type":"Feature","properties":{"km":round(km,3)},
                  "geometry":{"type":"LineString","coordinates":simp}})

fc = {"type":"FeatureCollection","features":feats}
out = json.dumps(fc, separators=(',',':'))
open(OUT,'w').write(out)
print(f"edges kept: {len(feats):,} (dropped {len(edges)-len(kept):,} off-main-component)")
print(f"size: {len(out)/1e6:.2f} MB")
