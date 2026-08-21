import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { NoRouteError, railRoute, railRouteAlternatives } from 'railroute-ts';
import { EUROPE_NETWORK } from 'railroute-ts/networks/europe';
import './style.css';

type LngLat = [number, number];

const PRESETS: Array<{ label: string; a: LngLat; b: LngLat }> = [
  { label: 'Rotterdam → Genoa', a: [4.47, 51.92], b: [8.92, 44.41] },
  { label: 'London → Vienna', a: [-0.12, 51.53], b: [16.37, 48.19] },
  { label: 'Stockholm → Rome', a: [18.06, 59.33], b: [12.5, 41.9] },
  { label: 'Lisbon → Warsaw', a: [-9.14, 38.71], b: [21.0, 52.23] },
  { label: 'Basel → Milan', a: [7.59, 47.55], b: [9.19, 45.49] },
];

const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      },
    },
    layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
  },
  center: [9, 49],
  zoom: 4.2,
});

const markers: maplibregl.Marker[] = [];
let points: LngLat[] = [];
const resultEl = document.getElementById('result')!;
const altsEl = document.getElementById('alts') as HTMLInputElement;

function clearMarkers() {
  markers.forEach((m) => m.remove());
  markers.length = 0;
}

function setRouteData(features: GeoJSON.Feature[]) {
  (map.getSource('route') as maplibregl.GeoJSONSource | undefined)?.setData({
    type: 'FeatureCollection',
    features,
  });
}

function drawPoints() {
  clearMarkers();
  for (const p of points) {
    markers.push(new maplibregl.Marker({ color: '#e11d48' }).setLngLat(p).addTo(map));
  }
}

function fmt(km: number): string {
  return `${Math.round(km).toLocaleString()} km`;
}

function route() {
  if (points.length !== 2) return;
  const [a, b] = points;
  resultEl.textContent = 'Routing…';
  // yield a frame so the label paints before the (sync) Dijkstra runs
  requestAnimationFrame(() => {
    try {
      const k = altsEl.checked ? 3 : 1;
      const t0 = performance.now();
      const routes =
        k === 1
          ? [railRoute(a, b, { network: EUROPE_NETWORK, speedKmh: 80 })]
          : railRouteAlternatives(a, b, { network: EUROPE_NETWORK, speedKmh: 80, k });
      const ms = Math.round(performance.now() - t0);
      setRouteData(
        routes.map((r, i) => ({ ...r, properties: { ...r.properties, rank: i } })),
      );
      const best = routes[0];
      const hrs = best.properties.durationHours;
      resultEl.innerHTML =
        `<strong>${fmt(best.properties.length)}</strong>` +
        (hrs ? ` · ~${Math.round(hrs)} h at 80 km/h` : '') +
        (routes.length > 1
          ? `<br/>alternatives: ${routes.slice(1).map((r) => fmt(r.properties.length)).join(', ')}`
          : '') +
        `<br/><span class="meta">computed in ${ms} ms, in your browser</span>`;
      const coords = routes.flatMap((r) => (r.geometry as GeoJSON.LineString).coordinates);
      const lons = coords.map((c) => c[0]);
      const lats = coords.map((c) => c[1]);
      map.fitBounds(
        [
          [Math.min(...lons), Math.min(...lats)],
          [Math.max(...lons), Math.max(...lats)],
        ],
        { padding: 60, duration: 600 },
      );
    } catch (e) {
      resultEl.textContent =
        e instanceof NoRouteError
          ? 'No rail route between those points (disconnected or off-network).'
          : `Error: ${(e as Error).message}`;
    }
  });
}

map.on('click', (e) => {
  if (points.length === 2) points = [];
  points.push([e.lngLat.lng, e.lngLat.lat]);
  drawPoints();
  if (points.length === 2) route();
  else {
    setRouteData([]);
    resultEl.textContent = 'Click the destination…';
  }
});

map.on('load', () => {
  map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({
    id: 'route-alts',
    type: 'line',
    source: 'route',
    filter: ['!=', ['get', 'rank'], 0],
    paint: { 'line-color': '#94a3b8', 'line-width': 3, 'line-dasharray': [2, 2] },
  });
  map.addLayer({
    id: 'route-main',
    type: 'line',
    source: 'route',
    filter: ['==', ['get', 'rank'], 0],
    paint: { 'line-color': '#e11d48', 'line-width': 4 },
  });
});

const presetsEl = document.getElementById('presets')!;
for (const p of PRESETS) {
  const btn = document.createElement('button');
  btn.textContent = p.label;
  btn.onclick = () => {
    points = [p.a, p.b];
    drawPoints();
    route();
  };
  presetsEl.appendChild(btn);
}

altsEl.onchange = () => route();
