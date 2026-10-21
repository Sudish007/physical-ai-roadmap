#!/usr/bin/env node
// Tiny static server for local checks: serves dist/ under both / and /physical-ai-roadmap/.
// PORT (default 8790; 0 = ephemeral) and DIST_DIR (default <repo>/dist) come from the environment.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(process.env.DIST_DIR || path.join(REPO, 'dist'));
const portEnv = Number(process.env.PORT);
const PORT = Number.isInteger(portEnv) && portEnv >= 0 && portEnv <= 65535 ? portEnv : 8790;
const PREFIX = /^\/physical-ai-roadmap(?=\/|$)/;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function send(res, status, type, body, method) {
  res.writeHead(status, { 'Cache-Control': 'no-store', 'Content-Type': type, 'Content-Length': Buffer.byteLength(body) });
  if (method === 'HEAD') res.end(); else res.end(body);
}

async function notFound(res, method) {
  try {
    const file = path.join(ROOT, '404.html');
    const st = await stat(file);
    res.writeHead(404, { 'Cache-Control': 'no-store', 'Content-Type': MIME['.html'], 'Content-Length': st.size });
    if (method === 'HEAD') return res.end();
    return createReadStream(file).pipe(res);
  } catch {
    return send(res, 404, 'text/plain; charset=utf-8', 'not found', method);
  }
}

export const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return send(res, 405, 'text/plain; charset=utf-8', 'method not allowed', req.method);
  }
  let pathname;
  try {
    const rawPath = decodeURIComponent(String(req.url).split('?')[0]);
    if (rawPath.split(/[\\/]/).includes('..')) return notFound(res, req.method);
    pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  } catch {
    return send(res, 400, 'text/plain; charset=utf-8', 'bad request', req.method);
  }
  pathname = pathname.replace(PREFIX, '') || '/';
  let file = path.resolve(ROOT, `.${pathname}`);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return notFound(res, req.method);
  try {
    let st = await stat(file);
    if (st.isDirectory()) { file = path.join(file, 'index.html'); st = await stat(file); }
    const type = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
    res.writeHead(200, { 'Cache-Control': 'no-store', 'Content-Type': type, 'Content-Length': st.size });
    if (req.method === 'HEAD') return res.end();
    createReadStream(file).pipe(res);
  } catch {
    return notFound(res, req.method);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const port = server.address().port;
  console.log(`Physical AI Roadmap at http://127.0.0.1:${port}/ and http://127.0.0.1:${port}/physical-ai-roadmap/ (serving ${ROOT})`);
});
