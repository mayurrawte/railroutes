import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

// Bundling rule from docs/superpowers/specs/2026-09-02-global-networks-design.md:
// a network ships inside the npm package only if it gzips to ≤ 1.5 MB.
// Anything larger must move to the CDN path (NETWORK_URLS + loadNetwork).
const LIMIT = 1.5 * 1024 * 1024;
const dir = fileURLToPath(new URL('../src/networks/', import.meta.url));

describe('bundled network size guard', () => {
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    it(`${file} gzips to ≤ 1.5 MB`, () => {
      const gz = gzipSync(readFileSync(dir + file)).length;
      expect(gz, `${file} is ${(gz / 1048576).toFixed(2)} MB gzipped`).toBeLessThanOrEqual(LIMIT);
    });
  }
});
