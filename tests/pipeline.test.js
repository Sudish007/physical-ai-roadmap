import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runFixture, NOW, FIXTURE_BY_ID, REACHABLE_IDS, TLS_FAIL_IDS, sourceById, read } from './helpers.js';
import { sources } from '../sources.config.mjs';
import { parseArgs, formatTable } from '../scripts/fetch.mjs';
import { GLOBAL_CAP } from '../src/feed/pipeline.js';

const META_FIELDS = ['name', 'class', 'kind', 'status', 'fetched', 'kept', 'ms', 'httpStatus', 'checkedAt', 'newestAt', 'error', 'unavailableSince', 'note'];
const ITEM_FIELDS = ['id', 'title', 'url', 'source', 'sourceId', 'sourceClass', 'publishedAt', 'summary', 'matchedQuery', 'alsoMatched'];

test('every registry source has a fixture mapping (no network in tests)', () => {
  for (const s of sources) assert.ok(FIXTURE_BY_ID[s.id] || REACHABLE_IDS.has(s.id) || TLS_FAIL_IDS.has(s.id), s.id);
  assert.equal(sources.length, 24);
});

test('fixture run with a throwing globalThis.fetch: statuses, dedupe, reachability, meta shape, exit 0', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('tests must not touch the network'); };
  let r;
  try {
    r = await runFixture();
  } finally {
    globalThis.fetch = realFetch;
  }
  const status = Object.fromEntries(r.sourceResults.map((s) => [s.id, s.status]));
  assert.deepEqual(status, {
    'arxiv-cs.RO': 'ok', 'arxiv-eess.SY': 'ok', 'arxiv-q-thesis-narrow': 'empty', 'arxiv-q-aerial-autonomy': 'ok', 'arxiv-q-safe-autonomy': 'ok', 'arxiv-q-robot-learning-eval': 'ok',
    'rss-proceedings': 'empty', 'pmlr-corl': 'empty',
    'lab-cmu-ri': 'empty', 'lab-bair': 'empty', 'lab-grasp': 'ok',
    'rel-ros2': 'empty', 'rel-px4': 'empty', 'rel-mujoco': 'ok', 'rel-gz-sim': 'ok', 'rel-nav2': 'ok', 'rel-qgc': 'ok', 'rel-mavsdk': 'ok',
    'reg-nist': 'ok', 'reg-dgca': 'ok', 'reg-moca': 'ok', 'reg-egazette': 'failed', 'reg-digitalsky': 'ok', 'reg-aai-aim': 'ok',
  });
  assert.equal(r.exitCode, 0);
  assert.equal(r.written, false, 'dry run');
  const counts = { ok: 0, empty: 0, failed: 0 };
  for (const s of r.sourceResults) counts[s.status]++;
  assert.deepEqual(counts, { ok: 16, empty: 7, failed: 1 });
  // items: 3 listing + 10 query + 5 GRASP + 3 MuJoCo + 2 gz-sim + 2 Nav2 + 1 QGC + 3 MAVSDK + 1 NIST, deduped across the same-fixture sources
  assert.equal(r.feed.items.length, 30);
  assert.equal(r.meta.itemCount, 30);
  assert.equal(r.meta.newItemCount, 30, 'no previous feed');
  assert.equal(r.feed.windowDays, 30);
  assert.equal(r.feed.generatedAt, NOW.toISOString().replace('.000Z', 'Z'));
  const ids = r.feed.items.map((it) => it.id);
  assert.equal(new Set(ids).size, ids.length, 'ids are unique');
  for (const it of r.feed.items) {
    assert.deepEqual(Object.keys(it), ITEM_FIELDS);
    assert.ok(Date.parse(it.publishedAt) >= NOW.getTime() - 30 * 86_400_000, `${it.id} in window`);
    assert.ok(it.summary.length <= 300);
    assert.ok(!it.summary.endsWith('...'), 'DR-9');
    assert.match(it.url, /^https:\/\//);
  }
  const sorted = [...r.feed.items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
  assert.deepEqual(r.feed.items.map((i) => i.id), sorted.map((i) => i.id), 'newest first');
  // dedupe: registry order owns the id, the other labels go to alsoMatched
  const listing = r.feed.items.find((it) => it.sourceId === 'arxiv-cs.RO');
  assert.ok(listing);
  assert.equal(listing.matchedQuery, 'cs.RO listing');
  assert.deepEqual(listing.alsoMatched, ['eess.SY listing']);
  assert.equal(r.feed.items.filter((it) => it.sourceId === 'arxiv-eess.SY').length, 0);
  const aerial = r.feed.items.find((it) => it.sourceId === 'arxiv-q-aerial-autonomy');
  assert.equal(aerial.matchedQuery, 'Aerial autonomy');
  assert.deepEqual(aerial.alsoMatched, ['Safe autonomy', 'Robot-learning evaluation']);
  assert.equal(aerial.source, 'arXiv query: Aerial autonomy');
  assert.match(aerial.id, /^arxiv:\d{4}\.\d{5}$/);
  assert.equal(aerial.url, `https://arxiv.org/abs/${aerial.id.slice(6)}`);
  const release = r.feed.items.find((it) => it.sourceId === 'rel-nav2');
  assert.equal(release.matchedQuery, null);
  assert.match(release.id, /^url:[0-9a-f]{16}$/);
  const gz = r.feed.items.filter((it) => it.sourceId === 'rel-gz-sim');
  assert.equal(gz.length, 2);
  assert.ok(gz.every((it) => it.summary === ''), 'Signed-off-by trailers removed → empty summary');
  // reachability: ok on 200 with no items; eGazette fails with the TLS class
  for (const id of REACHABLE_IDS) {
    const m = r.meta.sources[id];
    assert.equal(m.status, 'ok');
    assert.equal(m.httpStatus, 200);
    assert.equal(m.fetched, 0);
    assert.equal(m.error, null);
    assert.equal(m.unavailableSince, null);
  }
  const eg = r.meta.sources['reg-egazette'];
  assert.equal(eg.status, 'failed');
  assert.equal(eg.error, 'tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE');
  assert.equal(eg.unavailableSince, r.meta.generatedAt, 'first failure: unavailableSince = this run');
  assert.equal(eg.httpStatus, null);
  // meta shape
  assert.deepEqual(Object.keys(r.meta), ['generatedAt', 'durationMs', 'windowDays', 'itemCount', 'newItemCount', 'runner', 'sources']);
  assert.equal(r.meta.runner, 'test');
  assert.equal(Object.keys(r.meta.sources).length, 24);
  for (const [id, m] of Object.entries(r.meta.sources)) {
    assert.deepEqual(Object.keys(m), META_FIELDS, id);
    assert.equal(m.checkedAt, r.meta.generatedAt);
    assert.ok(m.error === null || m.error.length <= 120);
    assert.ok(m.note === null || m.note.length <= 120);
    assert.equal(m.name, sourceById(id).name);
  }
  assert.equal(r.meta.sources['arxiv-cs.RO'].fetched, 10);
  assert.equal(r.meta.sources['arxiv-cs.RO'].kept, 3);
  assert.equal(r.meta.sources['arxiv-q-thesis-narrow'].fetched, 33);
  assert.equal(r.meta.sources['arxiv-q-thesis-narrow'].newestAt, '2026-07-21T09:48:50Z');
  assert.equal(r.meta.sources['rss-proceedings'].fetched, 15);
  assert.equal(r.meta.sources['rss-proceedings'].newestAt, '2026-07-13T00:00:00Z');
  assert.equal(r.meta.sources['rss-proceedings'].note, 'yearly volume');
  assert.equal(r.meta.sources['lab-cmu-ri'].fetched, 5);
  assert.equal(r.meta.sources['lab-cmu-ri'].kept, 0);
  assert.equal(r.meta.sources['reg-nist'].kept, 1);
  // the CLI table
  const table = formatTable(r);
  assert.match(table, /^id\s+\| status \| fetched \| kept \| ms\s+\| http \| newest\s+\| note\/error/m);
  assert.match(table, /reg-egazette\s+\| failed \| —\s+\| —\s+\|.*\| —\s+\| —\s+\| tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE/);
  assert.match(table, /ok 16 · empty 7 · failed 1 · items 30 · new 30 · nothing written/);
});

test('merge with the previous feed and meta: in-window items kept, same ids replaced, unavailableSince carried and cleared, atomic writes', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pair-feed-test-'));
  try {
    const fresh = await runFixture();
    const replaced = fresh.feed.items[0];
    const previousItems = [
      { id: 'url:aaaaaaaaaaaaaaaa', title: 'Kept from the previous run', url: 'https://example.org/kept', source: 'UPenn GRASP news', sourceId: 'lab-grasp', sourceClass: 'lab', publishedAt: '2026-10-01T00:00:00Z', summary: '', matchedQuery: null, alsoMatched: [] },
      { id: 'url:bbbbbbbbbbbbbbbb', title: 'Too old', url: 'https://example.org/old', source: 'UPenn GRASP news', sourceId: 'lab-grasp', sourceClass: 'lab', publishedAt: '2026-09-01T00:00:00Z', summary: '', matchedQuery: null, alsoMatched: [] },
      { ...replaced, title: 'STALE TITLE' },
      { id: 'not valid', title: 5 },
    ];
    await fs.writeFile(path.join(dir, 'feed.json'), JSON.stringify({ generatedAt: '2026-10-20T02:23:00Z', windowDays: 30, items: previousItems }));
    await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify({ generatedAt: '2026-10-20T02:23:00Z', sources: {
      'reg-egazette': { status: 'failed', error: 'tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE', unavailableSince: '2026-10-01T02:23:00Z' },
      'rel-mujoco': { status: 'failed', error: 'HTTP 404', unavailableSince: '2026-10-19T02:23:00Z' },
    } }));
    const r = await runFixture({ dataDir: dir, dryRun: false });
    assert.equal(r.written, true);
    assert.equal(r.exitCode, 0);
    const feed = JSON.parse(await fs.readFile(path.join(dir, 'feed.json'), 'utf8'));
    const meta = JSON.parse(await fs.readFile(path.join(dir, 'meta.json'), 'utf8'));
    assert.ok(!existsSync(path.join(dir, 'feed.json.tmp')) && !existsSync(path.join(dir, 'meta.json.tmp')), 'temp files renamed away');
    assert.equal(feed.items.length, 31, '30 fresh + 1 previous in-window item');
    assert.ok(feed.items.some((it) => it.id === 'url:aaaaaaaaaaaaaaaa'), 'in-window previous item kept');
    assert.ok(!feed.items.some((it) => it.id === 'url:bbbbbbbbbbbbbbbb'), 'out-of-window previous item dropped');
    assert.ok(!feed.items.some((it) => it.id === 'not valid'));
    assert.equal(feed.items.find((it) => it.id === replaced.id).title, replaced.title, 'the fresh copy replaces the stale one');
    assert.equal(meta.newItemCount, 29, '30 fresh minus the one id that already existed');
    assert.equal(meta.itemCount, 31);
    assert.equal(meta.sources['reg-egazette'].unavailableSince, '2026-10-01T02:23:00Z', 'carried forward while it keeps failing');
    assert.equal(meta.sources['rel-mujoco'].status, 'ok');
    assert.equal(meta.sources['rel-mujoco'].unavailableSince, null, 'cleared on success');
    assert.equal(meta.sources['rel-mujoco'].error, null);
    assert.deepEqual(feed, r.feed);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('a Cloudflare 403 and a non-XML body are recorded as failed rows, not crashes', async () => {
  const nist = sourceById('reg-nist');
  const grasp = sourceById('lab-grasp');
  const r = await runFixture({ overrides: {
    [nist.url]: { status: 403, body: read('cloudflare-403.html'), contentType: 'text/html; charset=UTF-8', headers: { server: 'cloudflare', 'cf-ray': '9b1f2c3d4e5f6a7b-BOM', 'cf-mitigated': 'challenge' } },
    [grasp.url]: { status: 200, body: '<!doctype html><html><body>maintenance</body></html>', contentType: 'text/html' },
  } });
  const n = r.meta.sources['reg-nist'];
  assert.equal(n.status, 'failed');
  assert.equal(n.error, 'blocked: 403 Cloudflare');
  assert.equal(n.httpStatus, 403);
  assert.equal(n.note, 'provisional: Cloudflare-served; filtered with the §17.5 terms');
  const g = r.meta.sources['lab-grasp'];
  assert.equal(g.status, 'failed');
  assert.equal(g.error, 'parse error: xml');
  assert.equal(g.httpStatus, 200);
  assert.equal(r.exitCode, 0, 'source failures never fail the run');
  const detail = r.sourceResults.find((s) => s.id === 'reg-nist').detail;
  assert.match(detail, /server=cloudflare/);
  assert.match(detail, /cfRay=9b1f2c3d4e5f6a7b-BOM/);
  assert.match(detail, /body=".*Sorry, you have been blocked/);
});

test('exit semantics: every source failed → exit 1 and nothing written; unknown --source id throws; --source needs --dry-run', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pair-feed-test-'));
  try {
    const r = await runFixture({ dataDir: dir, dryRun: false, onlySourceIds: ['reg-egazette'] });
    assert.equal(r.exitCode, 1);
    assert.equal(r.written, false);
    assert.ok(r.warnings.some((w) => /every source failed/.test(w)));
    assert.ok(!existsSync(path.join(dir, 'feed.json')));
    await assert.rejects(runFixture({ onlySourceIds: ['nope'] }), /unknown source id\(s\): nope/);
    const subset = await runFixture({ onlySourceIds: ['rel-nav2', 'reg-dgca'] });
    assert.deepEqual(subset.sourceResults.map((s) => s.id), ['rel-nav2', 'reg-dgca']);
    assert.equal(subset.feed.items.length, 2);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
  assert.throws(() => parseArgs(['--source', 'rel-nav2']), /requires --dry-run/);
  assert.deepEqual(parseArgs(['--source', 'rel-nav2,reg-dgca', '--dry-run']).onlySourceIds, ['rel-nav2', 'reg-dgca']);
  assert.throws(() => parseArgs(['--now', 'yesterday']), /--now must be an ISO timestamp/);
  assert.equal(parseArgs(['--now', '2026-10-22T00:00:00Z']).now.toISOString(), '2026-10-22T00:00:00.000Z');
  assert.throws(() => parseArgs(['--bogus']), /unknown argument/);
  assert.equal(parseArgs(['--data-dir', 'x/y']).dataDir, path.resolve('x/y'));
  assert.ok(parseArgs([]).dataDir.endsWith(path.join('physical-ai-roadmap', 'data')));
});

test('the global cap is 500 and the per-source caps are the design values', () => {
  assert.equal(GLOBAL_CAP, 500);
  for (const s of sources) {
    if (s.kind === 'arxiv') assert.equal(s.maxItems, s.includeRule ? 60 : 50, s.id);
    else if (s.kind === 'reachability') assert.equal(s.maxItems, 0, s.id);
    else assert.equal(s.maxItems, 60, s.id);
  }
});
