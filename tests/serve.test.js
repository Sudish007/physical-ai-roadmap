import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVE = path.join(ROOT, 'scripts', 'serve.mjs');

let dir, child, base;

before(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'pair-serve-'));
  writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>home</title>');
  writeFileSync(path.join(dir, 's12.html'), '<!doctype html><title>s12</title>');
  writeFileSync(path.join(dir, '404.html'), '<!doctype html><title>missing</title>');
  mkdirSync(path.join(dir, 'assets'));
  writeFileSync(path.join(dir, 'assets', 'app.css'), 'body{}');
  mkdirSync(path.join(dir, 'data'));
  writeFileSync(path.join(dir, 'data', 'feed.json'), '{"items":[]}');
  child = spawn(process.execPath, [SERVE], { env: { ...process.env, PORT: '0', DIST_DIR: dir }, stdio: ['ignore', 'pipe', 'pipe'] });
  base = await new Promise((resolve, reject) => {
    let out = '';
    const timer = setTimeout(() => reject(new Error(`server did not start: ${out}`)), 10000);
    child.stdout.on('data', (d) => {
      out += d;
      const m = /http:\/\/127\.0\.0\.1:(\d+)\//.exec(out);
      if (m) { clearTimeout(timer); resolve(`http://127.0.0.1:${m[1]}`); }
    });
    child.stderr.on('data', (d) => { out += d; });
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`server exited ${code}: ${out}`)); });
  });
});

after(() => {
  if (child) child.kill();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

test('serves index.html at / and under /physical-ai-roadmap/ with no-store and the right MIME types', async () => {
  for (const p of ['/', '/index.html', '/physical-ai-roadmap/', '/physical-ai-roadmap/index.html', '/physical-ai-roadmap']) {
    const r = await fetch(base + p);
    assert.equal(r.status, 200, p);
    assert.equal(r.headers.get('cache-control'), 'no-store');
    assert.equal(r.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.equal(await r.text(), '<!doctype html><title>home</title>');
  }
  assert.equal((await fetch(`${base}/physical-ai-roadmap/s12.html`)).status, 200);
  assert.equal((await fetch(`${base}/assets/app.css`)).headers.get('content-type'), 'text/css; charset=utf-8');
  assert.equal((await fetch(`${base}/physical-ai-roadmap/data/feed.json`)).headers.get('content-type'), 'application/json; charset=utf-8');
});

test('unknown paths and traversal attempts answer 404 (with 404.html when present); HEAD works; other methods 405', async () => {
  const missing = await fetch(`${base}/nope.html`);
  assert.equal(missing.status, 404);
  assert.equal(await missing.text(), '<!doctype html><title>missing</title>');
  for (const p of ['/../package.json', '/physical-ai-roadmap/../../package.json', '/%2e%2e/package.json', '/assets/..%2f..%2fpackage.json']) {
    const r = await fetch(base + p);
    assert.equal(r.status, 404, p);
  }
  const head = await fetch(`${base}/s12.html`, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('content-length'), String(Buffer.byteLength('<!doctype html><title>s12</title>')));
  assert.equal((await head.text()).length, 0);
  const post = await fetch(`${base}/index.html`, { method: 'POST', body: 'x' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
});
