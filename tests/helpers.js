// Shared feed-test helpers: the fixture for every registry URL, the offline fetch (unmapped URLs throw),
// a fake clock for pacing/backoff, and the in-process pipeline runner. Tests never touch the network.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sources } from '../sources.config.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FIXTURES = path.join(ROOT, 'tests', 'fixtures', 'feed');
/** The run clock: the day after the captures (2026-10-21), so the 30-day window starts on 2026-09-22. */
export const NOW = new Date('2026-10-22T00:00:00Z');

export const read = (name) => readFileSync(path.join(FIXTURES, name), 'utf8');

const ATOM = 'application/atom+xml; charset=utf-8';
const RSS = 'application/rss+xml; charset=UTF-8';
const XML = 'application/xml';
const HTML = 'text/html; charset=utf-8';

/** registry id → [fixture file, content-type]. Sources without their own capture use the same-kind fixture (a dedupe test). */
export const FIXTURE_BY_ID = Object.freeze({
  'arxiv-cs.RO': ['arxiv-api-cs.RO.xml', ATOM],
  'arxiv-eess.SY': ['arxiv-api-cs.RO.xml', ATOM],
  'arxiv-q-thesis-narrow': ['arxiv-q-thesis-narrow.xml', ATOM],
  'arxiv-q-aerial-autonomy': ['arxiv-q-aerial.xml', ATOM],
  'arxiv-q-safe-autonomy': ['arxiv-q-aerial.xml', ATOM],
  'arxiv-q-robot-learning-eval': ['arxiv-q-aerial.xml', ATOM],
  'rss-proceedings': ['rss22-index.html', 'text/html'],
  'pmlr-corl': ['pmlr-v305.xml', XML],
  'lab-cmu-ri': ['cmu-ri.xml', RSS],
  'lab-bair': ['bair-blog.xml', XML],
  'lab-grasp': ['grasp-news.xml', RSS],
  'rel-ros2': ['gh-releases-ros2.xml', ATOM],
  'rel-px4': ['gh-releases-px4.xml', ATOM],
  'rel-mujoco': ['gh-releases-mujoco.xml', ATOM],
  'rel-gz-sim': ['gh-releases-gz-sim.xml', ATOM],
  'rel-nav2': ['gh-releases-nav2.xml', ATOM],
  'rel-qgc': ['gh-releases-qgc.xml', ATOM],
  'rel-mavsdk': ['gh-releases-mavsdk.xml', ATOM],
  'reg-nist': ['nist-news.xml', RSS],
});
/** Reachability checks that answer 200 (a generated HTML page; the real pages are not machine-readable anyway). */
export const REACHABLE_IDS = new Set(['reg-dgca', 'reg-moca', 'reg-digitalsky', 'reg-aai-aim']);
/** eGazette: the probe's TLS failure (incomplete certificate chain), reproduced as Node's fetch error shape. */
export const TLS_FAIL_IDS = new Set(['reg-egazette']);
export const REACHABLE_HTML = '<!doctype html><html lang="en"><head><title>Official page</title></head><body><p>Reachability fixture: HTTP 200, not machine-readable.</p></body></html>';

export function tlsError(code = 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
  const cause = new Error('unable to verify the first certificate');
  cause.code = code;
  return new TypeError('fetch failed', { cause });
}

export function sourceById(id) {
  const s = sources.find((x) => x.id === id);
  if (!s) throw new Error(`no registry source ${id}`);
  return s;
}

export function fixtureFor(source) {
  if (FIXTURE_BY_ID[source.id]) return { fixture: FIXTURE_BY_ID[source.id] };
  if (REACHABLE_IDS.has(source.id)) return { html: REACHABLE_HTML };
  if (TLS_FAIL_IDS.has(source.id)) return { throw: tlsError() };
  return null;
}

function headerOf(init, name) {
  const h = init && init.headers;
  if (!h) return undefined;
  if (typeof h.get === 'function') return h.get(name);
  const key = Object.keys(h).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? h[key] : undefined;
}

/**
 * Offline fetch: every registry URL maps to a fixture; `overrides[url]` = { status, body, contentType, headers, throw }
 * replaces one; anything else throws. `calls` collects { url, init } when given.
 */
export function fixtureFetch({ overrides = {}, calls } = {}) {
  const map = new Map();
  for (const s of sources) {
    const fx = fixtureFor(s);
    if (!fx) throw new Error(`tests/helpers.js has no fixture for registry source ${s.id}`);
    map.set(s.url, fx);
  }
  return async function fetchImpl(url, init = {}) {
    const key = String(url);
    if (Array.isArray(calls)) calls.push({ url: key, init, accept: headerOf(init, 'accept') });
    const ov = overrides[key];
    if (ov) {
      if (ov.throw) throw ov.throw;
      const headers = { 'content-type': ov.contentType || 'text/plain', ...(ov.headers || {}) };
      return new Response(ov.body === undefined ? '' : ov.body, { status: ov.status === undefined ? 200 : ov.status, headers });
    }
    const fx = map.get(key);
    if (!fx) throw new Error(`fixtureFetch: unmapped URL ${key}`);
    if (fx.throw) throw fx.throw;
    if (fx.html !== undefined) return new Response(fx.html, { status: 200, headers: { 'content-type': HTML } });
    return new Response(read(fx.fixture[0]), { status: 200, headers: { 'content-type': fx.fixture[1] } });
  };
}

/** A clock whose `sleep` advances `nowMs` instantly and records every requested wait. */
export function fakeClock(startMs = NOW.getTime()) {
  let t = startMs;
  const sleeps = [];
  return {
    nowMs: () => t,
    sleep: (ms) => { sleeps.push(ms); t += Math.max(0, ms); return Promise.resolve(); },
    advance: (ms) => { t += ms; },
    sleeps,
  };
}

/** Run the real pipeline in-process on fixtures (dry run unless told otherwise). */
export async function runFixture(options = {}) {
  const { run } = await import('../src/feed/pipeline.js');
  const { overrides, calls, clock = fakeClock(), ...rest } = options;
  return run({ sources, now: NOW, dataDir: path.join(FIXTURES, 'no-such-dir'), fetchImpl: fixtureFetch({ overrides, calls }), sleep: clock.sleep, nowMs: clock.nowMs, dryRun: true, runner: 'test', ...rest });
}
