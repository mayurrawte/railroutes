import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { NoRouteError, railRoute, railRouteAlternatives, registerStations } from 'railroute-ts';
import { EUROPE_NETWORK, EUROPE_STATIONS } from '@railroute-ts/europe';

registerStations(EUROPE_STATIONS);
import './style.css';

type LngLat = [number, number];

// the bundled network's coverage (fetch bbox of the Europe pipeline)
const COVERAGE = { minLon: -10, maxLon: 32, minLat: 35, maxLat: 72 };
const inCoverage = ([lon, lat]: LngLat) =>
  lon >= COVERAGE.minLon && lon <= COVERAGE.maxLon && lat >= COVERAGE.minLat && lat <= COVERAGE.maxLat;

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

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const resultEl = el<HTMLDivElement>('result');
const altsEl = el<HTMLInputElement>('alts');
const speedEl = el<HTMLInputElement>('speed');
const speedVEl = el<HTMLSpanElement>('speedv');
const fromEl = el<HTMLInputElement>('from');
const toEl = el<HTMLInputElement>('to');

// ---- stations: datalist search over the bundled 12,886 ----
const byName = new Map(EUROPE_STATIONS.map((s) => [s.name.toLowerCase(), s]));
const datalist = el<HTMLDataListElement>('stations');
{
  const frag = document.createDocumentFragment();
  for (const s of EUROPE_STATIONS) {
    const opt = document.createElement('option');
    opt.value = s.name;
    frag.appendChild(opt);
  }
  datalist.appendChild(frag);
}

// ---- endpoints (from map clicks, station pickers, or presets) ----
let points: (LngLat | null)[] = [null, null];
const markers: (maplibregl.Marker | null)[] = [null, null];

function setPoint(i: 0 | 1, p: LngLat | null, label?: string) {
  points[i] = p;
  markers[i]?.remove();
  markers[i] = null;
  if (p) {
    const m = new maplibregl.Marker({ color: i === 0 ? '#e11d48' : '#0f766e', draggable: true })
      .setLngLat(p)
      .addTo(map);
    m.on('dragend', () => {
      const ll = m.getLngLat();
      points[i] = [ll.lng, ll.lat];
      (i === 0 ? fromEl : toEl).value = '';
      route();
    });
    markers[i] = m;
  }
  if (label !== undefined) (i === 0 ? fromEl : toEl).value = label;
}

function setRouteData(features: GeoJSON.Feature[]) {
  (map.getSource('route') as maplibregl.GeoJSONSource | undefined)?.setData({
    type: 'FeatureCollection',
    features,
  });
}

const fmt = (km: number) => `${Math.round(km).toLocaleString()} km`;

const distKm = (a: LngLat, b: LngLat) => {
  const dx = (b[0] - a[0]) * Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180) * 111.32;
  return Math.hypot(dx, (b[1] - a[1]) * 111.32);
};

function route() {
  const [a, b] = points;
  if (!a || !b) return;
  const outside = [a, b].filter((p) => !inCoverage(p!));
  if (outside.length) {
    setRouteData([]);
    resultEl.innerHTML =
      `<strong>Outside the bundled network.</strong> This demo ships the Europe network ` +
      `(35–72°N, 10°W–32°E). Points elsewhere would snap to the nearest European track — ` +
      `world coverage is on the <a href="https://github.com/mayurrawte/railroutes/issues" target="_blank" rel="noopener">roadmap</a> via <code>loadNetwork(url)</code>.`;
    return;
  }
  resultEl.textContent = 'Routing…';
  requestAnimationFrame(() => {
    try {
      const speedKmh = Number(speedEl.value);
      const k = altsEl.checked ? 3 : 1;
      const t0 = performance.now();
      const routes =
        k === 1
          ? [railRoute(a, b, { network: EUROPE_NETWORK, speedKmh })]
          : railRouteAlternatives(a, b, { network: EUROPE_NETWORK, speedKmh, k });
      const ms = Math.round(performance.now() - t0);
      setRouteData(routes.map((r, i) => ({ ...r, properties: { ...r.properties, rank: i } })));
      const best = routes[0];
      const hrs = best.properties.durationHours!;
      resultEl.innerHTML =
        `<strong>${fmt(best.properties.length)}</strong> · ~${hrs < 10 ? hrs.toFixed(1) : Math.round(hrs)} h at ${speedKmh} km/h` +
        (routes.length > 1
          ? `<br/>alternatives: ${routes.slice(1).map((r) => fmt(r.properties.length)).join(', ')}`
          : '') +
        `<br/><span class="meta">computed in ${ms} ms, in your browser</span>`;
      // warn when an endpoint snapped far from where the user pointed
      // (mid-sea clicks, or edges of the coverage box)
      const line = routes[0].geometry as GeoJSON.LineString;
      const snapA = distKm(a, line.coordinates[0] as LngLat);
      const snapB = distKm(b, line.coordinates[line.coordinates.length - 1] as LngLat);
      const worst = Math.max(snapA, snapB);
      if (worst > 100) {
        resultEl.innerHTML += `<br/><span class="warn">⚠ an endpoint snapped ${Math.round(worst)} km to the nearest track — the route may not be what you meant</span>`;
      }
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

// map clicks fill from → to → start over
let clickTurn: 0 | 1 = 0;
map.on('click', (e) => {
  const p: LngLat = [e.lngLat.lng, e.lngLat.lat];
  setPoint(clickTurn, p, '');
  if (clickTurn === 1) route();
  else {
    setRouteData([]);
    resultEl.textContent = 'Click the destination…';
  }
  clickTurn = clickTurn === 0 ? 1 : 0;
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

function onStationInput(i: 0 | 1) {
  const input = i === 0 ? fromEl : toEl;
  const s = byName.get(input.value.toLowerCase());
  if (!s) return;
  setPoint(i, s.coord as LngLat, s.name);
  clickTurn = 0;
  route();
}
fromEl.addEventListener('change', () => onStationInput(0));
toEl.addEventListener('change', () => onStationInput(1));

el<HTMLButtonElement>('swap').onclick = () => {
  const [a, b] = points;
  const [fa, ta] = [fromEl.value, toEl.value];
  setPoint(0, b, ta);
  setPoint(1, a, fa);
  route();
};

const presetsEl = el<HTMLDivElement>('presets');
for (const p of PRESETS) {
  const btn = document.createElement('button');
  btn.textContent = p.label;
  btn.onclick = () => {
    setPoint(0, p.a, '');
    setPoint(1, p.b, '');
    clickTurn = 0;
    route();
  };
  presetsEl.appendChild(btn);
}

altsEl.onchange = () => route();
speedEl.oninput = () => {
  speedVEl.textContent = speedEl.value;
  route();
};
