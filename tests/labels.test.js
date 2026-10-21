import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, newStats, createPlainMd } from '../src/build/md.js';
import { LABEL_RE, countLabels, chipKind, legendFromTables, LEGEND_ORDER } from '../src/build/labels.js';
import { extractTables } from '../src/build/tables.js';
import { splitSections } from '../src/build/parse.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = readFileSync(path.join(ROOT, 'tests', 'fixtures', 'md', 'labels.md'), 'utf8');
const content = readFileSync(path.join(ROOT, 'content', 'roadmap.md'), 'utf8');

const plainMd = createPlainMd();
const legend = legendFromTables(extractTables(fixture, plainMd, 'fixture'));

test('legend extraction asserts the five rows of a Label · Meaning table', () => {
  assert.deepEqual(Object.keys(legend).sort(), ['fact', 'hype', 'judgment', 'stale', 'uncertain']);
  assert.equal(legend.fact.meaning, 'Directly checkable.');
  assert.deepEqual(LEGEND_ORDER, ['fact', 'judgment', 'uncertain', 'hype', 'stale']);
  const broken = fixture.replace('| **[HYPE/DEMO]** | Promotional. |\n', '');
  assert.throws(() => legendFromTables(extractTables(broken, plainMd, 'broken')), /4 rows/);
});

test('every label variant becomes a chip with the right kind and the §0 meaning as title', () => {
  const stats = newStats();
  const html = render(fixture, { label: 'fixture', legend, stats });
  assert.ok(html.includes('<span class="chip chip-fact" title="Directly checkable.">FACT</span>'));
  assert.ok(html.includes('<span class="chip chip-judgment" title="A recommendation.">JUDGMENT, high confidence</span>'));
  assert.ok(html.includes('<span class="chip chip-mixed" title="Directly checkable.">FACT + JUDGMENT</span>'));
  assert.ok(html.includes('<span class="chip chip-uncertain" title="Partial evidence.">UNCERTAIN: vendor-stated foreign price</span>'));
  assert.ok(html.includes('<span class="chip chip-mixed" title="Directly checkable.">FACT: vendor-stated specification; UNCERTAIN price</span>'));
  assert.ok(html.includes('<strong><span class="chip chip-hype" title="Promotional.">HYPE/DEMO</span>-adjacent preprint</strong>'));
  assert.ok(html.includes('<strong><span class="chip chip-stale" title="Aged examples.">STALE-BUT-FOUNDATIONAL</span></strong>'));
  assert.ok(html.includes('<strong><span class="chip chip-judgment" title="A recommendation.">JUDGMENT</span> Use one baseline, then freeze:</strong>'), 'only the bracket is replaced inside a longer bold run');
  assert.ok(html.includes('chip-mixed" title="Directly checkable.">FACT for final records; UNCERTAIN for author-reported abstract numbers</span>'));
  assert.ok(html.includes('>Drone Rules, 2021 text</a>'), 'link texts are never labels');
  assert.ok(html.includes('>FACT</a>'), '[FACT](url) is a link, not a chip');
  assert.ok(html.includes('[NOTE]') && html.includes('[fact]'), 'unknown or lower-case brackets stay text');
  assert.equal((html.match(/class="chip/g) || []).length, 14);
  assert.equal(stats.chips, 14);
  assert.equal(countLabels(fixture), 14);
});

test('chipKind: first keyword decides; a second keyword or " + " makes it mixed', () => {
  assert.equal(chipKind('FACT', ''), 'fact');
  assert.equal(chipKind('JUDGMENT', ', high confidence'), 'judgment');
  assert.equal(chipKind('FACT', ' + JUDGMENT'), 'mixed');
  assert.equal(chipKind('UNCERTAIN', ': vendor-stated foreign price; FACT about vendor documentation'), 'mixed');
  assert.equal(chipKind('HYPE/DEMO', ''), 'hype');
  assert.equal(chipKind('STALE-BUT-FOUNDATIONAL', ''), 'stale');
});

test('real content: the rendered chip count equals the regex count equals 127', () => {
  const { sections } = splitSections(content);
  const realLegend = legendFromTables(extractTables(sections[0].body, plainMd, 'section 0'));
  assert.equal(realLegend.stale.label, 'STALE-BUT-FOUNDATIONAL');
  const stats = newStats();
  for (const s of sections) render(s.body, { label: s.slug, legend: realLegend, headings: s.headings, stats });
  assert.equal(countLabels(content), 127);
  assert.equal(stats.chips, 127);
  assert.equal((content.match(LABEL_RE) || []).filter((l) => l.includes('vendor-stated foreign price]')).length, 3);
});
