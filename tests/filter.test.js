import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { applyFilters, sortNewest, triageOf, nextTriage, withTriage, triageCounts, statusLine, healthCounts, healthSummary, noteOrError, noticeStatus, unavailableText, matchesQuery, hostLabel, LISTINGS, CLASS_LABELS } from '../assets/lib/filter.js';
import { formatDate } from '../assets/lib/format.js';
import { ROOT } from './helpers.js';

const items = [
  { id: 'arxiv:1', title: 'A', url: 'https://arxiv.org/abs/1', sourceClass: 'arxiv', publishedAt: '2026-10-20T12:00:00Z', matchedQuery: 'cs.RO listing', alsoMatched: ['Safe autonomy'] },
  { id: 'arxiv:2', title: 'B', url: 'https://arxiv.org/abs/2', sourceClass: 'arxiv', publishedAt: '2026-10-20T12:00:00Z', matchedQuery: 'Aerial autonomy', alsoMatched: [] },
  { id: 'url:3', title: 'C', url: 'https://github.com/x/y/releases/tag/1', sourceClass: 'release', publishedAt: '2026-10-21T00:00:00Z', matchedQuery: null, alsoMatched: [] },
  { id: 'url:4', title: 'D', url: 'https://www.ri.cmu.edu/p', sourceClass: 'lab', publishedAt: '2026-10-01T00:00:00Z', matchedQuery: null, alsoMatched: [] },
  { id: 'bad', title: 5 },
];
const triage = { 'arxiv:2': { state: 'drop', at: 't' }, 'url:4': { state: 'keep', at: 't' }, 'url:3': { state: 'later', at: 't' }, stale: { state: 'keep', at: 't' }, junk: { state: 'nope' } };

test('sort newest first with the pipeline tiebreak; invalid items are ignored', () => {
  assert.deepEqual(sortNewest(items).map((i) => i.id), ['url:3', 'arxiv:1', 'arxiv:2', 'url:4']);
  assert.deepEqual(sortNewest(null), []);
});

test('filters: class, query (incl. listings), triage (Everything hides dropped)', () => {
  const ids = (f) => applyFilters(items, triage, f).map((i) => i.id);
  assert.deepEqual(ids({}), ['url:3', 'arxiv:1', 'url:4'], 'dropped arxiv:2 hidden by default');
  assert.deepEqual(ids({ cls: 'release' }), ['url:3']);
  assert.deepEqual(ids({ cls: 'arxiv' }), ['arxiv:1']);
  assert.deepEqual(ids({ cls: 'arxiv', tri: 'drop' }), ['arxiv:2']);
  assert.deepEqual(ids({ tri: 'drop' }), ['arxiv:2']);
  assert.deepEqual(ids({ tri: 'keep' }), ['url:4']);
  assert.deepEqual(ids({ tri: 'later' }), ['url:3']);
  assert.deepEqual(ids({ query: 'Safe autonomy' }), ['arxiv:1'], 'alsoMatched counts');
  assert.deepEqual(ids({ query: 'Aerial autonomy' }), [], 'the only Aerial item is dropped');
  assert.deepEqual(ids({ query: 'Aerial autonomy', tri: 'drop' }), ['arxiv:2']);
  assert.deepEqual(ids({ query: LISTINGS }), ['arxiv:1']);
  assert.deepEqual(ids({ query: 'Thesis narrow' }), []);
  assert.equal(matchesQuery(items[2], null), true);
  assert.equal(matchesQuery(items[2], LISTINGS), false);
});

test('triage state, toggling, storage shape and live counts', () => {
  assert.equal(triageOf(triage, 'url:4'), 'keep');
  assert.equal(triageOf(triage, 'junk'), null);
  assert.equal(triageOf(null, 'x'), null);
  assert.equal(nextTriage('keep', 'keep'), null);
  assert.equal(nextTriage('keep', 'drop'), 'drop');
  assert.equal(nextTriage(null, 'later'), 'later');
  const t2 = withTriage(triage, 'arxiv:1', 'keep', '2026-10-22T00:00:00Z');
  assert.deepEqual(t2['arxiv:1'], { state: 'keep', at: '2026-10-22T00:00:00Z' });
  assert.equal(triage['arxiv:1'], undefined, 'pure');
  const t3 = withTriage(t2, 'arxiv:1', null, 'x');
  assert.equal(t3['arxiv:1'], undefined);
  assert.deepEqual(withTriage(null, 'a', 'drop', 't'), { a: { state: 'drop', at: 't' } });
  assert.deepEqual(triageCounts(items, triage), { keep: 1, later: 1, drop: 1 }, 'stale ids do not count');
  assert.equal(statusLine(3, 4), 'Showing 3 of 4 items in the window.');
});

test('health counts, the DR-9 summary string and the D6 failure line against the real data/meta.json shape', () => {
  const meta = JSON.parse(readFileSync(path.join(ROOT, 'data', 'meta.json'), 'utf8'));
  const counts = healthCounts(meta.sources);
  assert.equal(counts.total, Object.keys(meta.sources).length);
  assert.equal(counts.ok + counts.empty + counts.failed, counts.total);
  assert.match(healthSummary(counts), /^■ ok \d+ · □ empty \d+ · ✕ failed \d+ · \d+ sources$/);
  assert.deepEqual(healthCounts(null), { ok: 0, empty: 0, failed: 0, total: 0 });
  const failed = { status: 'failed', error: 'tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE', unavailableSince: '2026-10-21T13:14:00Z', checkedAt: '2026-10-22T02:23:00Z', note: 'reachability only' };
  assert.equal(unavailableText(failed, formatDate), 'Unavailable since 21 Oct 2026 · tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE');
  assert.equal(noteOrError(failed, formatDate), 'Unavailable since 21 Oct 2026 · tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE');
  assert.equal(noteOrError({ status: 'empty', note: 'yearly volume' }, formatDate), 'yearly volume');
  assert.equal(noteOrError({ status: 'ok' }, formatDate), '');
  assert.equal(noticeStatus({ status: 'ok', httpStatus: 200, checkedAt: '2026-10-22T02:23:00Z' }, formatDate), 'HTTP 200 · 22 Oct 2026');
  assert.equal(noticeStatus(failed, formatDate), 'Unavailable since 21 Oct 2026 · tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE');
  assert.equal(noticeStatus(undefined, formatDate), 'not checked yet');
  assert.equal(unavailableText({ status: 'failed', error: 'HTTP 503' }, formatDate), 'Unavailable since an unknown date · HTTP 503');
  assert.equal(hostLabel('https://www.ri.cmu.edu/p'), 'ri.cmu.edu');
  assert.equal(hostLabel('nope'), '');
  assert.deepEqual(Object.keys(CLASS_LABELS), ['arxiv', 'proceedings', 'lab', 'release', 'regulator']);
});
