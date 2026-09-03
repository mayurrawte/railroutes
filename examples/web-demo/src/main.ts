import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { NoRouteError, mergeNetworks, railRoute, railRouteAlternatives, registerStations } from 'railroute-ts';
import type { RailNetwork, Station } from 'railroute-ts';
import { EUROPE_NETWORK, EUROPE_STATIONS } from '@railroute-ts/europe';
import './style.css';

type LngLat = [number, number];
type Preset = { label: string; a: LngLat | string; b: LngLat | string };
type RegionKey = 'europe' | 'india' | 'north-america' | 'china' | 'cis' | 'eurasia';
type RegionData = { network: RailNetwork; stations: Station[] };

// Europe ships in the main bundle; the other data packages are code-split and
// fetched on demand (each is 0.3–1 MB gzipped).
const REGIONS: Record<RegionKey, { label: string; center: LngLat; zoom: number; presets: Preset[]; load: () => Promise<RegionData> }> = {
  europe: {
    label: 'Europe', center: [9, 49], zoom: 4.2,
    presets: [
      { label: 'Rotterdam → Genoa', a: [4.47, 51.92], b: [8.92, 44.41] },
      { label: 'London → Vienna', a: [-0.12, 51.53], b: [16.37, 48.19] },
      { label: 'Stockholm → Rome', a: [18.06, 59.33], b: [12.5, 41.9] },
      { label: 'Lisbon → Warsaw', a: [-9.14, 38.71], b: [21.0, 52.23] },
      { label: 'Basel → Milan', a: [7.59, 47.55], b: [9.19, 45.49] },
    ],
    load: async () => ({ network: EUROPE_NETWORK, stations: EUROPE_STATIONS }),
  },
  india: {
    label: 'India', center: [79, 22.5], zoom: 4.3,
    presets: [
      { label: 'New Delhi → Mumbai CSMT', a: 'NDLS', b: 'CSMT' },
      { label: 'Howrah → Chennai', a: 'HWH', b: 'MAS' },
      { label: 'Delhi → Baramulla', a: 'NDLS', b: 'BRML' },
      { label: 'Ahmedabad → Dibrugarh', a: 'ADI', b: 'DBRG' },
      { label: 'Bengaluru → Kanyakumari', a: 'SBC', b: 'CAPE' },
    ],
    load: async () => {
      const m = await import('@railroute-ts/india');
      return { network: m.INDIA_NETWORK, stations: m.INDIA_STATIONS };
    },
  },
  'north-america': {
    label: 'North America', center: [-97, 42], zoom: 3.3,
    presets: [
      { label: 'Los Angeles → Chicago', a: 'Los Angeles Union Station', b: 'Chicago Union Station' },
      { label: 'New York → Chicago', a: [-74.0, 40.71], b: [-87.63, 41.88] },
      { label: 'Vancouver → Toronto', a: [-123.1, 49.28], b: [-79.38, 43.65] },
      { label: 'Seattle → Los Angeles', a: [-122.33, 47.6], b: [-118.24, 34.05] },
      { label: 'Laredo → Mexico City', a: [-99.5, 27.5], b: [-99.13, 19.43] },
    ],
    load: async () => {
      const m = await import('@railroute-ts/north-america');
      return { network: m.NORTH_AMERICA_NETWORK, stations: m.NORTH_AMERICA_STATIONS };
    },
  },
  cis: {
    label: 'Russia / CIS', center: [70, 55], zoom: 3,
    presets: [
      { label: 'Moscow → Vladivostok (Trans-Siberian)', a: [37.66, 55.77], b: [131.88, 43.11] },
      { label: 'Moscow → Almaty', a: [37.66, 55.77], b: [76.94, 43.24] },
      { label: 'St Petersburg → Tashkent', a: [30.36, 59.93], b: [69.28, 41.3] },
    ],
    load: async () => {
      const m = await import('@railroute-ts/cis');
      return { network: m.CIS_NETWORK, stations: m.CIS_STATIONS };
    },
  },
  eurasia: {
    label: 'Eurasia (China + CIS + Europe)', center: [60, 48], zoom: 2.6,
    presets: [
      { label: 'Chongqing → Duisburg (land bridge)', a: [106.55, 29.56], b: [6.78, 51.43] },
      { label: 'Beijing → Moscow (Trans-Mongolian)', a: [116.4, 39.9], b: [37.66, 55.77] },
      { label: 'Xi\'an → Hamburg', a: [108.94, 34.34], b: [10.0, 53.55] },
      { label: 'Almaty → Warsaw', a: [76.94, 43.24], b: [21.0, 52.23] },
    ],
    load: async () => {
      const [cn, cis] = await Promise.all([import('@railroute-ts/china'), import('@railroute-ts/cis')]);
      return {
        network: mergeNetworks([cn.CHINA_NETWORK, cis.CIS_NETWORK, EUROPE_NETWORK]),
        stations: [...cn.CHINA_STATIONS, ...cis.CIS_STATIONS, ...EUROPE_STATIONS],
      };
    },
  },
  china: {
    label: 'China', center: [105, 35], zoom: 3.6,
    presets: [
      { label: 'Shanghai-Hongqiao → Beijing', a: 'Shanghai-Hongqiao', b: 'Beijing' },
      { label: 'Guangzhou → Beijing', a: [113.26, 23.13], b: [116.4, 39.9] },
      { label: 'Chongqing → Alashankou', a: [106.55, 29.56], b: [82.57, 45.17] },
      { label: 'Beijing → Harbin', a: [116.4, 39.9], b: [126.53, 45.8] },
    ],
    load: async () => {
      const m = await import('@railroute-ts/china');
      return { network: m.CHINA_NETWORK, stations: m.CHINA_STATIONS };
    },
  },
};

const params = new URLSearchParams(location.search);
let regionKey: RegionKey = (params.get('region') as RegionKey) in REGIONS ? (params.get('region') as RegionKey) : 'europe';
let region: RegionData = { network: EUROPE_NETWORK, stations: EUROPE_STATIONS };
registerStations(EUROPE_STATIONS);

const bboxOf = (n: RailNetwork): [number, number, number, number] => n.metadata?.bbox ?? [-10, 35, 32, 72];
const inCoverage = ([lon, lat]: LngLat) => {
  const [minLon, minLat, maxLon, maxLat] = bboxOf(region.network);
  return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
};

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
  center: REGIONS[regionKey].center,
  zoom: REGIONS[regionKey].zoom,
});

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const resultEl = el<HTMLDivElement>('result');
const altsEl = el<HTMLInputElement>('alts');
const speedEl = el<HTMLInputElement>('speed');
const speedVEl = el<HTMLSpanElement>('speedv');
const fromEl = el<HTMLInputElement>('from');
const toEl = el<HTMLInputElement>('to');

// ---- stations: datalist search over the current region's dataset ----
let byName = new Map<string, Station>();
const datalist = el<HTMLDataListElement>('stations');
function loadStations(stations: Station[]) {
  byName = new Map(stations.map((s) => [s.name.toLowerCase(), s]));
  datalist.replaceChildren();
  const frag = document.createDocumentFragment();
  for (const s of stations) {
    const opt = document.createElement('option');
    opt.value = s.name;
    frag.appendChild(opt);
  }
  datalist.appendChild(frag);
  const hasStations = stations.length > 0;
  fromEl.placeholder = hasStations ? 'From station… (or click map)' : 'Click the map (no station codes for this region yet)';
  toEl.placeholder = hasStations ? 'To station…' : 'Click the map for the destination';
  fromEl.disabled = toEl.disabled = !hasStations;
}
loadStations(EUROPE_STATIONS);

// ---- coverage outline ----
function setCoverage(n: RailNetwork) {
  const [minLon, minLat, maxLon, maxLat] = bboxOf(n);
  (map.getSource('coverage') as maplibregl.GeoJSONSource | undefined)?.setData({
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [[[minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat]]] },
  });
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
    const [minLon, minLat, maxLon, maxLat] = bboxOf(region.network);
    resultEl.innerHTML =
      `<strong>Outside the ${REGIONS[regionKey].label} network</strong> (${minLat}–${maxLat}°N, ${minLon}–${maxLon}°E, dashed outline). ` +
      `Switch region above — Europe, India, North America and China are available; more via ` +
      `<a href="https://github.com/mayurrawte/railroutes/issues" target="_blank" rel="noopener">the roadmap</a>.`;
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
          ? [railRoute(a, b, { network: region.network, speedKmh })]
          : railRouteAlternatives(a, b, { network: region.network, speedKmh, k });
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
  map.addSource('coverage', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({
    id: 'coverage-outline',
    type: 'line',
    source: 'coverage',
    paint: { 'line-color': '#64748b', 'line-width': 1.5, 'line-dasharray': [3, 3], 'line-opacity': 0.7 },
  });
  setCoverage(region.network);
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
function resolvePreset(p: LngLat | string): [LngLat, string] {
  if (typeof p !== 'string') return [p, ''];
  const s = region.stations.find((st) => st.code === p || st.name.toLowerCase() === p.toLowerCase());
  return s ? [s.coord as LngLat, s.name] : [[0, 0], p];
}
function loadPresets(presets: Preset[]) {
  presetsEl.replaceChildren();
  for (const p of presets) {
    const btn = document.createElement('button');
    btn.textContent = p.label;
    btn.onclick = () => {
      const [a, la] = resolvePreset(p.a);
      const [b, lb] = resolvePreset(p.b);
      setPoint(0, a, la);
      setPoint(1, b, lb);
      clickTurn = 0;
      route();
    };
    presetsEl.appendChild(btn);
  }
}
loadPresets(REGIONS[regionKey].presets);

// ---- region switcher ----
const regionEl = el<HTMLSelectElement>('region');
for (const [key, r] of Object.entries(REGIONS)) {
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = r.label;
  regionEl.appendChild(opt);
}
regionEl.value = regionKey;

async function switchRegion(key: RegionKey) {
  regionEl.disabled = true;
  resultEl.textContent = `Loading the ${REGIONS[key].label} network…`;
  try {
    const data = await REGIONS[key].load();
    regionKey = key;
    region = data;
    registerStations(data.stations);
    loadStations(data.stations);
    loadPresets(REGIONS[key].presets);
    setCoverage(data.network);
    setPoint(0, null, '');
    setPoint(1, null, '');
    setRouteData([]);
    clickTurn = 0;
    const url = new URL(location.href);
    url.searchParams.set('region', key);
    history.replaceState(null, '', url);
    map.flyTo({ center: REGIONS[key].center, zoom: REGIONS[key].zoom, duration: 900 });
    const meta = data.network.metadata;
    resultEl.innerHTML =
      `<strong>${REGIONS[key].label}</strong>: ${meta ? `${meta.edges.toLocaleString()} edges, ${meta.km.toLocaleString()} km of track` : 'loaded'}` +
      (data.stations.length ? `, ${data.stations.length.toLocaleString()} stations` : ', coordinates only') +
      `.<br/><span class="meta">Pick a preset, two stations, or click the map twice.</span>`;
  } catch (e) {
    resultEl.textContent = `Could not load ${REGIONS[key].label}: ${(e as Error).message}`;
    regionEl.value = regionKey;
  } finally {
    regionEl.disabled = false;
  }
}
regionEl.onchange = () => switchRegion(regionEl.value as RegionKey);
if (regionKey !== 'europe') switchRegion(regionKey);

altsEl.onchange = () => route();
speedEl.oninput = () => {
  speedVEl.textContent = speedEl.value;
  route();
};
