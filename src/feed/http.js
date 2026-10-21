// Fetch pipeline HTTP client (design "Feed · HTTP"): browser-like headers, manual redirects (≤5 hops),
// per-host timeouts, one retry with backoff, a body cap, per-host pacing, and error classes whose
// messages are redacted before they can reach a log line or meta.json. Everything time- or network-
// related is injectable (fetchImpl, sleep, nowMs) so tests run on fixtures without a clock.

export const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36';
export const ACCEPT = 'application/atom+xml, application/rss+xml, application/xml;q=0.9, text/html;q=0.8, */*;q=0.7';
export const ACCEPT_LANGUAGE = 'en-US,en;q=0.9';
/** Minimum gap between requests to one host (ms). arXiv asks for 3 s; github.com answers 404 transiently when hammered. */
export const PACING = Object.freeze({ 'export.arxiv.org': 3000, 'github.com': 1000 });
/** Per-host timeout (ms); every other host gets DEFAULT_TIMEOUT_MS. */
export const HOST_TIMEOUT_MS = Object.freeze({ 'export.arxiv.org': 15_000 });
export const DEFAULT_TIMEOUT_MS = 20_000;
export const DEFAULT_MAX_BYTES = 8_000_000;
export const MAX_REDIRECTS = 5;
export const RETRY_BACKOFF_MS = 2000;
export const RETRY_AFTER_CAP_MS = 30_000;
/** A retry is skipped when less than this remains before the source deadline. */
export const RETRY_MIN_REMAINING_MS = 5000;
/** Hosts whose 404 is treated as transient (GitHub's releases.atom). */
export const RETRY_404_HOSTS = new Set(['github.com']);
export const SUMMARY_MAX = 120;
const SNIPPET_BYTES = 4096;
const DETAIL_BODY_CHARS = 300;
const TLS_CODE_RE = /CERT|TLS|SSL|LEAF_SIGNATURE|SELF_SIGNED|ISSUER|HANDSHAKE/i;

/**
 * Replace the value of any `…key=` query parameter (key, api_key, apikey, x-api-key …) and of any
 * `Authorization: <value>` header text. Applied to every message, URL and detail BEFORE slicing, so a
 * truncation can never leave part of a secret behind. No secrets exist in v1; the function exists so a
 * later env-gated source cannot leak one.
 */
export function redactKey(text) {
  return String(text)
    .replace(/([A-Za-z0-9_-]*key=)[^&\s"'<>]*/gi, '$1REDACTED')
    .replace(/(\bauthorization\s*[:=]\s*)(?:[A-Za-z]+\s+)?[^\s,;"'<>]+/gi, '$1REDACTED');
}

function redactDetail(detail) {
  if (!detail || typeof detail !== 'object') return detail;
  const out = {};
  for (const [k, v] of Object.entries(detail)) out[k] = typeof v === 'string' ? redactKey(v) : v;
  return out;
}

export class HttpError extends Error {
  /** @param detail { server, cfRay, cfMitigated, contentType, location, body } (each ≤ 300 chars, redacted) */
  constructor(status, url, detail, retryAfterMs) {
    super(`HTTP ${status} for ${redactKey(url)}`);
    this.name = 'HttpError';
    this.status = status;
    this.url = redactKey(url);
    this.detail = redactDetail(detail) || {};
    if (retryAfterMs !== undefined) this.retryAfterMs = retryAfterMs;
  }
}
export class TimeoutError extends Error {
  constructor(url) { super(`timeout for ${redactKey(url)}`); this.name = 'TimeoutError'; }
}
export class BodyTooLarge extends Error {
  constructor(url, maxBytes) { super(`body exceeds ${maxBytes} bytes for ${redactKey(url)}`); this.name = 'BodyTooLarge'; this.maxBytes = maxBytes; }
}
export class ParseError extends Error {
  constructor(kind, message) { super(`parse error: ${kind}${message ? ` (${redactKey(message)})` : ''}`); this.name = 'ParseError'; this.kind = kind; }
}
export class WallClockError extends Error {
  constructor(message = 'wall clock') { super(message); this.name = 'WallClockError'; }
}

function tlsCode(err) {
  for (const e of [err, err && err.cause]) {
    const code = e && typeof e.code === 'string' ? e.code : '';
    if (code && TLS_CODE_RE.test(code)) return code;
  }
  return null;
}

function networkCode(err) {
  for (const e of [err, err && err.cause]) {
    if (e && typeof e.code === 'string' && e.code) return e.code;
  }
  return null;
}

/**
 * The ≤120-char error class recorded in meta.json and shown as "Unavailable since <date> · <class>":
 * 'HTTP 403' · 'blocked: 403 Cloudflare' · 'timeout' · 'tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE' ·
 * 'parse error: xml' · 'body too large' · 'network' (with the error code when there is one).
 */
export function errorSummary(err) {
  let s;
  if (err instanceof HttpError) {
    const d = err.detail || {};
    s = err.status === 403 && (/cloudflare/i.test(d.server || '') || d.cfRay || d.cfMitigated) ? 'blocked: 403 Cloudflare' : `HTTP ${err.status}`;
  } else if (err instanceof TimeoutError || (err && err.name === 'AbortError')) {
    s = 'timeout';
  } else if (err instanceof BodyTooLarge) {
    s = 'body too large';
  } else if (err instanceof ParseError) {
    s = `parse error: ${err.kind}`;
  } else if (err instanceof WallClockError) {
    s = err.message;
  } else {
    const tls = tlsCode(err);
    if (tls) s = `tls: ${tls}`;
    else {
      const code = networkCode(err);
      s = code ? `network: ${code}` : 'network';
    }
  }
  return redactKey(s).slice(0, SUMMARY_MAX);
}

/** One-line `key=value; …` rendering of an HttpError detail for the CLI table ('' when there is nothing). Redacted. */
export function formatDetail(detail) {
  if (!detail || typeof detail !== 'object') return '';
  const parts = [];
  for (const [key, raw] of Object.entries(detail)) {
    if (raw === undefined || raw === null || raw === '') continue;
    // eslint-disable-next-line no-control-regex
    const value = redactKey(raw).replace(/[\x00-\x1f\x7f]/g, '');
    if (!value) continue;
    parts.push(key === 'body' ? `body="${value}"` : `${key}=${value}`);
  }
  return parts.join('; ').slice(0, 400);
}

export function defaultSleep(ms) {
  let timer;
  const p = new Promise((resolve) => { timer = setTimeout(resolve, Math.max(0, ms)); });
  p.cancel = () => clearTimeout(timer);
  return p;
}

function parseRetryAfter(value, nowMs) {
  if (!value) return undefined;
  const secs = Number(value);
  if (Number.isFinite(secs) && secs >= 0) return secs * 1000;
  const at = Date.parse(value);
  return Number.isFinite(at) ? Math.max(0, at - nowMs) : undefined;
}

function header(res, name) {
  try { const v = res.headers && typeof res.headers.get === 'function' ? res.headers.get(name) : null; return v === null || v === undefined ? '' : String(v); } catch { return ''; }
}

/** First `maxBytes` of a response body as text; '' on any error. Never leaves the stream open. */
async function readSnippet(res, maxBytes = SNIPPET_BYTES) {
  try {
    if (!res.body || typeof res.body.getReader !== 'function') return typeof res.text === 'function' ? (await res.text()).slice(0, maxBytes) : '';
    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value.buffer, value.byteOffset, value.byteLength));
      total += value.byteLength;
    }
    try { await reader.cancel(); } catch { /* ignore */ }
    return new TextDecoder('utf-8').decode(Buffer.concat(chunks).subarray(0, maxBytes));
  } catch {
    return '';
  }
}

export function hostOf(url) {
  try { return new URL(url).hostname; } catch { return ''; }
}

export function timeoutFor(url) {
  return HOST_TIMEOUT_MS[hostOf(url)] || DEFAULT_TIMEOUT_MS;
}

/**
 * @param {{ fetchImpl?: typeof fetch, sleep?: (ms: number) => Promise & { cancel? }, nowMs?: () => number }} deps
 * @returns {{ fetchText(url, opts): Promise<{ status, text, finalUrl, contentType, attempts }> }}
 */
export function createHttpClient({ fetchImpl = globalThis.fetch, sleep = defaultSleep, nowMs = Date.now } = {}) {
  const chains = new Map();
  const lastAt = new Map();

  /** Serialise requests per paced host and keep PACING[host] ms between their starts. */
  async function paced(host, fn) {
    const gap = PACING[host];
    if (!gap) return fn();
    const prev = chains.get(host) || Promise.resolve();
    let release;
    const gate = new Promise((r) => { release = r; });
    chains.set(host, prev.then(() => gate));
    await prev;
    try {
      const last = lastAt.get(host);
      if (last !== undefined) {
        const wait = last + gap - nowMs();
        if (wait > 0) await sleep(wait);
      }
      lastAt.set(host, nowMs());
    } finally {
      release();
    }
    return fn();
  }

  function headersFor() {
    return { 'user-agent': BROWSER_USER_AGENT, accept: ACCEPT, 'accept-language': ACCEPT_LANGUAGE };
  }

  async function readBody(res, url, maxBytes, controller) {
    if (res.body && typeof res.body.getReader === 'function') {
      const reader = res.body.getReader();
      const chunks = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
          controller.abort();
          try { await reader.cancel(); } catch { /* ignore */ }
          throw new BodyTooLarge(url, maxBytes);
        }
        chunks.push(Buffer.from(value.buffer, value.byteOffset, value.byteLength));
      }
      return new TextDecoder('utf-8').decode(Buffer.concat(chunks));
    }
    const text = await res.text();
    if (Buffer.byteLength(text) > maxBytes) throw new BodyTooLarge(url, maxBytes);
    return text;
  }

  async function once(url, { timeoutMs, maxBytes, deadlineAt }) {
    const startedAt = nowMs();
    if (deadlineAt !== undefined && deadlineAt <= startedAt) throw new TimeoutError(url);
    let budget = timeoutMs;
    if (deadlineAt !== undefined) budget = Math.min(budget, deadlineAt - startedAt);
    // The timeout is a real timer (not the injectable `sleep`, which only paces and backs off), so a test clock
    // that skips waits cannot fire it; tests pass a small timeoutMs instead.
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, budget);
    try {
      let current = url;
      for (let hop = 0; ; hop++) {
        let res;
        try {
          res = await fetchImpl(current, { method: 'GET', headers: headersFor(), redirect: 'manual', signal: controller.signal });
        } catch (err) {
          if (timedOut || controller.signal.aborted) throw new TimeoutError(url);
          throw err;
        }
        const status = res.status;
        if ([301, 302, 303, 307, 308].includes(status)) {
          const location = header(res, 'location');
          try { if (res.body && typeof res.body.cancel === 'function') await res.body.cancel(); } catch { /* ignore */ }
          if (!location || hop >= MAX_REDIRECTS) throw new HttpError(status, current, { location: location.slice(0, 300), server: header(res, 'server').slice(0, 80) });
          current = new URL(location, current).href;
          continue;
        }
        if (status >= 400) {
          // Evidence of what the server said: selected headers and a 300-char text snippet (block pages, challenge markers)
          const detail = {};
          for (const [key, name] of [['server', 'server'], ['cfRay', 'cf-ray'], ['cfMitigated', 'cf-mitigated'], ['contentType', 'content-type'], ['location', 'location']]) {
            const v = header(res, name);
            if (v) detail[key] = v.slice(0, 80);
          }
          const body = (await readSnippet(res)).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, DETAIL_BODY_CHARS);
          if (body) detail.body = body;
          throw new HttpError(status, current, detail, parseRetryAfter(header(res, 'retry-after'), nowMs()));
        }
        let text;
        try {
          text = await readBody(res, current, maxBytes, controller);
        } catch (err) {
          if (err instanceof BodyTooLarge) throw err;
          if (timedOut || controller.signal.aborted) throw new TimeoutError(url);
          throw err;
        }
        return { status, text, finalUrl: res.url || current, contentType: header(res, 'content-type') };
      }
    } finally {
      clearTimeout(timer);
    }
  }

  /** One retry after RETRY_BACKOFF_MS on network errors, timeouts, 429 (Retry-After ≤ 30 s), 5xx and github.com 404. */
  function retryable(err, host) {
    if (err instanceof BodyTooLarge) return false;
    if (err instanceof HttpError) return err.status >= 500 || err.status === 429 || (err.status === 404 && RETRY_404_HOSTS.has(host));
    return true; // network errors, TLS errors and timeouts
  }

  /**
   * @param {string} url
   * @param {{ timeoutMs?: number, maxBytes?: number, deadlineAt?: number }} opts
   *   deadlineAt is an absolute nowMs() value (the source's 45 s backstop); the timeout never exceeds it.
   */
  async function fetchText(url, { timeoutMs = timeoutFor(url), maxBytes = DEFAULT_MAX_BYTES, deadlineAt } = {}) {
    const host = hostOf(url);
    const opts = { timeoutMs, maxBytes, deadlineAt };
    let attempts = 0;
    for (;;) {
      try {
        attempts++;
        const r = await paced(host, () => once(url, opts));
        r.attempts = attempts;
        return r;
      } catch (err) {
        if (attempts > 1 || !retryable(err, host)) { err.attempts = attempts; throw err; }
        let wait = RETRY_BACKOFF_MS;
        if (err instanceof HttpError && err.status === 429 && err.retryAfterMs !== undefined) wait = Math.min(err.retryAfterMs, RETRY_AFTER_CAP_MS);
        if (deadlineAt !== undefined && deadlineAt - nowMs() - wait < RETRY_MIN_REMAINING_MS) { err.attempts = attempts; throw err; }
        await sleep(wait);
      }
    }
  }

  return { fetchText };
}
