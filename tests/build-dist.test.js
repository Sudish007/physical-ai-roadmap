import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeSite } from '../src/build/write.js';
import { splitSections } from '../src/build/parse.js';
import { SECTION_FILES } from '../src/build/content-map.mjs';
import { sources } from '../sources.config.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = readFileSync(path.join(ROOT, 'content', 'roadmap.md'), 'utf8');

let tmp, out, result, pages;

before(async () => {
  tmp = mkdtempSync(path.join(os.tmpdir(), 'pair-dist-'));
  out = path.join(tmp, 'dist');
  result = await writeSite({ out });
  pages = new Map(readdirSync(out).filter((f) => f.endsWith('.html')).map((f) => [f, readFileSync(path.join(out, f), 'utf8')]));
});

after(() => { if (tmp) rmSync(tmp, { recursive: true, force: true }); });

const attrValues = (html, attr) => [...html.matchAll(new RegExp(`\\s${attr}="([^"]*)"`, 'g'))].map((m) => m[1]);

test('the summary line reports the expected numbers and every expected file exists', () => {
  assert.match(result.summary, /^pages 28 · h3 89 · chips 127 · crossrefs 113 rewritten \/ 5 skipped · manifest 7\/10\/36\/12\/14\/26\/9\/24\/24\/8 · search \d+ records · bytes \d+$/);
  assert.equal(pages.size, 28);
  for (const s of SECTION_FILES) assert.ok(pages.has(s.file), s.file);
  for (const f of ['index.html', 'plan.html', 'feed.html', '404.html', 'search-index.json', 'tracker-manifest.json', 'plan-data.json', '.nojekyll', 'favicon.svg', 'assets/app.css', 'assets/app.js', 'data/feed.json', 'data/meta.json']) {
    assert.ok(existsSync(path.join(out, f)), f);
  }
  assert.ok(!existsSync(`${out}.tmp`), 'the tmp dir was swapped away');
  assert.ok(statSync(path.join(out, 'search-index.json')).size <= 500 * 1024);
  assert.equal(readFileSync(path.join(out, 'assets', 'app.css'), 'utf8'), readFileSync(path.join(ROOT, 'assets', 'app.css'), 'utf8'));
  // data/*.json are copied byte-for-byte; since FEAT-005 they carry a real local run (plan Decision 26)
  for (const f of ['feed.json', 'meta.json']) assert.equal(readFileSync(path.join(out, 'data', f), 'utf8'), readFileSync(path.join(ROOT, 'data', f), 'utf8'), f);
  const feed = JSON.parse(readFileSync(path.join(out, 'data', 'feed.json'), 'utf8'));
  assert.match(feed.generatedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  assert.equal(feed.windowDays, 30);
  assert.ok(Array.isArray(feed.items) && feed.items.length > 0, 'real items from the local proof run');
  const meta = JSON.parse(readFileSync(path.join(out, 'data', 'meta.json'), 'utf8'));
  assert.match(meta.runner, /^(local|github-actions)$/, 'data written by a local run or by the workflow (FEED_RUNNER)');
  // every registry source has a health row; rows of a source removed from the registry (plan Decision 8) may linger
  // until the next fetch rewrites meta.json, so the count is >=, not ==, the registry size
  for (const s of sources) assert.ok(meta.sources[s.id], `meta.sources lacks ${s.id}`);
  assert.ok(Object.keys(meta.sources).length >= sources.length);
  assert.equal(meta.itemCount, feed.items.length);
  assert.deepEqual(result.site.stats.crossrefs.skipped.map((s) => s.ref).sort(), ['§2', '§4', '§43', '§43', '§5']);
  assert.deepEqual(result.site.stats.warnings, []);
});

test('DR-1 / DR-3: zero style attributes and zero color-scheme metas in every page; light first paint markup', () => {
  for (const [file, html] of pages) {
    assert.equal((html.match(/ style=/g) || []).length, 0, `${file} has a style attribute`);
    assert.equal((html.match(/<meta name="color-scheme"/g) || []).length, 0, `${file} has a color-scheme meta`);
    assert.ok(html.startsWith('<!doctype html>\n<html lang="en" data-theme="light">'), file);
    assert.equal((html.match(/<script>/g) || []).length, 1, `${file}: exactly one inline script (the theme bootstrap)`);
    assert.equal((html.match(/<base /g) || []).length, file === '404.html' ? 1 : 0, `${file} base element`);
    assert.ok(!/hand-coded|zero build step|view source|AI-powered/i.test(html), `${file} has a self-referential blurb`);
  }
});

test('every internal href and fragment resolves; ids are unique per page', () => {
  const ids = new Map([...pages].map(([f, h]) => [f, attrValues(h, 'id')]));
  for (const [file, list] of ids) {
    const dup = list.filter((id, i) => list.indexOf(id) !== i);
    assert.deepEqual(dup, [], `${file} duplicate ids`);
  }
  const files = new Set(readdirSync(out, { recursive: true }).map((f) => String(f).replace(/\\/g, '/')));
  let checked = 0;
  const broken = [];
  for (const [file, html] of pages) {
    const withoutBase = html.replace(/<base [^>]*>/, '');
    const refs = [...attrValues(withoutBase, 'href'), ...attrValues(withoutBase, 'src')];
    for (const ref of refs) {
      if (/^(https?:|mailto:)/.test(ref)) continue;
      checked++;
      const [target, frag] = ref.split('#');
      const page = target === '' ? file : target;
      if (!files.has(page)) { broken.push(`${file} → ${ref} (missing file)`); continue; }
      if (frag !== undefined && page.endsWith('.html') && !ids.get(page).includes(frag)) broken.push(`${file} → ${ref} (missing fragment)`);
    }
  }
  assert.deepEqual(broken, []);
  assert.ok(checked > 1500, `checked ${checked} internal references`);
  for (const [file, html] of pages) {
    if (!/^s\d\d|^appendix/.test(file)) continue;
    const prev = /<link rel="prev" href="([^"]+)">/.exec(html);
    const next = /<link rel="next" href="([^"]+)">/.exec(html);
    if (file !== 's00.html') assert.ok(prev && pages.has(prev[1]), `${file} prev`);
    if (file !== 'appendix-d.html') assert.ok(next && pages.has(next[1]), `${file} next`);
  }
});

test('D6: 127 content chips, link parity per section, the five unpublished links, legend on all 24 pages', () => {
  const { sections } = splitSections(content);
  let chips = 0;
  let notPublished = 0;
  for (const s of sections) {
    const html = pages.get(s.file);
    const prose = html.slice(html.indexOf('<div class="prose">'), html.indexOf('<nav class="prevnext"'));
    assert.ok(prose.length > 500, `${s.file} prose`);
    chips += (prose.match(/<span class="chip /g) || []).length;
    notPublished += (prose.match(/ \(not published\)/g) || []).length;
    const rendered = (prose.match(/<a href="http/g) || []).length;
    const inMarkdown = (s.body.match(/\]\(https?:\/\//g) || []).length;
    assert.equal(rendered, inMarkdown, `${s.file}: ${rendered} rendered http links vs ${inMarkdown} in the markdown`);
    assert.equal((html.match(/<details class="legend">/g) || []).length, 1, `${s.file} legend`);
    assert.equal((html.match(/<summary>(<span class="chip [^<]*<\/span>){5}<span class="muted">Label legend<\/span><\/summary>/g) || []).length, 1, `${s.file} legend chips`);
    assert.ok(html.includes(`<a href="${s.file}" aria-current="page"><span class="num">`), `${s.file} marks itself current in the contents rail`);
    assert.equal((html.match(/<li><a href="s\d\d\.html"|<li><a href="appendix-[a-d]\.html"/g) || []).length, 48, `${s.file}: 24 contents entries in each of the two lists`);
    assert.ok(html.includes(s.kind === 'number' ? `<p class="kicker">Section ${sections.indexOf(s) + 1} of 24</p>` : `<p class="kicker">Appendix ${s.letter} · part ${sections.indexOf(s) + 1} of 24</p>`), `${s.file} kicker`);
    assert.ok(html.includes(`<h1 class="anchor-h" id="top">`), `${s.file} h1#top`);
  }
  assert.equal(chips, 127);
  assert.equal(notPublished, 5);
  assert.equal((pages.get('s00.html').match(/<h2 id="front-matter">Front matter<\/h2>/g) || []).length, 1);
  assert.ok(pages.get('s00.html').includes('<h3>Physical AI, Robotics, and Autonomous Drones: A Verified Learning-and-Research Roadmap for Sudish</h3>'));
  assert.ok(!pages.get('s00.html').includes('Appendices A–D\n'), 'the Contents list is not rendered');
});

test('OF-2 / DR-7: every manifest item id has at least one input[data-track] in dist; answers have anchors but no checkbox', () => {
  const manifest = JSON.parse(readFileSync(path.join(out, 'tracker-manifest.json'), 'utf8'));
  const all = [...pages.values()].join('\n');
  const tracks = new Set(attrValues(all, 'data-track'));
  for (const set of manifest.sets) {
    for (const item of set.items) {
      assert.ok(tracks.has(item.id), `${item.id} has no checkbox in dist`);
      assert.ok(pages.get(set.page).includes(`<tr id="${item.anchor}">`), `${item.id} anchor ${item.anchor} on ${set.page}`);
    }
  }
  for (const item of manifest.questions.items) {
    assert.ok(pages.get('s04.html').includes(`<tr id="${item.anchor}">`));
    assert.ok(!tracks.has(item.id));
  }
  const clauseIds = manifest.sets.find((s) => s.id === 'gates').clauses.map((c) => c.id);
  assert.equal(clauseIds.filter((id) => tracks.has(id)).length, 0, 'clauses live on My plan only');
  assert.equal((all.match(/<label class="check"><input type="checkbox" data-track="/g) || []).length, (all.match(/data-track="/g) || []).length);
  const home = pages.get('index.html');
  assert.equal((home.match(/data-track="s02:sessions:/g) || []).length, 7);
  assert.equal((home.match(/data-track="s03:best-10:/g) || []).length, 10);
  assert.equal((home.match(/<li data-set="/g) || []).length, 9);
  assert.ok(home.includes('<span data-overall-total>122</span>'));
  assert.equal((home.match(/Evidence cutoff/g) || []).length, 2, 'cutoff once in the hero, once in the footer');
  assert.equal((home.match(/Labels used throughout/g) || []).length, 1);
  assert.ok(home.includes(`<p class="lead">A source-checked learning-and-research roadmap for physical AI, robotics and autonomous drones, written for a software builder in India, with a personal progress tracker and a low-noise research feed.</p>`));
  assert.ok(!/verified/i.test(/<section class="hero">[\s\S]*?<\/section>/.exec(home)[0]));
  for (const s of ['s12.html', 's15.html', 's03.html']) {
    assert.equal((pages.get(s).match(/<div class="rail-block">\n<h2>Section progress<\/h2>/g) || []).length, 1, `${s} progress rail`);
  }
  assert.equal((pages.get('s05.html').match(/Section progress/g) || []).length, 0, 'no progress block on pages without trackables');
});
