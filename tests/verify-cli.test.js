import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, findFreePort, crawl, allPages, formatReport, DEFAULT_PAGES, DEFAULT_WIDTHS, DEFAULT_THEMES, PORT_RANGE } from '../scripts/verify.mjs';

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
    assert.deepEqual(allPages(dir), ['404', 'index', 's01']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the report keeps indented JSON but writes audit checks one per line', () => {
  const report = { pages: ['index'], audit: { summary: { pass: true }, checks: [{ name: 'noOverflow', pass: true, value: { a: 1 } }, { name: 'gutters', pass: false, value: 16 }] }, summary: { pass: false } };
  const text = formatReport(report);
  assert.deepEqual(JSON.parse(text), report, 'round-trips');
  assert.ok(text.includes('\n   {"name":"noOverflow","pass":true,"value":{"a":1}},\n   {"name":"gutters","pass":false,"value":16}\n  ]'));
  assert.ok(text.includes('\n "pages": [\n  "index"\n ],'));
  assert.equal(formatReport({ audit: null, summary: {} }), JSON.stringify({ audit: null, summary: {} }, null, 1));
});
