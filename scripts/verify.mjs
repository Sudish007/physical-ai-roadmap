#!/usr/bin/env node
// npm run verify — the local and live acceptance tool (design "Verification plan").
//
//   node scripts/verify.mjs [--pages index,s12] [--all] [--widths 320,390] [--themes light,dark]
//                           [--report docs/verify-report.json] [--no-browser] [--no-external]
//                           [--shots <prefix>] [--live <url>]
//
// Local mode: serves dist/ on the first free port in 8790–8799 under /physical-ai-roadmap/, crawls every
// internal link and fragment of dist/, runs scripts/audit.py (Playwright, msedge) with the workspace venv
// Python, samples 40 external links, prints the data/meta.json per-source table, writes the report, kills
// the server and exits 1 on any threshold failure (2 when the Python is missing).
// --live <url>  audits a deployed site instead: no local server; the crawl fetches every page of the site
//               (seeded from dist's inventory plus index/404, following internal links) and HEADs every asset;
//               data/meta.json is read live with a cache-busting ?cb=<ts>. The ship command is
//               node scripts/verify.mjs --live https://sudish007.github.io/physical-ai-roadmap/ --shots docs/screenshots/live-
// --pages       pages that get every audit check (default: one of each page type)
// --all         adds the other pages (all 28) for the generic checks
// --shots       viewport-only PNGs <prefix><page>-<width>-<theme>.png for index, s12, plan, feed at
//               390×844, 1440×900, 1920×1080 and 2560×1440 @0.75 (→ 1920×1080) in both themes, plus s03 at 1920
//               light: 33 files, each checked against its expected pixel size and the 1920 px side limit
// --no-external skips the external-link sample (offline runs)
// External links never fail the run (403/anti-bot is reported, not failed); the meta table never fails the run
// unless data/meta.json cannot be read.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitSections } from '../src/build/parse.js';
import { createPlainMd } from '../src/build/md.js';
import { protocolTable } from '../src/build/feed-data.js';
import { BROWSER_USER_AGENT, ACCEPT_LANGUAGE, redactKey } from '../src/feed/http.js';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_PAGES = ['index', 's03', 's12', 's15', 'appendix-a', 'plan', 'feed'];
export const DEFAULT_WIDTHS = [320, 360, 390, 820, 1024, 1440, 1920, 2560];
export const DEFAULT_THEMES = ['light', 'dark'];
export const PORT_RANGE = Array.from({ length: 10 }, (_, i) => 8790 + i);
export const VENV_PYTHON = process.env.VERIFY_PYTHON || 'c:/Users/sudiskmr/Downloads/DomainClassification/.venv/Scripts/python.exe';
export const EXTERNAL_SAMPLE = 40;
export const EXTERNAL_TIMEOUT_MS = 10_000;
export const EXTERNAL_CONCURRENCY = 6;
export const STATUS_CLASSES = ['2xx', '3xx', '403', '404', '429', '5xx', 'timeout', 'other'];
const SITE_PREFIX = '/physical-ai-roadmap/';
const LIVE_FETCH_TIMEOUT_MS = 20_000;
/** Browser-like request headers for the live crawl and the external sample (same UA as the feed pipeline). */
export const REQUEST_HEADERS = Object.freeze({ 'user-agent': BROWSER_USER_AGENT, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'accept-language': ACCEPT_LANGUAGE });

export function parseArgs(argv) {
  const o = { pages: DEFAULT_PAGES.slice(), all: false, widths: DEFAULT_WIDTHS.slice(), themes: DEFAULT_THEMES.slice(), report: path.join('docs', 'verify-report.json'), browser: true, external: true, shots: '', live: '', help: false };
  const list = (v) => String(v).split(',').map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => { const v = argv[i + 1]; if (v === undefined || v.startsWith('--')) throw new Error(`${a} needs a value`); i++; return v; };
    if (a === '--all') o.all = true;
    else if (a === '--no-browser') o.browser = false;
    else if (a === '--no-external') o.external = false;
    else if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--pages') o.pages = list(next());
    else if (a === '--widths') o.widths = list(next()).map((w) => { const n = Number(w); if (!Number.isInteger(n) || n < 200) throw new Error(`bad width ${w}`); return n; });
    else if (a === '--themes') o.themes = list(next()).map((t) => { if (t !== 'light' && t !== 'dark') throw new Error(`bad theme ${t}`); return t; });
    else if (a === '--report') o.report = next();
    else if (a === '--shots') o.shots = next();
    else if (a === '--live') o.live = next();
    else if (a.startsWith('--pages=')) o.pages = list(a.slice(8));
    else throw new Error(`unknown flag ${a}`);
  }
  if (o.live && !/^https?:\/\//.test(o.live)) throw new Error(`--live needs an http(s) URL, got ${o.live}`);
  if (o.live && !o.live.endsWith('/')) o.live += '/';
  return o;
}

/** Every page name (file without .html) in dist. */
export function allPages(distDir) {
  return readdirSync(distDir).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)).sort();
}

function tryListen(port) {
  return new Promise((resolve) => {
    const s = createServer();
    s.once('error', () => resolve(false));
    s.listen(port, '127.0.0.1', () => s.close(() => resolve(true)));
  });
}

/** First port in `ports` that accepts a listen on 127.0.0.1, or null. */
export async function findFreePort(ports = PORT_RANGE) {
  for (const p of ports) if (await tryListen(p)) return p;
  return null;
}

const attrValues = (html, attr) => [...html.matchAll(new RegExp(`\\s${attr}="([^"]*)"`, 'g'))].map((m) => m[1]);

/**
 * Shared link analysis over a Map<file, html>: page files and fragments are resolved against the map, every
 * other internal target (assets, data) is returned in `assets` (target → first referrer) for the caller to
 * resolve against the file system or the live server; http(s) hrefs are collected in `external`.
 */
export function analyzePages(pages) {
  const ids = new Map([...pages].map(([f, h]) => [f, new Set(attrValues(h, 'id'))]));
  const broken = [];
  const assets = new Map();
  const external = new Set();
  let refs = 0;
  let styleAttrs = 0;
  let prevNext = 0;
  for (const [file, html] of pages) {
    styleAttrs += (html.match(/ style=/g) || []).length;
    const withoutBase = html.replace(/<base [^>]*>/, '');
    for (const ref of [...attrValues(withoutBase, 'href'), ...attrValues(withoutBase, 'src')]) {
      if (/^https?:/.test(ref)) { external.add(ref); continue; }
      if (/^mailto:/.test(ref)) continue;
      refs++;
      const [target, frag] = ref.split('#');
      const page = target === '' ? file : target;
      if (page.endsWith('.html')) {
        if (!pages.has(page)) { broken.push(`${file} → ${ref} (missing file)`); continue; }
        if (frag !== undefined && !ids.get(page).has(frag)) broken.push(`${file} → ${ref} (missing fragment)`);
      } else if (!assets.has(page)) {
        assets.set(page, `${file} → ${ref}`);
      }
    }
    prevNext += (html.match(/<link rel="(prev|next)" href="/g) || []).length;
  }
  return { refs, broken, styleAttrs, prevNext, assets, external: [...external].sort() };
}

/** Internal-link and fragment crawl of a built dist directory (mirrors tests/build-dist.test.js). */
export function crawl(distDir) {
  const files = new Set(readdirSync(distDir, { recursive: true }).map((f) => String(f).replace(/\\/g, '/')));
  const pages = new Map([...files].filter((f) => f.endsWith('.html') && !f.includes('/')).map((f) => [f, readFileSync(path.join(distDir, f), 'utf8')]));
  const a = analyzePages(pages);
  for (const [target, referrer] of a.assets) if (!files.has(target)) a.broken.push(`${referrer} (missing file)`);
  return { pages: pages.size, refs: a.refs, broken: a.broken, styleAttrs: a.styleAttrs, prevNext: a.prevNext, assets: a.assets.size, external: a.external };
}

function isTimeout(e) {
  return e && (e.name === 'TimeoutError' || e.name === 'AbortError' || (e.cause && (e.cause.name === 'TimeoutError' || e.cause.code === 'UND_ERR_CONNECT_TIMEOUT')));
}

function errorClass(e) {
  const cause = e && e.cause;
  const code = cause && (cause.code || (Array.isArray(cause.errors) && cause.errors[0] && cause.errors[0].code));
  return redactKey(code ? `network: ${code}` : `${e && e.name ? e.name : 'error'}: ${e && e.message ? e.message : ''}`).slice(0, 120);
}

/**
 * HEAD then GET fallback (manual redirects, browser-like headers, one timeout per attempt); never throws.
 * → { url, method, status, server, cfRay, location, headStatus, error, ms }
 */
export async function probeUrl(url, { timeoutMs = EXTERNAL_TIMEOUT_MS, fetchImpl = fetch } = {}) {
  const t0 = Date.now();
  const attempt = async (method) => {
    const res = await fetchImpl(url, { method, headers: REQUEST_HEADERS, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
    const out = { status: res.status, server: res.headers.get('server') || '', cfRay: Boolean(res.headers.get('cf-ray')), location: res.headers.get('location') || '' };
    try { if (res.body) await res.body.cancel(); } catch { /* the status is all we need */ }
    return out;
  };
  let headStatus = null;
  try {
    const head = await attempt('HEAD');
    if (head.status < 400) return { url, method: 'HEAD', ...head, headStatus: head.status, error: null, ms: Date.now() - t0 };
    headStatus = head.status;
  } catch (e) {
    if (isTimeout(e)) return { url, method: 'HEAD', status: null, server: '', cfRay: false, location: '', headStatus: null, error: 'timeout', ms: Date.now() - t0 };
  }
  try {
    const get = await attempt('GET');
    return { url, method: 'GET', ...get, headStatus, error: null, ms: Date.now() - t0 };
  } catch (e) {
    return { url, method: 'GET', status: null, server: '', cfRay: false, location: '', headStatus, error: isTimeout(e) ? 'timeout' : errorClass(e), ms: Date.now() - t0 };
  }
}

/** Status bucket of a probe result: 2xx | 3xx | 403 | 404 | 429 | 5xx | timeout | other. */
export function classifyStatus(r) {
  if (r.error === 'timeout') return 'timeout';
  const s = r.status;
  if (typeof s !== 'number') return 'other';
  if (s >= 200 && s < 300) return '2xx';
  if (s >= 300 && s < 400) return '3xx';
  if (s === 403) return '403';
  if (s === 404) return '404';
  if (s === 429) return '429';
  if (s >= 500) return '5xx';
  return 'other';
}

function probeNote(r, cls) {
  if (cls === '403') return /cloudflare/i.test(r.server) || r.cfRay ? 'anti-bot (Cloudflare)' : 'forbidden (anti-bot or access rule)';
  if (cls === '429') return 'rate limited';
  if (cls === '3xx') return r.location ? `redirects to ${r.location}`.slice(0, 160) : 'redirect';
  if (cls === 'other' && r.error) return r.error;
  return '';
}

/**
 * Deterministic sample of `n` links: distinct URLs grouped by host, hosts sorted; with >= n hosts every
 * k-th host (k = floor(hosts / n)) contributes its first URL; with fewer hosts the first URL of every host is
 * taken and the remaining slots are filled round-robin over the hosts' later URLs.
 */
export function sampleExternal(urls, n = EXTERNAL_SAMPLE) {
  const byHost = new Map();
  for (const u of new Set(urls)) {
    let host;
    try { host = new URL(u).hostname; } catch { continue; }
    if (!byHost.has(host)) byHost.set(host, []);
    byHost.get(host).push(u);
  }
  const hosts = [...byHost.keys()].sort();
  for (const h of hosts) byHost.get(h).sort();
  const picked = [];
  if (hosts.length >= n) {
    const k = Math.floor(hosts.length / n);
    for (let i = 0; i < n; i++) picked.push(byHost.get(hosts[i * k])[0]);
  } else {
    for (let round = 0; picked.length < n; round++) {
      let added = 0;
      for (const h of hosts) {
        const list = byHost.get(h);
        if (round < list.length && picked.length < n) { picked.push(list[round]); added++; }
      }
      if (!added) break;
    }
  }
  return { sample: picked, hosts: hosts.length, urls: [...byHost.values()].reduce((s, l) => s + l.length, 0) };
}

/** Probe the sampled links with a small worker pool; returns the report block (counts never fail the run). */
export async function probeExternal(urls, { n = EXTERNAL_SAMPLE, timeoutMs = EXTERNAL_TIMEOUT_MS, concurrency = EXTERNAL_CONCURRENCY, fetchImpl = fetch } = {}) {
  const { sample, hosts, urls: total } = sampleExternal(urls, n);
  const results = new Array(sample.length);
  let next = 0;
  const worker = async () => {
    while (next < sample.length) {
      const i = next++;
      results[i] = await probeUrl(sample[i], { timeoutMs, fetchImpl });
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, sample.length) }, worker));
  const counts = Object.fromEntries(STATUS_CLASSES.map((c) => [c, 0]));
  const links = results.map((r) => {
    const cls = classifyStatus(r);
    counts[cls]++;
    return { url: r.url, host: new URL(r.url).hostname, method: r.method, status: r.status, class: cls, headStatus: r.headStatus, ms: r.ms, note: probeNote(r, cls) };
  });
  const k = hosts >= n ? Math.floor(hosts / n) : 1;
  const rule = k > 1 ? `every ${ordinal(k)} distinct host (sorted), first URL each` : 'first URL of every host, then round-robin over the hosts';
  return { sampled: links.length, requested: n, distinctUrls: total, distinctHosts: hosts, rule: `${rule}; HEAD then GET, ${timeoutMs / 1000} s timeout, manual redirects`, timeoutMs, counts, links };
}

function ordinal(n) {
  const r = n % 100;
  return `${n}${r >= 11 && r <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;
}

export function formatExternal(ext) {
  const line = (l) => `  ${(l.status ?? l.class).toString().padEnd(7)} ${l.method.padEnd(4)} ${String(l.ms).padStart(5)} ms  ${l.url}${l.note ? `  — ${l.note}` : ''}`;
  const head = `external: ${ext.sampled} of ${ext.distinctUrls} links sampled from ${ext.distinctHosts} hosts · ${STATUS_CLASSES.map((c) => `${c} ${ext.counts[c]}`).join(' · ')}`;
  const notable = ext.links.filter((l) => l.class !== '2xx');
  return [head, ...notable.map(line)].join('\n');
}

/** One row per source of data/meta.json: id, class, status, newest (date), error or note. */
export function metaRows(meta) {
  return Object.entries((meta && meta.sources) || {}).map(([id, s]) => ({
    id,
    class: s.class || '',
    status: s.status || '',
    newest: s.newestAt ? String(s.newestAt).slice(0, 10) : '',
    errorOrNote: s.error || s.note || '',
  }));
}

export function formatMetaTable(rows) {
  const cols = [['id', 'id'], ['class', 'class'], ['status', 'status'], ['newest', 'newest'], ['errorOrNote', 'error / note']];
  const width = (key, label) => Math.max(label.length, ...rows.map((r) => String(r[key]).length));
  const w = Object.fromEntries(cols.map(([k, l]) => [k, k === 'errorOrNote' ? 0 : width(k, l)]));
  const fmt = (r) => cols.map(([k]) => (w[k] ? String(r[k]).padEnd(w[k]) : String(r[k]))).join('  ').trimEnd();
  return [fmt(Object.fromEntries(cols.map(([k, l]) => [k, l]))), ...rows.map(fmt)].join('\n');
}

async function fetchWithTimeout(url, init = {}, timeoutMs = LIVE_FETCH_TIMEOUT_MS) {
  return fetch(url, { headers: REQUEST_HEADERS, cache: 'no-store', ...init, signal: AbortSignal.timeout(timeoutMs) });
}

/** data/meta.json from the repo (local) or the live site with a cache-busting query → the report's `meta` block. */
export async function readMeta(live) {
  const source = live ? `${live}data/meta.json?cb=${Date.now()}` : 'data/meta.json';
  let meta;
  if (live) {
    const r = await fetchWithTimeout(source);
    if (r.status !== 200) throw new Error(`${source} answered HTTP ${r.status}`);
    meta = await r.json();
  } else {
    meta = JSON.parse(readFileSync(path.join(REPO, source), 'utf8'));
  }
  const rows = metaRows(meta);
  const counts = { ok: 0, empty: 0, failed: 0 };
  for (const r of rows) if (r.status in counts) counts[r.status]++;
  return { source, generatedAt: meta.generatedAt || null, runner: meta.runner || null, itemCount: meta.itemCount ?? null, sources: rows.length, counts, rows };
}

/**
 * Live crawl: fetch every page (dist's inventory plus index and 404, following internal .html links until
 * closure), resolve links and fragments like the local crawl, and HEAD/GET every distinct asset target.
 */
export async function crawlLive(base, seedNames) {
  const pages = new Map();
  const broken = [];
  const queue = [...new Set([...seedNames, 'index', '404'])].map((n) => `${n}.html`);
  const seen = new Set(queue);
  while (queue.length) {
    const file = queue.shift();
    try {
      const r = await fetchWithTimeout(`${base}${file}`);
      // GitHub Pages may answer a direct request for 404.html with its own 404 status while serving the page.
      if (r.status !== 200 && !(file === '404.html' && r.status === 404)) { broken.push(`${file} (HTTP ${r.status})`); continue; }
      const html = await r.text();
      pages.set(file, html);
      for (const ref of attrValues(html.replace(/<base [^>]*>/, ''), 'href')) {
        const target = ref.split('#')[0];
        if (!/^(https?:|mailto:)/.test(ref) && target.endsWith('.html') && !seen.has(target)) { seen.add(target); queue.push(target); }
      }
    } catch (e) {
      broken.push(`${file} (${isTimeout(e) ? 'timeout' : errorClass(e)})`);
    }
  }
  const a = analyzePages(pages);
  broken.push(...a.broken);
  for (const [target, referrer] of a.assets) {
    const r = await probeUrl(`${base}${target}`, { timeoutMs: LIVE_FETCH_TIMEOUT_MS });
    if (classifyStatus(r) !== '2xx') broken.push(`${referrer} (HTTP ${r.status ?? r.error})`);
  }
  return { pages: pages.size, refs: a.refs, broken, styleAttrs: a.styleAttrs, prevNext: a.prevNext, assets: a.assets.size, external: a.external, names: [...pages.keys()].map((f) => f.slice(0, -5)).sort() };
}

/**
 * OF-7 link-parity reference for audit.py: page name → number of http(s) markdown links in that section of
 * content/roadmap.md (s00 includes the front matter). The five relative dossier links render as text and
 * are not counted; tests/build-dist.test.js applies the same rule to the built HTML.
 */
export function linkCounts(markdown) {
  const { frontMatter, sections } = splitSections(markdown);
  const count = (md) => (md.match(/\]\(https?:\/\//g) || []).length;
  const out = {};
  for (const s of sections) out[s.slug] = count(s.body) + (s.slug === 's00' ? count(frontMatter.markdown) : 0);
  return out;
}

/** DR-5 reference for audit.py: every cell string (header and body) of the §17.1 table in content/roadmap.md. */
export function protocolCells(markdown) {
  const { sections } = splitSections(markdown);
  const table = protocolTable(sections, createPlainMd());
  const cells = new Set(table.headers);
  for (const row of table.rows) for (const c of row.cells) cells.add(c.text);
  return [...cells];
}

async function waitFor200(url, ms) {
  const deadline = Date.now() + ms;
  let last = '';
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (r.status === 200) return true;
      last = `HTTP ${r.status}`;
    } catch (e) {
      last = e.message;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`${url} did not answer 200 within ${ms} ms (${last})`);
}

function startServer(port) {
  const child = spawn(process.execPath, [path.join(REPO, 'scripts', 'serve.mjs')], { cwd: REPO, env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', () => {});
  child.stderr.on('data', (d) => process.stderr.write(`[serve] ${d}`));
  return child;
}

function runAudit(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(VENV_PYTHON, [path.join(REPO, 'scripts', 'audit.py'), ...args], { cwd: REPO, stdio: ['ignore', 'inherit', 'inherit'] });
    child.on('error', reject);
    child.on('exit', (code) => resolve(code));
  });
}

/** A --shots prefix resolved against the repo root; a trailing separator (directory prefix) is kept. */
export function resolveShotsPrefix(prefix) {
  if (!prefix) return '';
  const trailing = /[\\/]$/.test(prefix);
  const abs = path.resolve(REPO, prefix);
  return trailing ? abs + path.sep : abs;
}

/** Repo-relative, forward-slash path for the report. */
export function relToRepo(file) {
  return path.relative(REPO, path.resolve(REPO, file)).replace(/\\/g, '/');
}

/** Indented JSON, except the (long) audit check list, which is written one check per line. */
export function formatReport(report) {
  const checks = report.audit && Array.isArray(report.audit.checks) ? report.audit.checks : null;
  if (!checks) return JSON.stringify(report, null, 1);
  const marker = '__AUDIT_CHECKS__';
  const text = JSON.stringify({ ...report, audit: { ...report.audit, checks: marker } }, null, 1);
  return text.replace(`"${marker}"`, `[\n${checks.map((c) => `   ${JSON.stringify(c)}`).join(',\n')}\n  ]`);
}

/** The report's `summary` (design "Verification plan" / FEAT-007): thresholds as numbers, never impressions. */
export function buildSummary({ failures, elapsedSeconds, opts, audit, external, shots }) {
  const a = audit && audit.summary;
  const pick = (obj, keys) => (obj ? Object.fromEntries(keys.map((k) => [k, obj[String(k)] ?? null])) : null);
  return {
    pass: failures.length === 0,
    failures,
    elapsedSeconds,
    pagesAudited: a ? a.pagesAudited : 0,
    widths: opts.widths,
    themes: opts.themes,
    checks: a ? a.checkCount : 0,
    minContrast: a ? a.minContrast : null,
    minTextPx: a ? a.minFont : null,
    bodyPx: a ? pick(a.bodyFont, [390, 2560]) : null,
    contentRatio: a ? pick(a.contentRatio, [1920, 2560]) : null,
    externalLinks: external ? { sampled: external.sampled, counts: external.counts } : null,
    screenshots: shots.map((s) => relToRepo(s.file)),
  };
}

function usage() {
  console.log('usage: node scripts/verify.mjs [--pages a,b] [--all] [--widths ...] [--themes light,dark] [--report path] [--no-browser] [--no-external] [--shots prefix] [--live url]');
}

export async function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  if (opts.help) { usage(); return 0; }
  const distDir = path.join(REPO, 'dist');
  const haveDist = existsSync(path.join(distDir, 'index.html'));
  if (!haveDist && !opts.live) {
    console.error('dist/index.html is missing: run `npm run build` first');
    return 1;
  }
  const started = new Date();
  const inventory = haveDist ? allPages(distDir) : [];
  let extraPages = opts.all ? inventory.filter((p) => !opts.pages.includes(p)) : [];
  const report = {
    generatedAt: started.toISOString(),
    mode: opts.live ? 'live' : 'local',
    base: opts.live || null,
    pages: opts.pages,
    extraPages,
    widths: opts.widths,
    themes: opts.themes,
    crawl: null,
    audit: null,
    external: null,
    meta: null,
    summary: { pass: false, failures: [] },
  };
  const failures = [];

  // 1. Crawl: dist/ locally (file + fragment resolution, zero style attributes) or the live site page by page.
  const c = opts.live ? await crawlLive(opts.live, inventory) : crawl(distDir);
  const { external: externalHrefs, names: liveNames, ...crawlReport } = c;
  report.crawl = { ...crawlReport, externalHrefs: externalHrefs.length };
  if (c.broken.length) failures.push(`crawl: ${c.broken.length} broken internal reference(s): ${c.broken.slice(0, 5).join('; ')}`);
  if (c.styleAttrs) failures.push(`crawl: ${c.styleAttrs} style attribute(s) in the pages (DR-1)`);
  console.log(`crawl (${report.mode}): ${c.pages} pages · ${c.refs} internal refs · ${c.broken.length} broken · ${c.styleAttrs} style attrs · ${c.prevNext} prev/next links · ${c.assets} asset targets · ${externalHrefs.length} external hrefs`);
  if (opts.all && opts.live && liveNames) {
    // --all on a live site: the generic checks cover every page the crawl found, not only dist's inventory
    extraPages = liveNames.filter((p) => !opts.pages.includes(p));
    report.extraPages = extraPages;
  }
  if (opts.all && !extraPages.length) console.log('--all: no pages beyond --pages were found');

  // 2. External-link sample, started now and awaited after the browser audit (independent of it).
  const externalPromise = opts.external && externalHrefs.length ? probeExternal(externalHrefs).catch((e) => ({ error: errorClass(e) })) : null;

  // 3. Browser audit against the served (or live) site.
  let server = null;
  let exitCode = 0;
  const tmpReport = path.join(os.tmpdir(), `pair-audit-${process.pid}-${Date.now()}.json`);
  const tmpCells = path.join(os.tmpdir(), `pair-protocol-cells-${process.pid}-${Date.now()}.json`);
  try {
    if (opts.browser) {
      if (!existsSync(VENV_PYTHON)) {
        console.error(`browser audit skipped: Python with Playwright not found at ${VENV_PYTHON} (set VERIFY_PYTHON to override). The audit is mandatory before a commit.`);
        failures.push('audit: venv Python missing');
        exitCode = 2;
      } else {
        let base = opts.live;
        if (!base) {
          const port = await findFreePort();
          if (port === null) throw new Error(`no free port in ${PORT_RANGE[0]}–${PORT_RANGE.at(-1)}`);
          server = startServer(port);
          base = `http://127.0.0.1:${port}${SITE_PREFIX}`;
          await waitFor200(`${base}index.html`, 15000);
          console.log(`server: ${base} (pid ${server.pid})`);
        }
        report.base = base;
        const args = ['--base', base, '--pages', opts.pages.join(','), '--widths', opts.widths.join(','), '--themes', opts.themes.join(','), '--report', tmpReport];
        if (extraPages.length) args.push('--extra-pages', extraPages.join(','));
        const markdown = readFileSync(path.join(REPO, 'content', 'roadmap.md'), 'utf8');
        const links = linkCounts(markdown);
        args.push('--link-counts', Object.entries(links).map(([k, v]) => `${k}=${v}`).join(','));
        writeFileSync(tmpCells, JSON.stringify(protocolCells(markdown)), 'utf8');
        args.push('--protocol-cells', tmpCells);
        if (opts.shots) args.push('--shots', resolveShotsPrefix(opts.shots));
        const code = await runAudit(args);
        if (existsSync(tmpReport)) {
          report.audit = JSON.parse(readFileSync(tmpReport, 'utf8'));
          for (const f of report.audit.failures) failures.push(`audit: ${f.page} ${f.width} ${f.theme} ${f.name}`);
        }
        if (code !== 0 && !(report.audit && report.audit.failures.length)) failures.push(`audit: python exited ${code} without a report`);
        if (opts.shots && !(report.audit && Array.isArray(report.audit.shots) && report.audit.shots.length)) failures.push('shots: no screenshots were written');
      }
    }
  } finally {
    if (server) server.kill();
    rmSync(tmpReport, { force: true });
    rmSync(tmpCells, { force: true });
  }

  // 4. External links (report only; 403/anti-bot and every other status is counted, never failed).
  if (externalPromise) {
    report.external = await externalPromise;
    if (report.external.error) console.log(`external: sampling failed (${report.external.error})`);
    else console.log(formatExternal(report.external));
  } else {
    console.log(opts.external ? 'external: no http(s) links found' : 'external: skipped (--no-external)');
  }

  // 5. data/meta.json per-source table (local file or live with ?cb=<ts>).
  try {
    report.meta = await readMeta(opts.live);
    if (!report.meta.sources) failures.push(`meta: ${report.meta.source} lists no sources`);
    console.log(`meta: ${report.meta.source} · generated ${report.meta.generatedAt} · runner ${report.meta.runner} · items ${report.meta.itemCount} · ok ${report.meta.counts.ok} · empty ${report.meta.counts.empty} · failed ${report.meta.counts.failed}`);
    console.log(formatMetaTable(report.meta.rows));
  } catch (e) {
    failures.push(`meta: data/meta.json unreadable (${errorClass(e)})`);
    console.log(`meta: unreadable (${errorClass(e)})`);
  }

  const shots = (report.audit && Array.isArray(report.audit.shots) ? report.audit.shots : []);
  report.summary = buildSummary({ failures, elapsedSeconds: Math.round((Date.now() - started.getTime()) / 100) / 10, opts, audit: report.audit, external: report.external && !report.external.error ? report.external : null, shots });
  const reportPath = path.resolve(REPO, opts.report);
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, formatReport(report), 'utf8');
  const s = report.summary;
  console.log(`VERIFY ${s.pass ? 'PASS' : 'FAIL'} (${report.mode}) · pages ${opts.pages.length}${extraPages.length ? ` (+${extraPages.length})` : ''} audited ${s.pagesAudited} · widths ${opts.widths.join('/')} · themes ${opts.themes.join('/')} · checks ${s.checks} · minContrast ${JSON.stringify(s.minContrast)} · minTextPx ${s.minTextPx} · bodyPx ${JSON.stringify(s.bodyPx)} · contentRatio ${JSON.stringify(s.contentRatio)} · external ${s.externalLinks ? `${s.externalLinks.sampled} sampled ${JSON.stringify(s.externalLinks.counts)}` : 'skipped'} · screenshots ${s.screenshots.length}${opts.browser ? '' : ' · browser audit skipped (--no-browser)'} · failures ${failures.length} · report ${relToRepo(reportPath)} · ${s.elapsedSeconds}s`);
  for (const f of failures.slice(0, 40)) console.log(`  FAIL ${f}`);
  if (exitCode) return exitCode;
  return s.pass ? 0 : 1;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
if (invoked) {
  main().then((code) => { process.exitCode = code; }, (e) => { console.error(e.stack || e.message); process.exitCode = 1; });
}
