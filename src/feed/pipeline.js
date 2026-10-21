// The §17 fetch pipeline (design "Feed"): registry → fetch (concurrency 4, per-host pacing, 45 s per source,
// 8 min wall clock) → parse → normalize → window/filters/cap → merge with the previous data/feed.json → dedupe →
// sort → cap 500 → atomic writes of feed.json and meta.json. Health is data, not a crash: a failing source is a
// `failed` row; the exit code is 1 only when the registry cannot load, writing fails, or every source failed.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHttpClient, errorSummary, formatDetail, WallClockError } from './http.js';
import { parseArxiv } from './parsers/arxiv.js';
import { parseAtomRss } from './parsers/atomrss.js';
import { parseRssProceedings } from './parsers/rss-proceedings.js';
import { reachabilityResult } from './parsers/reachability.js';
import { normalizeSource, inWindow, WINDOW_DAYS, toIso } from './normalize.js';
import { validateSources } from '../../sources.config.mjs';

export const CONCURRENCY = 4;
export const SOURCE_DEADLINE_MS = 45_000;
export const WALL_CLOCK_MS = 8 * 60_000;
export const GLOBAL_CAP = 500;
export const FEED_FILE = 'feed.json';
export const META_FILE = 'meta.json';

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    return { __corrupt: true, error: err.message };
  }
}

async function writeAtomic(file, text) {
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, text, 'utf8');
  await fs.rename(tmp, file);
}

/** Minimal shape check for an item carried over from the previous feed.json. */
function validPrevItem(it) {
  return it && typeof it.id === 'string' && typeof it.title === 'string' && typeof it.url === 'string' && typeof it.publishedAt === 'string' && toIso(it.publishedAt) !== null;
}

/** Parse + normalize one fetched body according to the source kind. */
export function processBody(source, text, now) {
  if (source.kind === 'arxiv') return normalizeSource(parseArxiv(text).items, source, now);
  if (source.kind === 'atomrss') return normalizeSource(parseAtomRss(text).items, source, now);
  if (source.kind === 'rss-proceedings') return normalizeSource(parseRssProceedings(text, { baseUrl: source.url, volumeDate: source.volumeDate }).items, source, now);
  throw new Error(`unknown source kind ${source.kind}`);
}

/** Run `fn(item)` over `list` with at most `limit` in flight; results keep the input order. */
async function mapConcurrent(list, limit, fn) {
  const out = new Array(list.length);
  let next = 0;
  async function worker() {
    for (;;) {
      const i = next++;
      if (i >= list.length) return;
      out[i] = await fn(list[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker));
  return out;
}

/**
 * @param {object} o
 * @param {Array} o.sources the registry (sources.config.mjs `sources`)
 * @param {Date} [o.now] the run's clock (window, checkedAt, generatedAt); `nowMs` is the monotonic clock for timing
 * @param {string} [o.dataDir] where feed.json / meta.json are read and written
 * @param {Function} [o.fetchImpl] injected fetch (tests pass the fixture fetch); defaults to globalThis.fetch
 * @param {boolean} [o.dryRun] never write
 * @param {string[]|null} [o.onlySourceIds] diagnostic subset (the CLI requires --dry-run with it)
 * @param {string} [o.runner] recorded as meta.runner (FEED_RUNNER env or 'local')
 * @returns {Promise<{ feed, meta, sourceResults, written, exitCode, warnings }>}
 */
export async function run({ sources, now = new Date(), dataDir = 'data', fetchImpl, sleep, nowMs = Date.now, dryRun = false, onlySourceIds = null, runner = process.env.FEED_RUNNER || 'local' } = {}) {
  const registry = validateSources(sources);
  let selected = registry;
  if (Array.isArray(onlySourceIds) && onlySourceIds.length) {
    const unknown = onlySourceIds.filter((id) => !registry.some((s) => s.id === id));
    if (unknown.length) throw new Error(`unknown source id(s): ${unknown.join(', ')}`);
    selected = registry.filter((s) => onlySourceIds.includes(s.id));
  }
  const warnings = [];
  const feedPath = path.join(dataDir, FEED_FILE);
  const metaPath = path.join(dataDir, META_FILE);
  const previous = await readJson(feedPath);
  const previousMeta = await readJson(metaPath);
  if (previous && previous.__corrupt) warnings.push(`previous ${FEED_FILE} is not valid JSON and is ignored`);
  if (previousMeta && previousMeta.__corrupt) warnings.push(`previous ${META_FILE} is not valid JSON and is ignored`);
  const prevItems = previous && !previous.__corrupt && Array.isArray(previous.items) ? previous.items.filter(validPrevItem) : [];
  const prevSources = previousMeta && !previousMeta.__corrupt && previousMeta.sources && typeof previousMeta.sources === 'object' ? previousMeta.sources : {};

  const http = createHttpClient({ fetchImpl, sleep, nowMs });
  const startedMs = nowMs();
  const runDeadline = startedMs + WALL_CLOCK_MS;
  const checkedAt = toIso(now.toISOString());

  async function fetchSource(source) {
    const t0 = nowMs();
    const base = { id: source.id, name: source.name, class: source.class, kind: source.kind, note: source.note || null, checkedAt, httpStatus: null, fetched: 0, kept: 0, newestAt: null, items: [], error: null, detail: '' };
    if (t0 > runDeadline) return { ...base, status: 'failed', error: errorSummary(new WallClockError('wall clock')), ms: 0 };
    const deadlineAt = Math.min(t0 + SOURCE_DEADLINE_MS, runDeadline);
    try {
      const res = await http.fetchText(source.url, { timeoutMs: source.timeoutMs, maxBytes: source.maxBytes, deadlineAt });
      base.httpStatus = res.status;
      if (source.kind === 'reachability') {
        const r = reachabilityResult(res);
        return { ...base, status: r.ok ? 'ok' : 'failed', error: r.ok ? null : `HTTP ${r.httpStatus}`, ms: nowMs() - t0 };
      }
      const n = processBody(source, res.text, now);
      return { ...base, status: n.items.length ? 'ok' : 'empty', fetched: n.fetched, kept: n.items.length, skipped: n.skipped, newestAt: n.newestAt, items: n.items, ms: nowMs() - t0 };
    } catch (err) {
      // a parse failure after a 200 keeps the 200; an HttpError records its status
      const httpStatus = base.httpStatus !== null ? base.httpStatus : err && Number.isInteger(err.status) ? err.status : null;
      return { ...base, status: 'failed', httpStatus, error: errorSummary(err), detail: formatDetail(err && err.detail), attempts: err && err.attempts, ms: nowMs() - t0 };
    }
  }

  const sourceResults = await mapConcurrent(selected, CONCURRENCY, fetchSource);

  // Merge: registry order decides which source owns a duplicate id; the other sources' labels go to alsoMatched.
  const byId = new Map();
  for (const r of sourceResults) {
    for (const item of r.items) {
      const existing = byId.get(item.id);
      if (!existing) { byId.set(item.id, { ...item, alsoMatched: [...item.alsoMatched] }); continue; }
      if (item.matchedQuery && item.matchedQuery !== existing.matchedQuery && !existing.alsoMatched.includes(item.matchedQuery)) existing.alsoMatched.push(item.matchedQuery);
    }
  }
  // Previous items still inside the window survive a transient failure; a fresh copy of the same id has replaced it above.
  const prevIds = new Set(prevItems.map((it) => it.id));
  for (const it of prevItems) {
    if (!byId.has(it.id) && inWindow(it.publishedAt, now)) byId.set(it.id, it);
  }
  const items = [...byId.values()]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id))
    .slice(0, GLOBAL_CAP);
  const newItemCount = items.filter((it) => !prevIds.has(it.id)).length;

  const metaSources = {};
  for (const r of sourceResults) {
    const prev = prevSources[r.id] || {};
    metaSources[r.id] = {
      name: r.name,
      class: r.class,
      kind: r.kind,
      status: r.status,
      fetched: r.fetched,
      kept: r.kept,
      ms: r.ms,
      httpStatus: r.httpStatus,
      checkedAt: r.checkedAt,
      newestAt: r.newestAt,
      error: r.status === 'failed' ? r.error : null,
      unavailableSince: r.status === 'failed' ? (typeof prev.unavailableSince === 'string' && prev.unavailableSince ? prev.unavailableSince : r.checkedAt) : null,
      note: r.note,
    };
  }
  const feed = { generatedAt: checkedAt, windowDays: WINDOW_DAYS, items };
  const meta = { generatedAt: checkedAt, durationMs: nowMs() - startedMs, windowDays: WINDOW_DAYS, itemCount: items.length, newItemCount, runner, sources: metaSources };

  const allFailed = sourceResults.length > 0 && sourceResults.every((r) => r.status === 'failed');
  let written = false;
  let exitCode = 0;
  if (allFailed) {
    warnings.push('every source failed; the previous data is kept');
    exitCode = 1;
  } else if (!dryRun) {
    await fs.mkdir(dataDir, { recursive: true });
    await writeAtomic(feedPath, `${JSON.stringify(feed, null, 1)}\n`);
    await writeAtomic(metaPath, `${JSON.stringify(meta, null, 1)}\n`);
    written = true;
  }
  return { feed, meta, sourceResults, written, exitCode, warnings, dataDir };
}
