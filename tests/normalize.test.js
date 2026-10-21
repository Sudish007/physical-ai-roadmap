import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { canonicalUrl, itemId, truncateSummary, plainSummary, summarize, stripHtml, cleanTitle, toIso, inWindow, passesIncludeRule, normalizeSource, WINDOW_DAYS, SUMMARY_MAX } from '../src/feed/normalize.js';
import { parseAtomRss } from '../src/feed/parsers/atomrss.js';
import { parseArxiv } from '../src/feed/parsers/arxiv.js';
import { sources, QUERIES, INCLUDE_RULES, INCLUDE_UNION, NIST_FILTER } from '../sources.config.mjs';
import { read, sourceById, NOW, ROOT } from './helpers.js';

test('the registry carries the §17.3 queries and include rules verbatim from content/roadmap.md', () => {
  const md = readFileSync(path.join(ROOT, 'content', 'roadmap.md'), 'utf8');
  for (const [label, q] of Object.entries(QUERIES)) assert.ok(md.includes(q), `query "${label}" is in §17.3`);
  for (const rule of Object.values(INCLUDE_RULES)) assert.ok(md.includes(rule.source), `include rule ${rule.source.slice(0, 30)}… is in §17.3`);
  assert.ok(md.includes('`robot|autonomous system|AI risk|assurance|test and evaluation|safety`'));
  assert.equal(NIST_FILTER.source, 'robot|autonomous system|AI risk|assurance|test and evaluation|safety');
  const ids = sources.map((s) => s.id);
  assert.deepEqual(ids, ['arxiv-cs.RO', 'arxiv-eess.SY', 'arxiv-q-thesis-narrow', 'arxiv-q-aerial-autonomy', 'arxiv-q-safe-autonomy', 'arxiv-q-robot-learning-eval', 'rss-proceedings', 'pmlr-corl', 'lab-cmu-ri', 'lab-bair', 'lab-grasp', 'rel-ros2', 'rel-px4', 'rel-mujoco', 'rel-gz-sim', 'rel-nav2', 'rel-qgc', 'rel-mavsdk', 'reg-nist', 'reg-dgca', 'reg-moca', 'reg-egazette', 'reg-digitalsky', 'reg-aai-aim']);
  assert.equal(sourceById('lab-cmu-ri').filter, INCLUDE_UNION);
  assert.equal(sourceById('reg-nist').filter, NIST_FILTER);
  assert.ok(sources.filter((s) => s.includeRule).map((s) => s.id).join() === 'arxiv-cs.RO,arxiv-eess.SY', 'the include rule applies to the two listings only');
  assert.equal(sourceById('rss-proceedings').volumeDate, '2026-07-13');
  for (const s of sources) if (s.note) assert.ok(s.note.length <= 120, s.id);
});

test('canonical URL: lowercase host, tracking params and fragments gone, trailing slash except root, arXiv versions stripped', () => {
  assert.equal(canonicalUrl('HTTPS://WWW.Example.org/A/B/?utm_source=x&utm_medium=y&ref=rss&fbclid=1#frag'), 'https://www.example.org/A/B');
  assert.equal(canonicalUrl('https://example.org/'), 'https://example.org/');
  assert.equal(canonicalUrl('https://example.org'), 'https://example.org/');
  assert.equal(canonicalUrl('https://example.org/p?b=2&utm_x=1&a=1'), 'https://example.org/p?b=2&a=1');
  assert.equal(canonicalUrl('http://arxiv.org/abs/2610.28632v1'), 'https://arxiv.org/abs/2610.28632');
  assert.equal(canonicalUrl('https://arxiv.org/pdf/2610.28632v2.pdf'), 'https://arxiv.org/abs/2610.28632');
  assert.equal(canonicalUrl('https://www.grasp.upenn.edu/news/some-post/'), 'https://www.grasp.upenn.edu/news/some-post');
  assert.equal(canonicalUrl('ftp://example.org/x'), null);
  assert.equal(canonicalUrl('not a url'), null);
  assert.equal(canonicalUrl(''), null);
  assert.equal(itemId({ arxivId: '2610.28632', url: 'https://arxiv.org/abs/2610.28632' }), 'arxiv:2610.28632');
  assert.equal(itemId({ url: 'https://arxiv.org/abs/2610.28632' }), 'arxiv:2610.28632', 'an arXiv URL without an explicit id still gets arxiv:');
  const u = itemId({ url: 'https://github.com/ros2/ros2/releases/tag/x' });
  assert.match(u, /^url:[0-9a-f]{16}$/);
  assert.equal(itemId({ url: 'https://github.com/ros2/ros2/releases/tag/x' }), u, 'stable');
});

test('summaries: HTML stripped, trailers removed, ≤300 chars at a word boundary with …, never ...', () => {
  assert.equal(stripHtml('<p>One &amp; two</p><p>Three<br>four</p><script>x()</script>').trim(), 'One & two\nThree\nfour');
  assert.equal(cleanTitle('  Intelligence is Free, Now What? <br> Data Systems  '), 'Intelligence is Free, Now What? Data Systems');
  assert.equal(plainSummary('<p>Prepare release</p><p>Signed-off-by: A B a@b.c</p><p>Co-authored-by: C D</p>'), 'Prepare release');
  assert.equal(plainSummary('<p>Signed-off-by: only</p>'), '');
  assert.equal(plainSummary('Original Article [&#8230;]'), 'Original Article […]');
  assert.equal(plainSummary('ends with dots...'), 'ends with dots…');
  const long = Array.from({ length: 80 }, (_, i) => `word${i}`).join(' ');
  const t = truncateSummary(long);
  assert.ok(t.length <= SUMMARY_MAX);
  assert.ok(t.endsWith('…'));
  assert.ok(!t.endsWith('...'));
  assert.ok(!/word\d*…$/.test(t) || long.includes(t.slice(0, -1)), 'cut at a word boundary');
  assert.ok(long.startsWith(t.slice(0, -1)), 'prefix of the text');
  assert.equal(truncateSummary('short'), 'short');
  assert.equal(truncateSummary(`${'a'.repeat(299)} b`), `${'a'.repeat(299)}…`.length <= 300 ? `${'a'.repeat(299)}…` : 'x');
  const nospace = 'x'.repeat(400);
  assert.equal(truncateSummary(nospace).length, 300);
  assert.equal(summarize('<b>Hi</b> there, <i>world</i>'), 'Hi there, world');
  const gz = parseAtomRss(read('gh-releases-gz-sim.xml')).items[0];
  assert.equal(summarize(gz.summary), '');
  const mujoco = parseAtomRss(read('gh-releases-mujoco.xml')).items[0];
  const s = summarize(mujoco.summary);
  assert.ok(s.length <= 300 && s.endsWith('…'));
  assert.ok(s.startsWith('Version 3.16.0 (October 14, 2026)'));
});

test('dates and the 30-day window', () => {
  assert.equal(toIso('Thu, 15 Oct 2026 17:38:49 +0000'), '2026-10-15T17:38:49Z');
  assert.equal(toIso('Wed, 29 Jul 2026 02:00:00 -0700'), '2026-07-29T09:00:00Z');
  assert.equal(toIso('2026-10-20T17:59:56Z'), '2026-10-20T17:59:56Z');
  assert.equal(toIso('2026-07-13T00:00:00Z'), '2026-07-13T00:00:00Z');
  assert.equal(toIso('not a date'), null);
  assert.equal(toIso(''), null);
  assert.equal(toIso(null), null);
  assert.equal(WINDOW_DAYS, 30);
  assert.equal(inWindow('2026-09-22T00:00:00Z', NOW), true, 'exactly 30 days ago is inside');
  assert.equal(inWindow('2026-09-21T23:59:59Z', NOW), false);
  assert.equal(inWindow('2026-10-25T00:00:00Z', NOW), true, 'the window has no upper bound');
  assert.equal(inWindow('garbage', NOW), false);
});

test('§17.3 include rule: (embodiment OR learning) AND method, case-insensitive; NIST and CMU filters', () => {
  assert.equal(passesIncludeRule('Quadrotor landing under uncertainty'), true);
  assert.equal(passesIncludeRule('A Vision-Language-Action model with recovery behaviours'), true);
  assert.equal(passesIncludeRule('UAV networking throughput'), false, 'embodiment without a method term');
  assert.equal(passesIncludeRule('Uncertainty calibration for language models'), false, 'method without embodiment');
  assert.equal(passesIncludeRule('SIM-TO-REAL transfer with RUNTIME ASSURANCE'), true);
  assert.equal(passesIncludeRule('drones'), false, 'word boundary: "drones" is not "drone"');
  assert.equal(NIST_FILTER.test('NIST Provides Updates on National Construction Safety Team Activities'), true);
  assert.equal(NIST_FILTER.test('New Chip-Based Tape Measure for Light'), false);
  assert.equal(INCLUDE_UNION.test('Dexterous Robots Move From Labs to Industry'), true);
  assert.equal(INCLUDE_UNION.test('Bajcsy Awarded Packard Fellowship for Science and Engineering'), false);
});

test('normalizeSource: listings filtered, queries not, skipped counted, window, filters, caps, matchedQuery, newest before the window', () => {
  const ro = parseArxiv(read('arxiv-api-cs.RO.xml')).items;
  const listing = normalizeSource(ro, sourceById('arxiv-cs.RO'), NOW);
  assert.equal(listing.fetched, 10);
  assert.equal(listing.items.length, 3, 'three of the ten pass the include rule');
  assert.deepEqual(listing.items.map((i) => i.id), ['arxiv:2610.28109', 'arxiv:2610.27861', 'arxiv:2610.27414']);
  assert.deepEqual(listing.items.map((i) => i.title.slice(0, 20)), ['FIT-MAC: A Closed-Lo', 'RoboCasa-Shift: Stag', 'Real-Time Disturbanc']);
  assert.equal(listing.items[0].matchedQuery, 'cs.RO listing');
  assert.equal(listing.items[0].source, 'arXiv cs.RO listing');
  assert.equal(listing.items[0].sourceClass, 'arxiv');
  assert.equal(listing.newestAt, '2026-10-20T17:59:56Z');
  const asQuery = normalizeSource(ro, { ...sourceById('arxiv-q-aerial-autonomy'), maxItems: 4 }, NOW);
  assert.equal(asQuery.items.length, 4, 'no include rule on a query; capped at maxItems');
  assert.equal(asQuery.items[0].matchedQuery, 'Aerial autonomy');
  const thesis = normalizeSource(parseArxiv(read('arxiv-q-thesis-narrow.xml')).items, sourceById('arxiv-q-thesis-narrow'), NOW);
  assert.equal(thesis.items.length, 0);
  assert.equal(thesis.newestAt, '2026-07-21T09:48:50Z', 'newest is reported even when nothing is in the window');
  const cmu = normalizeSource(parseAtomRss(read('cmu-ri.xml')).items, sourceById('lab-cmu-ri'), NOW);
  assert.equal(cmu.items.length, 0);
  assert.equal(cmu.fetched, 5);
  const cmuUnfiltered = normalizeSource(parseAtomRss(read('cmu-ri.xml')).items, { ...sourceById('lab-cmu-ri'), filter: undefined }, NOW);
  assert.equal(cmuUnfiltered.items.length, 5);
  assert.equal(cmuUnfiltered.items[0].url, 'https://www.ri.cmu.edu/bajcsy-awarded-packard-fellowship-for-science-and-engineering');
  assert.equal(cmuUnfiltered.items[0].matchedQuery, null);
  const nist = normalizeSource(parseAtomRss(read('nist-news.xml')).items, sourceById('reg-nist'), NOW);
  assert.equal(nist.items.length, 1);
  assert.match(nist.items[0].title, /Safety/);
  const bad = normalizeSource([
    { title: 'ok', url: 'https://e.org/a', date: '2026-10-20T00:00:00Z', summary: 'x' },
    { title: '', url: 'https://e.org/b', date: '2026-10-20T00:00:00Z' },
    { title: 'no url', url: '', date: '2026-10-20T00:00:00Z' },
    { title: 'bad date', url: 'https://e.org/c', date: 'yesterday' },
    { title: 'old', url: 'https://e.org/d', date: '2026-01-01T00:00:00Z' },
  ], { id: 'x', name: 'X', class: 'lab', maxItems: 60 }, NOW);
  assert.equal(bad.items.length, 1);
  assert.equal(bad.skipped, 3, 'empty title, missing url and invalid date are skipped; the old one is merely outside the window');
  assert.equal(bad.fetched, 5);
  assert.equal(bad.newestAt, '2026-10-20T00:00:00Z');
});
