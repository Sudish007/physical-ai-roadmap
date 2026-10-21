#!/usr/bin/env node
// Local convenience (D11): re-copy content/roadmap.md from the ahead origin when it exists and rewrite content/SOURCE.md.
import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_ORIGIN } from '../src/build/content-map.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(REPO, 'content', 'roadmap.md');
const sourceDoc = path.join(REPO, 'content', 'SOURCE.md');

let origin;
try {
  origin = await fs.readFile(CONTENT_ORIGIN);
} catch {
  console.log('origin not found, nothing to do');
  process.exit(0);
}

await fs.writeFile(target, origin);
const text = origin.toString('utf8');
const sha = createHash('sha256').update(origin).digest('hex').toUpperCase();
const lines = text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
const chars = text.length.toLocaleString('en-US');
const eol = text.includes('\r\n') ? 'CRLF' : 'LF';
const today = new Date().toISOString().slice(0, 10);

const doc = `# Source of content/roadmap.md
- Origin: \`${CONTENT_ORIGIN}\`
- Copied: ${today}
- SHA256: \`${sha}\`
- Lines: ${lines} (${eol} line endings, UTF-8, ${chars} characters)
\`content/roadmap.md\` is the site's single source of truth. \`npm run sync-content\`
re-copies it from the origin path when the origin exists; the build never reads the origin.
Rights: content/roadmap.md is © Sudish Kumar, all rights reserved unless he changes it; the MIT licence in LICENSE covers the code only.
`;
await fs.writeFile(sourceDoc, doc, 'utf8');
console.log(`copied ${lines} lines (${sha.slice(0, 12)}…) to content/roadmap.md; content/SOURCE.md rewritten`);
