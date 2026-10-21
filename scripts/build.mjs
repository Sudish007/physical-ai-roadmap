#!/usr/bin/env node
// Build content/roadmap.md into dist/ (or --out <dir>). Exits 1 on any error and leaves the previous output untouched.
import { writeSite } from '../src/build/write.js';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

try {
  const { summary, site, out } = await writeSite({ out: arg('--out') });
  const skipped = site.stats.crossrefs.skipped;
  if (skipped.length) {
    const grouped = new Map();
    for (const s of skipped) {
      const k = `${s.ref} (${s.reason})`;
      grouped.set(k, (grouped.get(k) || 0) + 1);
    }
    console.log(`crossrefs skipped: ${[...grouped].map(([k, n]) => (n > 1 ? `${k} ×${n}` : k)).join('; ')}`);
  }
  for (const w of site.stats.warnings) console.warn(`warning: ${w}`);
  console.log(summary);
  console.log(`written to ${out}`);
} catch (err) {
  console.error(`build failed: ${err && err.message ? err.message : err}`);
  process.exit(1);
}
