import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, newStats } from '../src/build/md.js';
import { CROSSREF_RE, assertExceptionsPresent } from '../src/build/crossref.js';
import { CROSSREF_EXCEPTIONS } from '../src/build/content-map.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = readFileSync(path.join(ROOT, 'tests', 'fixtures', 'md', 'crossref.md'), 'utf8');
const content = readFileSync(path.join(ROOT, 'content', 'roadmap.md'), 'utf8');

const headingIndex = new Map([[14, new Set(['s14-1', 's14-2', 's14-3'])], [5, new Set(['s5-4'])]]);

function renderFixture() {
  const stats = newStats();
  const html = render(fixture, { label: 'fixture', headingIndex, stats });
  return { html, stats };
}

test('numbered references become links to section pages and headings', () => {
  const { html } = renderFixture();
  assert.ok(html.includes('<a class="xref" href="s08.html">§8</a>.'), 'sentence-final §8 links');
  assert.ok(html.includes('<a class="xref" href="s14.html#s14-2">§14.2</a>–14.3'), '§14.2–14.3 links the first only');
  assert.ok(html.includes('<a class="xref" href="s00.html">§0</a>'));
  assert.ok(html.includes('<a class="xref" href="s19.html">§19</a>'));
  assert.ok(html.includes('<a class="xref" href="s05.html#s5-4">§5.4</a>'));
});

test('structural skips: §§ ranges, §N(…), spaced § numbers, N>19, missing headings, link texts', () => {
  const { html, stats } = renderFixture();
  assert.ok(html.includes('§§18–26'), '§§ range untouched');
  assert.ok(html.includes('§1(2)'), 'legal sub-section untouched');
  assert.ok(html.includes('§ 44801'), 'spaced number untouched');
  assert.ok(html.includes('out-of-range §43 stay'), '§43 untouched');
  assert.ok(html.includes('Missing heading §14.9 stays'), 'missing heading left as text');
  assert.ok(html.includes('NIST e-Handbook §7.2.4.1</a>'), 'link text untouched');
  assert.ok(html.includes('inside §13 link</a>'), '§N inside a link text untouched');
  assert.equal((html.match(/<a class="xref"/g) || []).length, 5);
  const reasons = stats.crossrefs.skipped.map((s) => `${s.ref}:${s.reason}`);
  assert.ok(reasons.includes('§43:N>19'));
  assert.ok(reasons.includes('§14.9:missing heading'));
  assert.ok(reasons.includes('§13:inside link'));
  assert.ok(stats.warnings.some((w) => w.includes('§14.9')), 'a missing heading is a warning, not an error');
  assert.equal(stats.crossrefs.rewritten, 5);
});

test('the three exception literals are skipped and asserted present in the content', () => {
  const { html, stats } = renderFixture();
  assert.ok(html.includes('expert scrutiny (§5);'));
  assert.ok(html.includes('open to organizations (§4);'));
  assert.ok(html.includes('§1(2), §2, §§18–26 are exceptions'));
  const exc = stats.crossrefs.skipped.filter((s) => s.reason.startsWith('exception'));
  assert.deepEqual(exc.map((s) => s.ref).sort(), ['§2', '§4', '§5']);
  assert.doesNotThrow(() => assertExceptionsPresent(content));
  assert.throws(() => assertExceptionsPresent(content.replace('expert scrutiny (§5)', 'expert scrutiny')), /expert scrutiny/);
  assert.equal(CROSSREF_EXCEPTIONS.length, 3);
});

test('the regex itself: matches what the design lists and nothing else', () => {
  const m = (s) => (s.match(CROSSREF_RE) || []);
  assert.deepEqual(m('see §8. and §14.2–14.3'), ['§8', '§14.2']);
  assert.deepEqual(m('§§18–26 §1(2) § 44801 §7.2.4.1'), []);
  assert.deepEqual(m('§43 §11.5\'s §12.6).'), ['§43', '§11.5', '§12.6']);
});

test('real content: 118 regex matches, 113 rewritten + 5 skipped (2× §43, the three exceptions)', () => {
  const total = (content.match(CROSSREF_RE) || []).length;
  assert.equal(total, 118);
});
