#!/usr/bin/env node
// npm run fetch — runs the §17 pipeline (src/feed/pipeline.js) and prints the per-source table.
//
//   node scripts/fetch.mjs [--data-dir <dir>] [--dry-run] [--now <ISO>] [--source id1,id2]
//
// --data-dir  where feed.json and meta.json are read and written (default: data)
// --dry-run   fetch and print, write nothing
// --now       the run's clock (window end, generatedAt); default: the real clock
// --source    diagnostic subset of registry ids; requires --dry-run (a partial run never writes data)
// Exit 0 even when sources fail (health is data); 1 when the registry cannot load, writing fails, every source failed,
// or the flags are invalid.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../src/feed/pipeline.js';
import { sources } from '../sources.config.mjs';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function parseArgs(argv) {
  const o = { dataDir: path.join(REPO, 'data'), dryRun: false, now: undefined, onlySourceIds: null };
  const list = (v) => String(v).split(',').map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => { const v = argv[i + 1]; if (v === undefined || v.startsWith('--')) throw new Error(`${a} needs a value`); i++; return v; };
    if (a === '--dry-run') o.dryRun = true;
    else if (a === '--data-dir') o.dataDir = path.resolve(next());
    else if (a.startsWith('--data-dir=')) o.dataDir = path.resolve(a.slice(11));
    else if (a === '--now') o.now = next();
    else if (a.startsWith('--now=')) o.now = a.slice(6);
    else if (a === '--source') o.onlySourceIds = list(next());
    else if (a.startsWith('--source=')) o.onlySourceIds = list(a.slice(9));
    else throw new Error(`unknown argument ${a}`);
  }
  if (o.onlySourceIds && !o.dryRun) throw new Error('--source selects a diagnostic subset and requires --dry-run (a partial run never writes data)');
  if (o.now !== undefined) {
    const d = new Date(o.now);
    if (!Number.isFinite(d.getTime())) throw new Error(`--now must be an ISO timestamp, got "${o.now}"`);
    o.now = d;
  }
  return o;
}

const pad = (s, n) => String(s === null || s === undefined ? '' : s).padEnd(n);

/** The Ahead-style per-source table plus the summary line. Errors are already redacted (errorSummary/formatDetail). */
export function formatTable(result) {
  const rows = result.sourceResults;
  const w = Math.max(6, ...rows.map((r) => r.id.length));
  const lines = [`${pad('id', w)} | status | fetched | kept | ms    | http | newest     | note/error`];
  for (const r of rows) {
    const tail = r.status === 'failed' ? `${r.error}${r.note ? ` · ${r.note}` : ''}` : (r.note || '');
    lines.push(`${pad(r.id, w)} | ${pad(r.status, 6)} | ${pad(r.kind === 'reachability' ? '—' : r.fetched, 7)} | ${pad(r.kind === 'reachability' ? '—' : r.kept, 4)} | ${pad(r.ms, 5)} | ${pad(r.httpStatus ?? '—', 4)} | ${pad(r.newestAt ? r.newestAt.slice(0, 10) : '—', 10)} | ${tail}`);
  }
  for (const r of rows) if (r.detail) lines.push(`  ${r.id}: ${r.detail}`);
  const count = (s) => rows.filter((r) => r.status === s).length;
  lines.push(`ok ${count('ok')} · empty ${count('empty')} · failed ${count('failed')} · items ${result.feed.items.length} · new ${result.meta.newItemCount} · ${result.written ? `written to ${result.dataDir}` : 'nothing written (dry run or all failed)'}`);
  return lines.join('\n');
}

export async function main(argv = process.argv.slice(2)) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    console.error(err.message);
    return 1;
  }
  try {
    const result = await run({ sources, now: opts.now, dataDir: opts.dataDir, dryRun: opts.dryRun, onlySourceIds: opts.onlySourceIds });
    console.log(formatTable(result));
    for (const w of result.warnings) console.log(`::warning::${w}`);
    return result.exitCode;
  } catch (err) {
    console.error(err && err.stack ? err.stack : String(err));
    return 1;
  }
}

const invoked = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
if (invoked) {
  main().then((code) => { process.exitCode = code; }, (e) => { console.error(e.stack || e.message); process.exitCode = 1; });
}
