#!/usr/bin/env node
// npm run verify — serves dist/ on the first free port in 8790–8799, crawls every internal link and
// fragment, runs scripts/audit.py (Playwright, msedge) with the workspace venv Python, writes
// docs/verify-report.json, kills the server, and exits 1 on any failure (2 when the Python is missing).
//
//   node scripts/verify.mjs [--pages index,s12] [--all] [--widths 320,390] [--themes light,dark]
//                           [--report docs/verify-report.json] [--no-browser] [--shots <prefix>] [--live <url>]
//
// --pages   pages that get every audit check (default: one of each page type)
// --all     adds the other pages (all 28) for the generic checks
// --shots   forwarded to audit.py: viewport-only PNGs <prefix><page>-<width>-<theme>.png
// --live    audit a deployed site instead of spawning the local server (crawl still runs on dist/)
// Extension points for FEAT-007: external-link sampling, the data/meta.json per-source table and the
// live crawl plug into main() where `report.external` / `report.meta` are set to null below.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_PAGES = ['index', 's03', 's12', 's15', 'appendix-a', 'plan', 'feed'];
export const DEFAULT_WIDTHS = [320, 360, 390, 820, 1024, 1440, 1920, 2560];
export const DEFAULT_THEMES = ['light', 'dark'];
export const PORT_RANGE = Array.from({ length: 10 }, (_, i) => 8790 + i);
export const VENV_PYTHON = process.env.VERIFY_PYTHON || 'c:/Users/sudiskmr/Downloads/DomainClassification/.venv/Scripts/python.exe';
const SITE_PREFIX = '/physical-ai-roadmap/';

export function parseArgs(argv) {
  const o = { pages: DEFAULT_PAGES.slice(), all: false, widths: DEFAULT_WIDTHS.slice(), themes: DEFAULT_THEMES.slice(), report: path.join('docs', 'verify-report.json'), browser: true, shots: '', live: '', help: false };
  const list = (v) => String(v).split(',').map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => { const v = argv[i + 1]; if (v === undefined || v.startsWith('--')) throw new Error(`${a} needs a value`); i++; return v; };
    if (a === '--all') o.all = true;
    else if (a === '--no-browser') o.browser = false;
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

/** Internal-link and fragment crawl of a built dist directory (mirrors tests/build-dist.test.js). */
export function crawl(distDir) {
  const files = new Set(readdirSync(distDir, { recursive: true }).map((f) => String(f).replace(/\\/g, '/')));
  const pages = new Map([...files].filter((f) => f.endsWith('.html') && !f.includes('/')).map((f) => [f, readFileSync(path.join(distDir, f), 'utf8')]));
  const ids = new Map([...pages].map(([f, h]) => [f, new Set(attrValues(h, 'id'))]));
  const broken = [];
  let refs = 0;
  let styleAttrs = 0;
  let prevNext = 0;
  for (const [file, html] of pages) {
    styleAttrs += (html.match(/ style=/g) || []).length;
    const withoutBase = html.replace(/<base [^>]*>/, '');
    for (const ref of [...attrValues(withoutBase, 'href'), ...attrValues(withoutBase, 'src')]) {
      if (/^(https?:|mailto:)/.test(ref)) continue;
      refs++;
      const [target, frag] = ref.split('#');
      const page = target === '' ? file : target;
      if (!files.has(page)) { broken.push(`${file} → ${ref} (missing file)`); continue; }
      if (frag !== undefined && page.endsWith('.html') && !ids.get(page).has(frag)) broken.push(`${file} → ${ref} (missing fragment)`);
    }
    prevNext += (html.match(/<link rel="(prev|next)" href="/g) || []).length;
  }
  return { pages: pages.size, refs, broken, styleAttrs, prevNext };
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

/** Indented JSON, except the (long) audit check list, which is written one check per line. */
export function formatReport(report) {
  const checks = report.audit && Array.isArray(report.audit.checks) ? report.audit.checks : null;
  if (!checks) return JSON.stringify(report, null, 1);
  const marker = '__AUDIT_CHECKS__';
  const text = JSON.stringify({ ...report, audit: { ...report.audit, checks: marker } }, null, 1);
  return text.replace(`"${marker}"`, `[\n${checks.map((c) => `   ${JSON.stringify(c)}`).join(',\n')}\n  ]`);
}

function usage() {
  console.log('usage: node scripts/verify.mjs [--pages a,b] [--all] [--widths ...] [--themes light,dark] [--report path] [--no-browser] [--shots prefix] [--live url]');
}

export async function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  if (opts.help) { usage(); return 0; }
  const distDir = path.join(REPO, 'dist');
  if (!existsSync(path.join(distDir, 'index.html'))) {
    console.error('dist/index.html is missing: run `npm run build` first');
    return 1;
  }
  const started = new Date();
  const extraPages = opts.all ? allPages(distDir).filter((p) => !opts.pages.includes(p)) : [];
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
    external: null, // FEAT-007: 40 sampled external links with status counts
    meta: null, // FEAT-007: data/meta.json per-source table
    summary: { pass: false, failures: [] },
  };
  const failures = [];

  // 1. Crawl the built pages (file + fragment resolution, zero style attributes).
  const c = crawl(distDir);
  report.crawl = c;
  if (c.broken.length) failures.push(`crawl: ${c.broken.length} broken internal reference(s): ${c.broken.slice(0, 5).join('; ')}`);
  if (c.styleAttrs) failures.push(`crawl: ${c.styleAttrs} style attribute(s) in dist/*.html (DR-1)`);
  console.log(`crawl: ${c.pages} pages · ${c.refs} internal refs · ${c.broken.length} broken · ${c.styleAttrs} style attrs · ${c.prevNext} prev/next links`);

  // 2. Browser audit against the served (or live) site.
  let server = null;
  let exitCode = 0;
  const tmpReport = path.join(os.tmpdir(), `pair-audit-${process.pid}-${Date.now()}.json`);
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
        if (opts.shots) args.push('--shots', opts.shots);
        const code = await runAudit(args);
        if (existsSync(tmpReport)) {
          report.audit = JSON.parse(readFileSync(tmpReport, 'utf8'));
          for (const f of report.audit.failures) failures.push(`audit: ${f.page} ${f.width} ${f.theme} ${f.name}`);
        }
        if (code !== 0 && !(report.audit && report.audit.failures.length)) failures.push(`audit: python exited ${code} without a report`);
      }
    }
  } finally {
    if (server) server.kill();
    rmSync(tmpReport, { force: true });
  }

  report.summary = { pass: failures.length === 0, failures, elapsedSeconds: Math.round((Date.now() - started.getTime()) / 100) / 10 };
  const reportPath = path.resolve(REPO, opts.report);
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, formatReport(report), 'utf8');
  const a = report.audit && report.audit.summary;
  console.log(`VERIFY ${report.summary.pass ? 'PASS' : 'FAIL'} · pages ${opts.pages.length}${extraPages.length ? ` (+${extraPages.length})` : ''} · widths ${opts.widths.join('/')} · themes ${opts.themes.join('/')}${a ? ` · checks ${a.checkCount} · minContrast ${JSON.stringify(a.minContrast)} · minFont ${a.minFont} · bodyFont ${JSON.stringify(a.bodyFont)} · contentRatio ${JSON.stringify(a.contentRatio)}` : opts.browser ? '' : ' · browser audit skipped (--no-browser)'} · failures ${failures.length} · report ${path.relative(REPO, reportPath)}`);
  for (const f of failures.slice(0, 40)) console.log(`  FAIL ${f}`);
  if (exitCode) return exitCode;
  return report.summary.pass ? 0 : 1;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
if (invoked) {
  main().then((code) => { process.exitCode = code; }, (e) => { console.error(e.stack || e.message); process.exitCode = 1; });
}
