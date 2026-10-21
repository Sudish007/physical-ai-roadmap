import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, findFreePort, crawl, allPages, formatReport, sampleExternal, classifyStatus, probeUrl, metaRows, formatMetaTable, buildSummary, resolveShotsPrefix, relToRepo, DEFAULT_PAGES, DEFAULT_WIDTHS, DEFAULT_THEMES, PORT_RANGE, STATUS_CLASSES, REPO } from '../scripts/verify.mjs';

test('flag parsing: defaults, lists, --all, --no-browser, --shots, --live, errors', () => {
  const d = parseArgs([]);
  assert.deepEqual(d.pages, ['index', 's03', 's12', 's15', 'appendix-a', 'plan', 'feed']);
  assert.deepEqual(d.pages, DEFAULT_PAGES);
  assert.deepEqual(d.widths, [320, 360, 390, 820, 1024, 1440, 1920, 2560]);
  assert.deepEqual(d.widths, DEFAULT_WIDTHS);
  assert.deepEqual(d.themes, ['light', 'dark']);
  assert.deepEqual(d.themes, DEFAULT_THEMES);
  assert.equal(d.all, false);
  assert.equal(d.browser, true);
  assert.equal(d.report, path.join('docs', 'verify-report.json'));
  assert.equal(d.shots, '');
  assert.equal(d.live, '');
  const o = parseArgs(['--pages', 'index, s12', '--all', '--widths', '390,1440', '--themes', 'dark', '--report', 'out.json', '--no-browser', '--shots', 'C:\\tmp\\shots\\', '--live', 'https://example.test/x/']);
  assert.deepEqual(o.pages, ['index', 's12']);
  assert.equal(o.all, true);
  assert.deepEqual(o.widths, [390, 1440]);
  assert.deepEqual(o.themes, ['dark']);
  assert.equal(o.report, 'out.json');
  assert.equal(o.browser, false);
  assert.equal(o.shots, 'C:\\tmp\\shots\\');
  assert.equal(o.live, 'https://example.test/x/');
  assert.equal(o.external, true);
  assert.equal(parseArgs(['--no-external']).external, false);
  assert.equal(parseArgs(['--live', 'http://127.0.0.1:8791/physical-ai-roadmap']).live, 'http://127.0.0.1:8791/physical-ai-roadmap/', 'a live base always ends with /');
  assert.throws(() => parseArgs(['--live', 'ftp://x']), /http\(s\) URL/);
  assert.deepEqual(parseArgs(['--pages=s11']).pages, ['s11']);
  assert.throws(() => parseArgs(['--widths', '12']), /bad width/);
  assert.throws(() => parseArgs(['--themes', 'sepia']), /bad theme/);
  assert.throws(() => parseArgs(['--pages']), /needs a value/);
  assert.throws(() => parseArgs(['--bogus']), /unknown flag/);
  assert.deepEqual(PORT_RANGE, [8790, 8791, 8792, 8793, 8794, 8795, 8796, 8797, 8798, 8799]);
});

test('free-port probe skips an occupied port and returns null when none is free', async () => {
  const busy = createServer();
  await new Promise((r) => busy.listen(0, '127.0.0.1', r));
  const busyPort = busy.address().port;
  const probe = createServer();
  await new Promise((r) => probe.listen(0, '127.0.0.1', r));
  const freePort = probe.address().port;
  await new Promise((r) => probe.close(r));
  try {
    assert.equal(await findFreePort([busyPort]), null);
    assert.equal(await findFreePort([busyPort, freePort]), freePort);
  } finally {
    await new Promise((r) => busy.close(r));
  }
});

test('crawl: resolves files and fragments, counts style attributes and prev/next links', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'pair-verify-'));
  try {
    mkdirSync(path.join(dir, 'assets'));
    writeFileSync(path.join(dir, 'assets', 'app.css'), 'body{}');
    writeFileSync(path.join(dir, 'index.html'), '<html><head><link rel="stylesheet" href="assets/app.css"><link rel="next" href="s01.html"></head><body><a href="s01.html#top">a</a><a href="#here">b</a><p id="here"></p><a href="https://example.test/">x</a><a href="s01.html#nope">c</a><a href="missing.html">d</a></body></html>');
    writeFileSync(path.join(dir, 's01.html'), '<html><body><h1 id="top" style="margin:0">t</h1><a href="index.html">home</a></body></html>');
    writeFileSync(path.join(dir, '404.html'), '<html><head><base href="/physical-ai-roadmap/"></head><body><a href="index.html">home</a></body></html>');
    const c = crawl(dir);
    assert.equal(c.pages, 3);
    assert.equal(c.refs, 8);
    assert.deepEqual(c.broken, ['index.html → s01.html#nope (missing fragment)', 'index.html → missing.html (missing file)']);
    assert.equal(c.styleAttrs, 1);
    assert.equal(c.prevNext, 1);
    assert.equal(c.assets, 1, 'assets/app.css is the one non-page target');
    assert.deepEqual(c.external, ['https://example.test/'], 'http(s) hrefs are collected for the external sample');
    assert.deepEqual(allPages(dir), ['404', 'index', 's01']);
    writeFileSync(path.join(dir, 's01.html'), '<html><body><link rel="stylesheet" href="assets/missing.css"></body></html>');
    assert.ok(crawl(dir).broken.includes('s01.html → assets/missing.css (missing file)'), 'a missing asset is a broken reference');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('external sample: deterministic every-k-th host with one URL each, round-robin when hosts are few', () => {
  const urls = [];
  for (let h = 0; h < 90; h++) for (let i = 0; i < 3; i++) urls.push(`https://h${String(h).padStart(2, '0')}.test/p${i}`);
  const a = sampleExternal(urls, 40);
  assert.equal(a.sample.length, 40);
  assert.equal(a.hosts, 90);
  assert.equal(a.urls, 270);
  assert.equal(new Set(a.sample.map((u) => new URL(u).hostname)).size, 40, 'one URL per sampled host');
  assert.equal(a.sample[0], 'https://h00.test/p0');
  assert.equal(a.sample[1], 'https://h02.test/p0', 'k = floor(90 / 40) = 2');
  assert.deepEqual(sampleExternal(urls.slice().reverse(), 40).sample, a.sample, 'input order does not matter');
  const few = sampleExternal(['https://a.test/2', 'https://a.test/1', 'https://b.test/1', 'https://c.test/1', 'https://a.test/3', 'not a url'], 4);
  assert.deepEqual(few.sample, ['https://a.test/1', 'https://b.test/1', 'https://c.test/1', 'https://a.test/2']);
  assert.equal(sampleExternal(['https://a.test/1'], 40).sample.length, 1, 'never more than the distinct links available');
});

test('status classes cover 2xx/3xx/403/404/429/5xx/timeout/other; a probe never throws', async () => {
  assert.deepEqual(STATUS_CLASSES, ['2xx', '3xx', '403', '404', '429', '5xx', 'timeout', 'other']);
  assert.deepEqual([{ status: 200 }, { status: 301 }, { status: 403 }, { status: 404 }, { status: 429 }, { status: 503 }, { error: 'timeout' }, { status: null, error: 'network: ECONNRESET' }, { status: 405 }].map(classifyStatus), ['2xx', '3xx', '403', '404', '429', '5xx', 'timeout', 'other', 'other']);
  const calls = [];
  const fetchImpl = async (url, init) => { calls.push(init.method); if (init.method === 'HEAD') return new Response(null, { status: 405 }); return new Response('x', { status: 403, headers: { server: 'cloudflare' } }); };
  const r = await probeUrl('https://blocked.test/a', { fetchImpl });
  assert.deepEqual(calls, ['HEAD', 'GET'], 'HEAD then GET fallback');
  assert.equal(r.method, 'GET');
  assert.equal(r.status, 403);
  assert.equal(r.headStatus, 405);
  assert.equal(r.server, 'cloudflare');
  assert.equal(classifyStatus(r), '403');
  const ok = await probeUrl('https://fine.test/', { fetchImpl: async () => new Response(null, { status: 204 }) });
  assert.equal(ok.method, 'HEAD');
  assert.equal(classifyStatus(ok), '2xx');
  const timeout = await probeUrl('https://slow.test/', { fetchImpl: async () => { const e = new Error('t'); e.name = 'TimeoutError'; throw e; } });
  assert.equal(classifyStatus(timeout), 'timeout');
  const refused = await probeUrl('https://down.test/', { fetchImpl: async () => { throw new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } }); } });
  assert.equal(refused.error, 'network: ECONNREFUSED');
  assert.equal(classifyStatus(refused), 'other');
});

test('meta table rows and summary shape', () => {
  const rows = metaRows({ sources: { 'a-src': { class: 'arxiv', status: 'ok', newestAt: '2026-10-20T12:30:41Z', note: 'filtered' }, 'b-src': { class: 'regulator', status: 'failed', error: 'tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE', note: 'reachability' }, 'c-src': { class: 'lab', status: 'empty' } } });
  assert.deepEqual(rows, [
    { id: 'a-src', class: 'arxiv', status: 'ok', newest: '2026-10-20', errorOrNote: 'filtered' },
    { id: 'b-src', class: 'regulator', status: 'failed', newest: '', errorOrNote: 'tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE' },
    { id: 'c-src', class: 'lab', status: 'empty', newest: '', errorOrNote: '' },
  ]);
  const table = formatMetaTable(rows).split('\n');
  assert.equal(table.length, 4);
  assert.match(table[0], /^id {5}class {6}status {2}newest {6}error \/ note$/);
  assert.match(table[2], /^b-src {2}regulator {2}failed {14}tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE$/, 'an empty newest column keeps its width');
  assert.deepEqual(metaRows({}), []);
  const s = buildSummary({ failures: [], elapsedSeconds: 1.5, opts: { widths: [390, 2560], themes: ['light', 'dark'] }, audit: { summary: { pagesAudited: 28, checkCount: 5900, minContrast: { light: 4.87, dark: 7.12 }, minFont: 12.75, bodyFont: { 320: 17, 390: 17, 2560: 22 }, contentRatio: { 1920: 0.93, 2560: 0.93 } } }, external: { sampled: 40, counts: { '2xx': 38, '403': 2 } }, shots: [{ file: path.join(REPO, 'docs', 'screenshots', 'index-390-light.png') }] });
  assert.deepEqual(Object.keys(s), ['pass', 'failures', 'elapsedSeconds', 'pagesAudited', 'widths', 'themes', 'checks', 'minContrast', 'minTextPx', 'bodyPx', 'contentRatio', 'externalLinks', 'screenshots']);
  assert.deepEqual(s.bodyPx, { 390: 17, 2560: 22 });
  assert.deepEqual(s.contentRatio, { 1920: 0.93, 2560: 0.93 });
  assert.deepEqual(s.screenshots, ['docs/screenshots/index-390-light.png']);
  const none = buildSummary({ failures: ['audit: venv Python missing'], elapsedSeconds: 0, opts: { widths: [390], themes: ['light'] }, audit: null, external: null, shots: [] });
  assert.equal(none.pass, false);
  assert.equal(none.checks, 0);
  assert.equal(none.externalLinks, null);
  assert.ok(resolveShotsPrefix('docs/screenshots/').endsWith(path.sep), 'a directory prefix keeps its trailing separator');
  assert.ok(resolveShotsPrefix('docs/screenshots/live-').endsWith(`screenshots${path.sep}live-`));
  assert.equal(resolveShotsPrefix(''), '');
  assert.equal(relToRepo(path.join(REPO, 'docs', 'a.png')), 'docs/a.png');
});

test('the report keeps indented JSON but writes audit checks one per line', () => {
  const report = { pages: ['index'], audit: { summary: { pass: true }, checks: [{ name: 'noOverflow', pass: true, value: { a: 1 } }, { name: 'gutters', pass: false, value: 16 }] }, summary: { pass: false } };
  const text = formatReport(report);
  assert.deepEqual(JSON.parse(text), report, 'round-trips');
  assert.ok(text.includes('\n   {"name":"noOverflow","pass":true,"value":{"a":1}},\n   {"name":"gutters","pass":false,"value":16}\n  ]'));
  assert.ok(text.includes('\n "pages": [\n  "index"\n ],'));
  assert.equal(formatReport({ audit: null, summary: {} }), JSON.stringify({ audit: null, summary: {} }, null, 1));
});
