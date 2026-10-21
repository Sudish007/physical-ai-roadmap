import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHttpClient, redactKey, errorSummary, formatDetail, HttpError, TimeoutError, BodyTooLarge, ParseError, WallClockError, timeoutFor, PACING, BROWSER_USER_AGENT, ACCEPT } from '../src/feed/http.js';
import { fakeClock, tlsError, read } from './helpers.js';

const URL_A = 'https://example.org/feed.xml';
const ARXIV = 'https://export.arxiv.org/api/query?search_query=cat:cs.RO&max_results=1';
const GH = 'https://github.com/ros2/ros2/releases.atom';

/** A fetch that answers from a script of responses per URL ({ status, body, headers, throw }); records calls. */
function scripted(script) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const list = script[url];
    if (!list || !list.length) throw new Error(`scripted fetch: no response left for ${url}`);
    const step = list.shift();
    calls.push({ url, init });
    if (step.throw) throw step.throw;
    if (step.hang) return new Promise((_, reject) => { init.signal.addEventListener('abort', () => reject(new Error('aborted'))); });
    return new Response(step.body === undefined ? '' : step.body, { status: step.status || 200, headers: step.headers || {} });
  };
  return { fetchImpl, calls };
}

test('redactKey hides key= query values and Authorization values; error messages are redacted before slicing', () => {
  assert.equal(redactKey('https://api.example/v1?part=snippet&key=AIzaSECRET&max=5'), 'https://api.example/v1?part=snippet&key=REDACTED&max=5');
  assert.equal(redactKey('x?api_key=abc'), 'x?api_key=REDACTED');
  assert.equal(redactKey('Authorization: Bearer eyJ.abc.def and more'), 'Authorization: REDACTED and more');
  assert.equal(redactKey('authorization=token123;'), 'authorization=REDACTED;');
  assert.equal(redactKey('nothing here'), 'nothing here');
  const err = new HttpError(403, 'https://h/p?key=SECRET', { body: 'denied key=SECRET', server: 'nginx' });
  assert.equal(err.message, 'HTTP 403 for https://h/p?key=REDACTED');
  assert.equal(err.url, 'https://h/p?key=REDACTED');
  assert.equal(err.detail.body, 'denied key=REDACTED');
  assert.equal(formatDetail(err.detail), 'body="denied key=REDACTED"; server=nginx');
  assert.equal(formatDetail(null), '');
  assert.equal(new TimeoutError('https://h/?key=S').message, 'timeout for https://h/?key=REDACTED');
  assert.equal(new BodyTooLarge('https://h/?key=S', 10).message, 'body exceeds 10 bytes for https://h/?key=REDACTED');
});

test('errorSummary classes are ≤120 chars: HTTP, Cloudflare 403, timeout, tls, parse, body, wall clock, network', () => {
  assert.equal(errorSummary(new HttpError(404, URL_A, {})), 'HTTP 404');
  assert.equal(errorSummary(new HttpError(403, URL_A, { server: 'cloudflare' })), 'blocked: 403 Cloudflare');
  assert.equal(errorSummary(new HttpError(403, URL_A, { cfRay: '9b1f-BOM' })), 'blocked: 403 Cloudflare');
  assert.equal(errorSummary(new HttpError(403, URL_A, { server: 'nginx' })), 'HTTP 403');
  assert.equal(errorSummary(new TimeoutError(URL_A)), 'timeout');
  assert.equal(errorSummary(Object.assign(new Error('aborted'), { name: 'AbortError' })), 'timeout');
  assert.equal(errorSummary(tlsError()), 'tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE');
  assert.equal(errorSummary(tlsError('CERT_HAS_EXPIRED')), 'tls: CERT_HAS_EXPIRED');
  assert.equal(errorSummary(new ParseError('xml')), 'parse error: xml');
  assert.equal(errorSummary(new BodyTooLarge(URL_A, 1)), 'body too large');
  assert.equal(errorSummary(new WallClockError()), 'wall clock');
  assert.equal(errorSummary(new TypeError('fetch failed', { cause: Object.assign(new Error('x'), { code: 'ECONNRESET' }) })), 'network: ECONNRESET');
  assert.equal(errorSummary(new Error('boom')), 'network');
  for (const e of [new HttpError(500, URL_A, { body: 'x'.repeat(500) }), tlsError('X'.repeat(300))]) assert.ok(errorSummary(e).length <= 120);
});

test('timeouts: 15 s for export.arxiv.org, 20 s elsewhere; pacing 3 s arXiv / 1 s github', () => {
  assert.equal(timeoutFor(ARXIV), 15_000);
  assert.equal(timeoutFor(GH), 20_000);
  assert.equal(timeoutFor(URL_A), 20_000);
  assert.deepEqual(PACING, { 'export.arxiv.org': 3000, 'github.com': 1000 });
});

test('a 200 is returned with browser-like headers and manual redirects (≤5 hops)', async () => {
  const s = scripted({
    [URL_A]: [{ status: 301, headers: { location: '/moved.xml' } }],
    'https://example.org/moved.xml': [{ status: 302, headers: { location: 'https://cdn.example.org/final.xml' } }],
    'https://cdn.example.org/final.xml': [{ status: 200, body: '<feed/>', headers: { 'content-type': 'application/atom+xml' } }],
  });
  const http = createHttpClient({ fetchImpl: s.fetchImpl, ...fakeClock() });
  const r = await http.fetchText(URL_A);
  assert.equal(r.status, 200);
  assert.equal(r.text, '<feed/>');
  assert.equal(r.finalUrl, 'https://cdn.example.org/final.xml');
  assert.equal(r.contentType, 'application/atom+xml');
  assert.equal(r.attempts, 1);
  assert.equal(s.calls.length, 3);
  const h = s.calls[0].init.headers;
  assert.equal(h['user-agent'], BROWSER_USER_AGENT);
  assert.equal(h.accept, ACCEPT);
  assert.equal(h['accept-language'], 'en-US,en;q=0.9');
  assert.equal(s.calls[0].init.redirect, 'manual');
  // too many hops
  const loop = {};
  for (let i = 0; i <= 6; i++) loop[`https://example.org/r${i}`] = [{ status: 302, headers: { location: `/r${i + 1}` } }];
  const http2 = createHttpClient({ fetchImpl: scripted(loop).fetchImpl, ...fakeClock() });
  await assert.rejects(http2.fetchText('https://example.org/r0'), (e) => e instanceof HttpError && e.status === 302 && /r5/.test(e.url));
});

test('retry plan: one retry after 2 s on 5xx, 429 (Retry-After capped at 30 s), network errors and github 404; none on 404 elsewhere, 403 or body cap', async () => {
  // 503 then 200
  let s = scripted({ [URL_A]: [{ status: 503, body: 'busy' }, { status: 200, body: 'ok' }] });
  let clock = fakeClock();
  let r = await createHttpClient({ fetchImpl: s.fetchImpl, ...clock }).fetchText(URL_A);
  assert.equal(r.text, 'ok');
  assert.equal(r.attempts, 2);
  assert.deepEqual(clock.sleeps, [2000]);
  // 429 with Retry-After 120 → capped at 30 s
  s = scripted({ [URL_A]: [{ status: 429, headers: { 'retry-after': '120' } }, { status: 200, body: 'ok' }] });
  clock = fakeClock();
  r = await createHttpClient({ fetchImpl: s.fetchImpl, ...clock }).fetchText(URL_A);
  assert.equal(r.attempts, 2);
  assert.deepEqual(clock.sleeps, [30_000]);
  // 429 with Retry-After 7 → 7 s
  s = scripted({ [URL_A]: [{ status: 429, headers: { 'retry-after': '7' } }, { status: 200, body: 'ok' }] });
  clock = fakeClock();
  await createHttpClient({ fetchImpl: s.fetchImpl, ...clock }).fetchText(URL_A);
  assert.deepEqual(clock.sleeps, [7000]);
  // network error then 200
  s = scripted({ [URL_A]: [{ throw: new TypeError('fetch failed', { cause: Object.assign(new Error('reset'), { code: 'ECONNRESET' }) }) }, { status: 200, body: 'ok' }] });
  clock = fakeClock();
  r = await createHttpClient({ fetchImpl: s.fetchImpl, ...clock }).fetchText(URL_A);
  assert.equal(r.attempts, 2);
  // github 404 is transient: retried once, the second answer wins
  s = scripted({ [GH]: [{ status: 404, body: 'Not Found' }, { status: 200, body: '<feed/>' }] });
  clock = fakeClock();
  r = await createHttpClient({ fetchImpl: s.fetchImpl, ...clock }).fetchText(GH);
  assert.equal(r.attempts, 2);
  assert.deepEqual(clock.sleeps.filter((ms) => ms === 2000), [2000]);
  // second failure is final and carries attempts = 2
  s = scripted({ [GH]: [{ status: 404 }, { status: 404 }] });
  await assert.rejects(createHttpClient({ fetchImpl: s.fetchImpl, ...fakeClock() }).fetchText(GH), (e) => e instanceof HttpError && e.status === 404 && e.attempts === 2);
  // 404 elsewhere, 403 and a TLS... no: TLS is a network error and IS retried; 403/404 are not
  for (const status of [404, 403, 401]) {
    s = scripted({ [URL_A]: [{ status, body: 'no' }] });
    await assert.rejects(createHttpClient({ fetchImpl: s.fetchImpl, ...fakeClock() }).fetchText(URL_A), (e) => e instanceof HttpError && e.status === status && e.attempts === 1);
  }
  s = scripted({ [URL_A]: [{ throw: tlsError() }, { throw: tlsError() }] });
  await assert.rejects(createHttpClient({ fetchImpl: s.fetchImpl, ...fakeClock() }).fetchText(URL_A), (e) => e.attempts === 2 && errorSummary(e) === 'tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE');
  // body cap: no retry
  s = scripted({ [URL_A]: [{ status: 200, body: 'x'.repeat(100) }] });
  await assert.rejects(createHttpClient({ fetchImpl: s.fetchImpl, ...fakeClock() }).fetchText(URL_A, { maxBytes: 50 }), (e) => e instanceof BodyTooLarge && e.attempts === 1);
  // no retry when the source deadline is too close
  s = scripted({ [URL_A]: [{ status: 503 }, { status: 200, body: 'late' }] });
  clock = fakeClock();
  await assert.rejects(createHttpClient({ fetchImpl: s.fetchImpl, ...clock }).fetchText(URL_A, { deadlineAt: clock.nowMs() + 4000 }), (e) => e instanceof HttpError && e.status === 503 && e.attempts === 1);
});

test('a hanging response times out (TimeoutError) and a past deadline fails without a request', async () => {
  const s = scripted({ [URL_A]: [{ hang: true }, { hang: true }] });
  const clock = fakeClock();
  const t0 = Date.now();
  await assert.rejects(createHttpClient({ fetchImpl: s.fetchImpl, ...clock }).fetchText(URL_A, { timeoutMs: 30 }), (e) => e instanceof TimeoutError && e.attempts === 2);
  assert.ok(Date.now() - t0 < 2000);
  assert.deepEqual(clock.sleeps, [2000], 'one backoff between the two timed-out attempts');
  const s2 = scripted({ [URL_A]: [] });
  const clock2 = fakeClock();
  await assert.rejects(createHttpClient({ fetchImpl: s2.fetchImpl, ...clock2 }).fetchText(URL_A, { deadlineAt: clock2.nowMs() - 1 }), (e) => e instanceof TimeoutError && e.attempts === 1);
  assert.equal(s2.calls.length, 0);
});

test('a 4xx carries server / cf-ray / content-type and a 300-char body snippet; the Cloudflare fixture classifies as blocked', async () => {
  const s = scripted({ [URL_A]: [{ status: 403, body: read('cloudflare-403.html'), headers: { server: 'cloudflare', 'cf-ray': '9b1f2c3d4e5f6a7b-BOM', 'content-type': 'text/html; charset=UTF-8' } }] });
  let err;
  try { await createHttpClient({ fetchImpl: s.fetchImpl, ...fakeClock() }).fetchText(URL_A); } catch (e) { err = e; }
  assert.ok(err instanceof HttpError);
  assert.equal(err.detail.server, 'cloudflare');
  assert.equal(err.detail.cfRay, '9b1f2c3d4e5f6a7b-BOM');
  assert.equal(err.detail.contentType, 'text/html; charset=UTF-8');
  assert.ok(err.detail.body.length <= 300);
  assert.match(err.detail.body, /Sorry, you have been blocked/);
  assert.ok(!/</.test(err.detail.body), 'tags stripped');
  assert.equal(errorSummary(err), 'blocked: 403 Cloudflare');
});

test('per-host pacing serialises requests to one host and keeps the gap; other hosts are not paced', async () => {
  const s = scripted({ [ARXIV]: [{ status: 200, body: 'a' }, { status: 200, body: 'b' }, { status: 200, body: 'c' }], [URL_A]: [{ status: 200, body: 'x' }, { status: 200, body: 'y' }] });
  const clock = fakeClock();
  const http = createHttpClient({ fetchImpl: s.fetchImpl, ...clock });
  await Promise.all([http.fetchText(ARXIV), http.fetchText(ARXIV), http.fetchText(ARXIV), http.fetchText(URL_A), http.fetchText(URL_A)]);
  assert.deepEqual(clock.sleeps, [3000, 3000], 'two gaps between three arXiv requests, none for example.org');
});
