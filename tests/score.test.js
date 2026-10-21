import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokenise, termsOf, prepareIndex, scoreRecord, search, pageOrder, snippetAround, highlight, PER_GROUP, TOTAL } from '../assets/lib/score.js';
import { splitSections } from '../src/build/parse.js';
import { buildSite } from '../src/build/write.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('tokenise: lowercase, ASCII-fold, split on non-alphanumerics, drop one-character tokens', () => {
  assert.deepEqual(tokenise('Quadrotor LQR; π₀ & "sim-to-real" Ñandú 2026 a b'), ['quadrotor', 'lqr', 'sim', 'to', 'real', 'nandu', '2026']);
  assert.deepEqual(tokenise(''), []);
  assert.deepEqual(termsOf('Drone drone DRONE landing'), ['drone', 'landing']);
});

test('scoring: every term must match; heading hits weigh 3; earlier text hits score higher', () => {
  const [a, b, c, d] = prepareIndex([
    { p: 's12.html', s: '12', h: 'Quadrotor control', a: 's12-1', x: 'Some text about landing gates.' },
    { p: 's12.html', s: '12', h: 'Other heading', a: 's12-2', x: 'The quadrotor landing test comes first.' },
    { p: 's12.html', s: '12', h: 'Other heading', a: 's12-3', x: 'Many words before the subject appears: the quadrotor landing test.' },
    { p: 's13.html', s: '13', h: 'Rules', a: 's13-1', x: 'Nothing relevant here.' },
  ]);
  const terms = termsOf('quadrotor landing');
  assert.ok(scoreRecord(a, terms) > scoreRecord(b, terms), 'a heading hit outranks a text hit');
  assert.ok(scoreRecord(b, terms) > scoreRecord(c, terms), 'an earlier text hit outranks a later one');
  assert.equal(scoreRecord(d, terms), 0, 'a record missing a term scores 0');
  assert.equal(scoreRecord(d, termsOf('nothing')), 1 + 1 / (1 + 0 / 8), 'one exact text hit at position 0: 1 + the position bonus');
  assert.equal(scoreRecord(a, termsOf('quadrotor')), 3 * 2, 'one exact heading hit, no text hit');
  assert.ok(scoreRecord(a, termsOf('quad')) > 0, 'prefix matches count');
  assert.equal(scoreRecord(a, termsOf('rotor')), 0, 'but not infixes');
});

test('search: groups in report order, 8 per group, 60 overall, titles from the page title records', () => {
  const records = [];
  for (const s of ['12', 'A', '3', '0']) {
    const p = /^\d+$/.test(s) ? `s${s.padStart(2, '0')}.html` : `appendix-${s.toLowerCase()}.html`;
    records.push({ p, s, h: `Title ${s}`, a: 'top', x: `Title ${s}` });
    for (let i = 0; i < 20; i++) records.push({ p, s, h: `Heading ${s}.${i}`, a: `h-${i}`, x: `Common term number ${i} in section ${s}.` });
  }
  const index = prepareIndex(records);
  const r = search(index, 'common');
  assert.deepEqual(r.groups.map((g) => g.s), ['0', '3', '12', 'A']);
  assert.deepEqual(r.groups.map((g) => g.title), ['Title 0', 'Title 3', 'Title 12', 'Title A']);
  assert.ok(r.groups.every((g) => g.hits.length <= PER_GROUP));
  assert.equal(r.shown, r.groups.reduce((n, g) => n + g.hits.length, 0));
  assert.equal(r.matched, 80);
  assert.equal(r.shown, 32, '4 groups × 8');
  const wide = search(prepareIndex(Array.from({ length: 30 }, (_, s) => ({ p: `p${s}.html`, s: String(s), h: 'h', a: 'top', x: 'shared term' }))), 'shared');
  assert.equal(wide.shown, 30, 'one hit per page, all within the cap');
  assert.deepEqual(wide.groups.map((g) => g.s), Array.from({ length: 30 }, (_, s) => String(s)), 'report order, not score order');
  const capped = search(prepareIndex(Array.from({ length: 30 }, (_, s) => Array.from({ length: 5 }, (_, i) => ({ p: `p${s}.html`, s: String(s), h: `h${i}`, a: `a${i}`, x: 'shared term' }))).flat()), 'shared');
  assert.equal(capped.shown, TOTAL, 'global cap');
  assert.deepEqual(search(index, '').groups, []);
  assert.deepEqual(search(index, 'x').groups, [], 'one-character queries have no terms');
  assert.ok(pageOrder('19') < pageOrder('A') && pageOrder('A') < pageOrder('D') && pageOrder('2') < pageOrder('10'));
});

test('snippet windows around the first hit; highlight marks whole words that start with a term', () => {
  const long = `${'Filler words here. '.repeat(20)}The quadrotor landing test is here. ${'More filler text. '.repeat(20)}`;
  const snip = snippetAround(long, ['quadrotor'], 120);
  assert.ok(snip.startsWith('…') && snip.endsWith('…'));
  assert.ok(snip.includes('quadrotor landing'));
  assert.ok(snip.length <= 124);
  assert.equal(snippetAround('short text', ['short']), 'short text');
  assert.deepEqual(highlight('Quadrotors land; a quadrotor flies.', ['quadrotor']), [
    { text: 'Quadrotors', mark: true }, { text: ' land; a ', mark: false }, { text: 'quadrotor', mark: true }, { text: ' flies.', mark: false },
  ]);
  assert.deepEqual(highlight('no hit', ['zzz']), [{ text: 'no hit', mark: false }]);
});

test('the real index answers "quadrotor" with grouped hits whose pages contain the term', () => {
  const content = readFileSync(path.join(ROOT, 'content', 'roadmap.md'), 'utf8');
  const bodies = new Map(splitSections(content).sections.map((s) => [s.file, s.body.toLowerCase()]));
  const index = prepareIndex(JSON.parse(buildSite(content).files['search-index.json']));
  const r = search(index, 'quadrotor');
  assert.ok(r.groups.length >= 1);
  assert.ok(r.shown <= TOTAL);
  for (const g of r.groups) {
    assert.ok(bodies.get(g.page).includes('quadrotor'), `${g.page} mentions quadrotor`);
    assert.ok(g.hits.length <= PER_GROUP);
  }
  const first = r.groups[0].hits[0];
  assert.ok(/quadrotor/i.test(`${first.h} ${first.x}`));
});
