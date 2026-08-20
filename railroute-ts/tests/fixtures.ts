import type { RailNetwork } from '../src/types.js';

// Y-shaped toy network, coords in degrees near the equator so deg≈111.32km:
//   A(0,0) — B(1,0) — C(2,0)
//                └──── D(1,1)
// E(5,5) is a disconnected island: E — F
export const TOY_NETWORK: RailNetwork = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[0, 0], [1, 0]] } },
    { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[1, 0], [2, 0]] } },
    { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[1, 0], [1, 1]] } },
    { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[5, 5], [6, 5]] } },
  ],
};
