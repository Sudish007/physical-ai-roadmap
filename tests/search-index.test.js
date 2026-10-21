import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, createPlainMd } from '../src/build/md.js';
import { splitSections, headingIndex } from '../src/build/parse.js';
import { buildManifest } from '../src/build/manifest.js';
import { indexTokens, titleRecord, snippet, assertIndexSize, INDEX_MAX_BYTES, SNIPPET_MAX } from '../src/build/search-index.js';
import { buildSite } from '../src/build/write.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = readFileSync(path.join(ROOT, 'content', 'roadmap.md'), 'utf8');

test('snippet: ≤400 chars, cut at a word boundary with an ellipsis', () => {
  assert.equal(snippet('  a   b  '), 'a b');
  const long = Array.from({ length: 120 }, (_, i) => `word${i}`).join(' ');
  const s = snippet(long);
  assert.ok(s.length <= SNIPPET_MAX);
  assert.ok(s.endsWith('…'));
  assert.ok(/word\d+…$/.test(s), 'ends on a whole word');
  assert.ok(!s.slice(0, -1).endsWith(' '));
});

test('record shape: paragraphs, list items, table rows, fences and headings, with the nearest h3 as context', () => {
  const { sections } = splitSections(content);
  const s12 = sections[12];
  const { rowIndex } = buildManifest(sections, createPlainMd());
  const env = { label: 's12', headingIndex: headingIndex(sections), headings: s12.headings, rows: rowIndex.get('s12') };
  const tokens = parse(s12.body, env);
  const records = indexTokens({ file: s12.file, key: s12.key, title: s12.headingText }, tokens);
  for (const r of records) {
    assert.deepEqual(Object.keys(r), ['p', 's', 'h', 'a', 'x']);
    assert.equal(r.p, 's12.html');
    assert.equal(r.s, '12');
    assert.ok(r.x.length > 0 && r.x.length <= SNIPPET_MAX);
    assert.ok(!/<[a-z]/.test(r.x), 'plain text, no tags');
  }
  const purchase = records.find((r) => r.x.startsWith('JUDGMENT, high confidence Buy hardware only'));
  assert.ok(purchase, 'paragraph under 12.1');
  assert.equal(purchase.h, '12.1 Purchase rule');
  assert.equal(purchase.a, 's12-1');
  const rung4 = records.find((r) => r.a === 't-s12-rungs-4');
  assert.ok(rung4, 'trackable rows use the row anchor');
  assert.ok(rung4.x.startsWith('4 · 45/45 · 55/85 ·'));
  assert.equal(rung4.h, '12.2 Nine rungs');
  const heading = records.find((r) => r.x === '12.3 Sim-to-hardware release criteria');
  assert.equal(heading.a, 's12-3');
  assert.deepEqual(titleRecord({ file: 's12.html', key: '12', title: s12.headingText }), { p: 's12.html', s: '12', h: s12.headingText, a: 'top', x: s12.headingText });
});

test('fenced blocks and list items are indexed (the §17.3 queries are searchable)', () => {
  const { sections } = splitSections(content);
  const s17 = sections[17];
  const tokens = parse(s17.body, { label: 's17', headings: s17.headings });
  const records = indexTokens({ file: s17.file, key: '17', title: s17.headingText }, tokens);
  assert.ok(records.some((r) => r.x.includes('THESIS NARROW') && r.a === 's17-3'));
  assert.ok(records.some((r) => r.x.startsWith('Final proceedings, DOI records') && r.a === 's17-2'));
});

test('the full index stays under the 500 KB cap and has one title record per page', () => {
  const site = buildSite(content);
  const json = site.files['search-index.json'];
  const bytes = assertIndexSize(json);
  assert.ok(bytes <= INDEX_MAX_BYTES);
  assert.ok(bytes > 200 * 1024, 'the index covers the whole report');
  const records = JSON.parse(json);
  assert.equal(records.filter((r) => r.a === 'top' && r.x === r.h).length, 24, 'one title record per page');
  assert.ok(records.some((r) => r.p === 's02.html' && r.a === 'top' && r.x.startsWith('Seven sessions')), 'prose before the first h3 anchors to the page top');
  assert.equal(records.filter((r) => r.a === 'front-matter').length, 5);
  assert.equal(new Set(records.map((r) => r.p)).size, 24);
  assert.equal(records.length, site.counts.searchRecords);
  assert.throws(() => assertIndexSize('x'.repeat(INDEX_MAX_BYTES + 1)), /above the/);
});
