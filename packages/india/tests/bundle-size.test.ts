import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

// Rule (docs/superpowers/specs/2026-09-02-global-networks-design.md): data packages
// stay ≤ 1.5 MB gzipped per file; anything bigger needs a lighter resolution tier.
describe('data size guard', () => {
  it('network.json gzips to ≤ 1.5 MB', () => {
    const gz = gzipSync(readFileSync(fileURLToPath(new URL('../data/network.json', import.meta.url)))).length;
    expect(gz, `${(gz / 1048576).toFixed(2)} MB gzipped`).toBeLessThanOrEqual(1.5 * 1024 * 1024);
  });
});
