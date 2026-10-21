import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, createPlainMd } from '../src/build/md.js';
import { extractTables, escapedSplit, headersMatch } from '../src/build/tables.js';
import { splitSections, headingInventory } from '../src/build/parse.js';
import { buildManifest } from '../src/build/manifest.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = readFileSync(path.join(ROOT, 'tests', 'fixtures', 'md', 'tables.md'), 'utf8');
const arity = readFileSync(path.join(ROOT, 'tests', 'fixtures', 'md', 'tables-arity.md'), 'utf8');
const content = readFileSync(path.join(ROOT, 'content', 'roadmap.md'), 'utf8');
const plainMd = createPlainMd();

const html = render(fixture, { label: 'fixture', headings: headingInventory(fixture) });

test('every table is wrapped, carries data-cols and never a style attribute', () => {
  assert.equal((html.match(/<div class="table-wrap"><table/g) || []).length, 3);
  assert.equal((html.match(/<\/table>\n<\/div>/g) || []).length, 3);
  assert.ok(html.includes('<table data-cols="4" data-sticky-first="">'), 'narrow table: 4 columns, sticky first column (short labels)');
  assert.ok(html.includes('<table data-cols="6" class="wide">'), 'wide from 5 columns; long first cells → not sticky');
  assert.ok(html.includes('<table data-cols="2" data-sticky-first="">'));
  assert.equal((html.match(/ style=/g) || []).length, 0);
});

test('alignment comes from the delimiter row as classes; totals rows get class="total"', () => {
  assert.ok(html.includes('<th class="num">10 h plan B/E</th>'));
  assert.ok(html.includes('<td class="num">12/3</td>'));
  assert.ok(html.includes('<th class="center">Code</th>'));
  assert.equal((html.match(/<tr class="total">/g) || []).length, 2, 'Totals + "…subtotal / planning total"');
  assert.ok(html.includes('<tr class="total">\n<td><strong>Totals</strong></td>'));
});

test('DR-8: a pipe inside a code span fails the row-arity assertion loudly; the real content passes', () => {
  assert.throws(() => render(arity, { label: 'fixture arity' }), /Table row has 3 cells but the header has 2 \(fixture arity, line 3\): "\| source_type/);
  assert.throws(() => extractTables(arity, plainMd, 'fixture arity'), /3 cells but the header has 2/);
  assert.throws(() => render('| a | b |\n|---|---|\n| only one |\n', { label: 'short' }), /1 cells but the header has 2/);
  const { sections } = splitSections(content);
  let tables = 0;
  for (const s of sections) tables += extractTables(s.body, plainMd, s.slug).length;
  assert.equal(tables, 55);
  assert.deepEqual(escapedSplit('| a | `b|c` | d |'), [' a ', ' `b', 'c` ', ' d ']);
  assert.deepEqual(escapedSplit('| a \\| b | c |'), [' a | b ', ' c '], 'a backslash-escaped pipe stays inside its cell (markdown-it semantics)');
});

test('checkbox injection: first cell by default, columns 4/5 for the plan sets, none for §4 answers (Decision 21)', () => {
  const { sections } = splitSections(content);
  const { rowIndex } = buildManifest(sections, plainMd);
  const page = (slug) => {
    const s = sections.find((x) => x.slug === slug);
    return render(s.body, { label: slug, headings: s.headings, rows: rowIndex.get(slug) });
  };
  const s12 = page('s12');
  assert.ok(s12.includes('<tr id="t-s12-rungs-0">\n<td><label class="check"><input type="checkbox" data-track="s12:rungs:0" aria-label="Done: Rung 0"></label>0</td>'));
  assert.ok(s12.includes('<tr id="t-s12-rungs-0-2">\n<td><label class="check"><input type="checkbox" data-track="s12:rungs:0" aria-label="Done: Rung 0 Reproducibility diagnostic"></label><strong>0</strong> Reproducibility diagnostic</td>'), 'second table shares the id; its row gets a -2 anchor');
  assert.equal((s12.match(/data-track="s12:rungs:/g) || []).length, 18, 'two tables × 9 rungs');
  assert.ok(!s12.includes('data-track="s12:rungs:totals"'));
  const s15 = page('s15');
  const row1 = s15.slice(s15.indexOf('<tr id="t-s15-plan-10h-1">'), s15.indexOf('</tr>', s15.indexOf('<tr id="t-s15-plan-10h-1">')));
  const cells = row1.split('<td');
  assert.equal(cells.length - 1, 5);
  assert.ok(!cells[1].includes('data-track'), 'month cell carries no checkbox');
  assert.ok(cells[4].includes('data-track="s15:plan-10h:1"'), '10 h checkbox in column 4');
  assert.ok(cells[5].includes('data-track="s15:plan-20h:1"'), '20 h checkbox in column 5');
  assert.ok(cells[4].includes('aria-label="Done: Month 1 (W1–4; 40/80) · 10 h plan"'));
  assert.ok(s15.includes('<tr id="t-s15-gates-q1">\n<td><label class="check"><input type="checkbox" data-track="s15:gates:q1"'), 'gate checkbox in the first cell only');
  assert.ok(!s15.includes('data-track="s15:gates:q1:1"'), 'clauses are My-plan-only');
  const s04 = page('s04');
  assert.ok(s04.includes('<tr id="t-s04-questions-7">\n<td>7</td>'), 'question rows get anchors…');
  assert.ok(!s04.includes('data-track'), '…but no checkbox');
  const s09 = page('s09');
  assert.ok(s09.includes('<tr id="t-s09-books-feedback-systems">\n<td><label class="check"><input type="checkbox" data-track="s09:books:feedback-systems" aria-label="Done: Feedback Systems"></label>1 Core</td>'));
});

test('extractTables: headers, alignment, raw and plain cells; headersMatch is a prefix test', () => {
  const tables = extractTables(fixture, plainMd, 'fixture');
  assert.equal(tables.length, 3);
  assert.deepEqual(tables[0].headers, ['Rung', '10 h plan B/E', '20 h plan B/E', 'Scope rule']);
  assert.deepEqual(tables[0].aligns, ['', 'right', 'right', '']);
  assert.equal(tables[0].rows.length, 3);
  assert.equal(tables[0].rows[2].cells[0].raw, '**Totals**');
  assert.equal(tables[0].rows[2].cells[0].text, 'Totals');
  assert.equal(tables[1].rows[2].cells[2].text, 'Landed cost not established');
  assert.ok(headersMatch(tables[0], ['Rung']));
  assert.ok(!headersMatch(tables[0], ['Rung', 'Objective']));
});
