import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite } from '../src/build/write.js';
import { feedPage, FEED_CLASS_FILTERS, FEED_QUERY_FILTERS, FEED_TRIAGE_FILTERS, HEALTH_HEADERS } from '../src/build/templates.js';
import { buildFeedData, protocolTable } from '../src/build/feed-data.js';
import { splitSections } from '../src/build/parse.js';
import { createPlainMd, renderInline } from '../src/build/md.js';
import { healthSummary, HEALTH_GLYPHS } from '../assets/lib/filter.js';
import { sources, QUERIES } from '../sources.config.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const markdown = readFileSync(path.join(ROOT, 'content', 'roadmap.md'), 'utf8');
const site = buildSite(markdown);
const d = site.feedData;
const page = site.pages.get('feed.html');
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/\s+/g, ' ').trim();
const cellTexts = (tableHtml) => [...tableHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => text(m[1]));

test('DR-5 / OF-6: the protocol card is the three §17.1 Normal-week rows with the source cells only, plus the month-end line', () => {
  const { sections } = splitSections(markdown);
  const table = protocolTable(sections, createPlainMd());
  assert.deepEqual(table.headers, ['Session', 'Minutes', 'Action', 'Hard output']);
  assert.equal(table.rows.length, 12);
  assert.deepEqual(d.protocol.rows, [
    ['Normal week', '0–5', 'Clear regulator/citation alerts and duplicates', 'Inbox zero/deferred'],
    ['', '5–20', 'Scan ≤10 filtered titles/abstracts from one query', '≤2 candidates'],
    ['', '20–30', 'Keep/drop, update one queue row, schedule one action', 'Queue ≤12 rows'],
  ]);
  const cells = new Set(d.protocol.cells);
  for (const row of d.protocol.rows) for (const c of row) assert.ok(cells.has(c), `"${c}" is a §17.1 cell`);
  assert.ok(!cells.has('1') && !cells.has('2') && !cells.has('3'), 'no row numbers exist in the source table');
  const card = /<table class="protocol" data-cols="4">([\s\S]*?)<\/table>/.exec(page)[1];
  const bodyRows = [...card.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].slice(1);
  assert.equal(bodyRows.length, 3);
  for (const td of cellTexts(card)) assert.ok(cells.has(td), `rendered td "${td}" is a §17.1 cell string`);
  assert.deepEqual(cellTexts(card), d.protocol.rows.flat());
  assert.ok(card.includes('<th class="num">Minutes</th>') && card.includes('<td class="num">0–5</td>'), 'the right-aligned Minutes column keeps its alignment');
  assert.ok(page.includes('<p class="small">Month-end 90 min · Quarter-end 120 min — see <a href="s17.html#s17-1">§17.1</a>.</p>'));
  assert.equal((page.match(/href="s17\.html#s17-1"/g) || []).length, 2, 'the card heading and the month-end line both link §17.1');
});

test('the §17.6 limits sentence, the §13.6 notices and the §17.5 labs come from the report verbatim', () => {
  assert.ok(d.limits.markdown.startsWith('Limits: 15 abstracts scanned a week; 3 saved, 1 deep-read, 1 experiment candidate a week; 12 active queue rows (≤6 deep-read, ≤2 experiment); unread items expire after 30 days;'));
  assert.ok(markdown.includes(d.limits.markdown), 'verbatim');
  assert.ok(page.includes(`<p class="small muted limits">${d.limits.html} (<a href="s17.html#s17-6">§17.6</a>)</p>`));
  assert.ok(d.limits.html.includes('<code>scanned → kept → deep-read → cited/experimented</code>'));
  assert.deepEqual(d.notices.map((n) => n.id), ['reg-dgca', 'reg-moca', 'reg-egazette', 'reg-digitalsky', 'reg-aai-aim']);
  for (const n of d.notices) {
    const s = sources.find((x) => x.id === n.id);
    assert.equal(n.url, s.url);
    assert.equal(n.name, s.name);
    assert.ok(page.includes(`<li data-notice="${n.id}"><span><a href="${n.url}" rel="noopener external">${n.name}</a>`));
    assert.ok(markdown.includes(n.url), `${n.url} is in the report`);
  }
  assert.equal(text(d.notices[0].extraHtml), '"What\'s New" and RPAS/UAS material');
  assert.equal(d.notices[1].extraHtml, 'searched for <code>drone</code>, <code>unmanned aircraft</code>, <code>remote pilot</code>, <code>Digital Sky</code>, <code>type certificate</code>');
  assert.equal(d.notices[2].extraHtml, '');
  assert.equal(d.noticeSentence, 'Record the exact document, number, and date, not the home page.');
  assert.deepEqual(d.labs, [
    { name: 'UZH RPG', url: 'https://rpg.ifi.uzh.ch/' },
    { name: 'ETH ASL', url: 'https://asl.ethz.ch/' },
    { name: 'IIIT Hyderabad RRC', url: 'https://robotics.iiit.ac.in/' },
    { name: 'Stanford ASL', url: 'https://stanfordasl.github.io/' },
  ]);
  for (const l of d.labs) assert.ok(page.includes(`<a href="${l.url}" rel="noopener external">${l.name}</a><span class="dom">${new URL(l.url).hostname}</span>`));
  assert.ok(page.includes('<p class="small muted manual-checks">Manual checks: <a href="s17.html#s17-3">Scholar and Semantic Scholar alerts (§17.3)</a> · <a href="s17.html#s17-4">venue watchlist (§17.4)</a> · <a href="s17.html#s17-5">benchmark watches (§17.5)</a> · <a href="s13.html#s13-6">regulator comparators (§13.6)</a>.</p>'));
});

test('header, health disclosure, rule card, filters and list: the agreed strings (D9, DR-9, D6)', () => {
  assert.ok(page.includes('<h1 id="top">Feed</h1>'));
  assert.ok(page.includes('<p class="muted small feed-updated">Last updated <span data-last-updated></span> · 30-day window · GitHub may delay or skip scheduled runs.</p>'));
  assert.ok(page.includes('<details class="health" id="feed-health">'));
  assert.ok(page.includes('<summary><span data-health-summary>Source health</span><span class="muted"> · details</span></summary>'));
  assert.ok(page.includes(HEALTH_HEADERS.map((h) => (h === 'Fetched' ? `<th class="num">${h}</th>` : `<th>${h}</th>`)).join('')));
  assert.deepEqual(HEALTH_HEADERS, ['Source', 'Class', 'Status', 'Fetched', 'Newest item', 'Note or error']);
  assert.equal(healthSummary({ ok: 17, empty: 6, failed: 1, total: 24 }), '■ ok 17 · □ empty 6 · ✕ failed 1 · 24 sources');
  assert.deepEqual(HEALTH_GLYPHS, { ok: '■', empty: '□', failed: '✕' });
  assert.ok(page.includes('<div class="rule"><p><strong>Keep only if it changes an experiment or a claim.</strong> Triage is stored in this browser; the full keep/drop rule is in <a href="s17.html#s17-6">§17.6</a>.</p></div>'));
  assert.deepEqual(FEED_CLASS_FILTERS.map((f) => f[1]), ['All', 'arXiv', 'Proceedings', 'Labs', 'Releases', 'Regulators']);
  assert.deepEqual(FEED_QUERY_FILTERS.map((f) => f[1]), [...Object.keys(QUERIES), 'Category listings']);
  assert.deepEqual(FEED_TRIAGE_FILTERS.map((f) => f[1]), ['Everything', 'Kept', 'Read later', 'Dropped']);
  const buttons = [...page.matchAll(/<button class="btn" type="button" data-filter="(\w+)" data-value="([^"]+)" aria-pressed="(true|false)">/g)].map((m) => [m[1], m[2], m[3]]);
  assert.equal(buttons.length, 6 + 5 + 4);
  assert.equal((page.match(/<div class="filters" role="group" aria-label="Filter by [^"]+" data-filter-group="(class|query|triage)">\n<span class="group-label">[^<]+<\/span>\n<div class="filter-btns">/g) || []).length, 3);
  assert.deepEqual(buttons.filter((b) => b[2] === 'true').map((b) => b[1]), ['all', 'all'], 'class All and triage Everything start pressed; no query is pressed');
  assert.ok(page.includes('Kept <span class="n" data-count="keep">0</span></button>'));
  assert.ok(page.includes('Dropped <span class="n" data-count="drop">0</span></button>'));
  assert.ok(page.includes('<ol class="feed-list" data-feed-list aria-live="polite"></ol>'));
  assert.ok(page.includes('<div class="two-col feed-grid">'));
  assert.equal((page.match(/ style=/g) || []).length, 0);
  assert.equal((page.match(/Evidence cutoff/g) || []).length, 1, 'footer only');
  assert.equal((page.match(/Physical AI Roadmap/g) || []).length, 2, 'title tag and wordmark only');
  assert.ok(!/verified/i.test(/<title>([^<]*)<\/title>/.exec(page)[1]));
  const body = text(page.slice(page.indexOf('<main')));
  for (const banned of ['hand-coded', 'zero build step', 'view source', 'AI-powered', 'Everything else is a drop']) assert.ok(!body.includes(banned), banned);
});

test('the build fails loudly when the §17.1 table changes shape (DR-5 assertion)', () => {
  const plainMd = createPlainMd();
  const ri = (s) => renderInline(s, {});
  const good = splitSections(markdown);
  assert.ok(buildFeedData(good.sections, plainMd, ri).protocol.rows.length === 3);
  const renamed = markdown.replace('| Normal week | 0–5 |', '| Typical week | 0–5 |');
  assert.throws(() => buildFeedData(splitSections(renamed).sections, plainMd, ri), /first row must be "Normal week"/);
  const fourRows = markdown.replace('| Month-end replacement | 0–15 |', '| | 0–15 |');
  assert.throws(() => buildFeedData(splitSections(fourRows).sections, plainMd, ri), /expected three Normal-week rows, found 8/, 'the unlabelled rows run into the month-end block');
  const noLimits = markdown.replace('\nLimits: 15 abstracts', '\nCaps: 15 abstracts');
  assert.throws(() => buildFeedData(splitSections(noLimits).sections, plainMd, ri), /§17\.6: no paragraph starting with "Limits: "/);
  const movedUrl = markdown.replace('[eGazette](https://egazette.gov.in/)', '[eGazette](https://egazette.nic.in/)');
  assert.throws(() => buildFeedData(splitSections(movedUrl).sections, plainMd, ri), /reg-egazette URL .* differs from the report/);
  assert.throws(() => feedPage({ feedData: { ...d, protocol: { ...d.protocol, rows: [...d.protocol.rows, ['', '', '', '']] } } }), /protocol card must have exactly 3 rows/);
  assert.throws(() => feedPage({ feedData: { ...d, protocol: { ...d.protocol, rows: [['1', '0–5', 'Clear regulator/citation alerts and duplicates', 'Inbox zero/deferred'], d.protocol.rows[1], d.protocol.rows[2]] } } }), /"1" is not a §17\.1 cell/);
});
