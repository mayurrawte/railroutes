#!/usr/bin/env python3
"""Corridor spike: OSM ways -> routable rail graph -> Dijkstra test.

Graph model: nodes are shared OSM node ids (junctions/endpoints), edges are
way segments between them with real geometry + km length + gauge/electrified.
"""
import json, math, heapq, gzip, sys
from collections import defaultdict

def dist_km(a, b):
    dx = (b[0]-a[0]) * math.cos(math.radians((a[1]+b[1])/2)) * 111.32
    return math.hypot(dx, (b[1]-a[1]) * 111.32)

d = json.load(open('corridor-raw.json'))
ways = [w for w in d['elements'] if w.get('geometry') and w.get('nodes')]

# 1. count node usage to find junctions (shared nodes)
use = defaultdict(int)
for w in ways:
    for n in w['nodes']:
        use[n] += 1
    use[w['nodes'][0]] += 1  # endpoints always split
    use[w['nodes'][-1]] += 1

# 2. split ways at junctions -> edges
edges = []          # (node_a, node_b, km, coords)
coord_of = {}
for w in ways:
    tags = w.get('tags', {})
    seg_nodes, seg_coords = [], []
    for nid, g in zip(w['nodes'], w['geometry']):
        c = (round(g['lon'], 5), round(g['lat'], 5))
        coord_of[nid] = c
        seg_nodes.append(nid); seg_coords.append(c)
        if use[nid] > 1 and len(seg_nodes) > 1:
            km = sum(dist_km(seg_coords[i], seg_coords[i+1]) for i in range(len(seg_coords)-1))
            edges.append((seg_nodes[0], seg_nodes[-1], km))
            seg_nodes, seg_coords = [nid], [c]
    if len(seg_nodes) > 1:
        km = sum(dist_km(seg_coords[i], seg_coords[i+1]) for i in range(len(seg_coords)-1))
        edges.append((seg_nodes[0], seg_nodes[-1], km))

adj = defaultdict(list)
for a, b, km in edges:
    if a != b and km > 0:
        adj[a].append((b, km)); adj[b].append((a, km))

print(f"graph: {len(adj):,} nodes, {len(edges):,} edges")

def nearest(pt):
    return min(adj, key=lambda n: dist_km(coord_of[n], pt))

def dijkstra(src, dst):
    dist = {src: 0.0}; prev = {}; pq = [(0.0, src)]
    while pq:
        du, u = heapq.heappop(pq)
        if u == dst: break
        if du > dist.get(u, 1e18): continue
        for v, w in adj[u]:
            nd = du + w
            if nd < dist.get(v, 1e18):
                dist[v] = nd; prev[v] = u; heapq.heappush(pq, (nd, v))
    if dst not in dist: return None, None
    path = [dst]
    while path[-1] != src: path.append(prev[path[-1]])
    return dist[dst], path[::-1]

tests = [
    ("Rotterdam", (4.47, 51.92), "Genoa",  (8.92, 44.41)),
    ("Rotterdam", (4.47, 51.92), "Basel",  (7.59, 47.55)),
    ("Cologne",   (6.96, 50.94), "Milan",  (9.10, 45.49)),
]
for name_a, a, name_b, b in tests:
    na, nb = nearest(a), nearest(b)
    km, path = dijkstra(na, nb)
    if km is None:
        print(f"{name_a} -> {name_b}: NO ROUTE (disconnected)")
    else:
        print(f"{name_a} -> {name_b}: {km:,.0f} km via {len(path):,} graph nodes")

# export the winning route as GeoJSON for eyeballing
na, nb = nearest(tests[0][1]), nearest(tests[0][3])
km, path = dijkstra(na, nb)
if path:
    coords = [list(coord_of[n]) for n in path]
    gj = {"type":"Feature","properties":{"km":round(km,1),"name":"Rotterdam-Genoa"},
          "geometry":{"type":"LineString","coordinates":coords}}
    open('route-rotterdam-genoa.geojson','w').write(json.dumps(gj))
    print("wrote route-rotterdam-genoa.geojson")
