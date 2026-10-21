import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { html, raw, escapeHtml, shell, THEME_BOOTSTRAP, cspValue, FOOTER_TEXT, planPage, feedPage, notFoundPage, legendDetails } from '../src/build/templates.js';
import { SITE } from '../src/build/content-map.mjs';

test('the html tag escapes every interpolated string and passes nested templates through', () => {
  const user = '<img src=x onerror="alert(1)"> & "quotes" \'single\'';
  const out = html`<p title="${user}">${user}</p>`.toString();
  assert.equal(out, '<p title="&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &quot;quotes&quot; &#39;single&#39;">&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &quot;quotes&quot; &#39;single&#39;</p>');
  const inner = html`<b>${'a<b'}</b>`;
  assert.equal(html`<div>${inner}${raw('<i>ok</i>')}${['x', '<y>']}${null}${false}</div>`.toString(), '<div><b>a&lt;b</b><i>ok</i>x&lt;y&gt;</div>');
  assert.equal(escapeHtml('<&>"\''), '&lt;&amp;&gt;&quot;&#39;');
});

test('the CSP hash equals the sha256 of the emitted inline script; no color-scheme meta; no style attributes', () => {
  const page = shell({ page: 'section', title: 'Test <page>', body: raw('<main class="page"><h1 id="top">t</h1></main>') });
  const script = /<script>([\s\S]*?)<\/script>/.exec(page)[1];
  assert.equal(script, THEME_BOOTSTRAP);
  const hash = createHash('sha256').update(script, 'utf8').digest('base64');
  const csp = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/.exec(page)[1].replace(/&#39;/g, "'");
  assert.equal(csp, `default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self' 'sha256-${hash}'; connect-src 'self'; base-uri 'none'; form-action 'none'`);
  assert.equal(csp, cspValue());
  assert.ok(script.includes(`'${SITE.storageKeyTheme}'`));
  assert.ok(script.includes("var t='light'"), 'light is the default');
  assert.ok(!page.includes('<meta name="color-scheme"'));
  assert.equal((page.match(/ style=/g) || []).length, 0);
  assert.ok(page.startsWith('<!doctype html>\n<html lang="en" data-theme="light">'));
  assert.ok(page.includes('<title>Test &lt;page&gt; — Physical AI Roadmap</title>'));
  assert.ok(page.includes('<body data-page="section">'));
  assert.ok(page.includes('<script type="module" src="assets/app.js"></script>'));
  assert.ok(page.includes('<link rel="stylesheet" href="assets/app.css">'));
  assert.ok(page.includes('<link rel="icon" href="favicon.svg" type="image/svg+xml">'));
});

test('header and footer match the mock structure; footer text is exact', () => {
  const page = shell({ page: 'home', title: '', body: raw('') });
  assert.ok(page.includes('<title>Physical AI Roadmap</title>'));
  assert.ok(page.includes('<a class="wordmark" href="index.html"><svg viewBox="0 0 32 32" aria-hidden="true">'));
  assert.ok(page.includes('<nav class="site-nav" aria-label="Primary">\n<a href="index.html" aria-current="page">Home</a>\n<a href="s00.html">Sections</a>\n<a href="plan.html">My plan</a>\n<a href="feed.html">Feed</a>\n</nav>'));
  assert.ok(page.includes('<nav class="page nav-strip" aria-label="Primary">'));
  assert.ok(page.includes('<a class="search-link" href="#search">Search</a>'));
  assert.ok(page.includes('<input type="search" id="search" placeholder="Search the report" autocomplete="off"><kbd>/</kbd></label>'));
  assert.ok(page.includes('<button class="btn theme-btn" type="button" aria-label="Theme: Light. Activate for Dark" title="Theme (t)">'));
  assert.ok(page.includes('<span class="label">Light</span></button>'));
  const footer = /<footer class="page site-footer">([\s\S]*?)<\/footer>/.exec(page)[1];
  const text = footer.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(text, 'Sudish Kumar · sudish.dev · GitHub repository · Evidence cutoff 20 Oct 2026 · Not legal advice');
  assert.equal(FOOTER_TEXT, text);
  assert.ok(footer.includes('<a href="https://sudish.dev" rel="noopener external">sudish.dev</a>'));
  assert.ok(footer.includes('<a href="https://github.com/Sudish007/physical-ai-roadmap" rel="noopener external">GitHub repository</a>'));
  assert.ok(!/hand-coded|zero build step|view source|AI-powered/i.test(page));
});

test('plan, feed and 404 shells', () => {
  const plan = planPage();
  assert.ok(plan.includes('<body data-page="plan">'));
  assert.ok(plan.includes('<h1 id="top">My plan</h1>\n<div id="plan-app"></div>\n<noscript>'));
  assert.ok(plan.includes('<a href="plan.html" aria-current="page">My plan</a>'));
  const feed = feedPage();
  assert.ok(feed.includes('<body data-page="feed">'));
  assert.ok(feed.includes('<p class="kicker">Stay ahead · the §17 monitoring system, fetched daily</p>'));
  assert.ok(feed.includes('<div id="feed-app"></div>'));
  assert.ok(feed.includes('<noscript><p>The feed needs JavaScript to render; the raw data is in <a href="data/feed.json">data/feed.json</a>.</p></noscript>'));
  const nf = notFoundPage();
  assert.ok(nf.includes('<base href="/physical-ai-roadmap/">'));
  assert.ok(nf.indexOf('<base href') < nf.indexOf('<meta http-equiv="Content-Security-Policy"'), 'base comes before the CSP meta');
  assert.ok(nf.includes("base-uri &#39;self&#39;"), '404 allows its own base element; every other page uses base-uri none');
  assert.ok(nf.includes('<body data-page="404">'));
  assert.ok(nf.includes('<a class="btn" href="index.html">Home</a>'));
  assert.ok(nf.includes('<a class="btn" href="s00.html">§0 How to read this report</a>'));
  assert.ok(nf.includes('href="plan.html">My plan</a>') && nf.includes('href="feed.html">Feed</a>'));
  for (const p of [plan, feed, nf]) {
    assert.equal((p.match(/ style=/g) || []).length, 0);
    assert.ok(!p.includes('<meta name="color-scheme"'));
    assert.ok(!/verified/i.test(/<title>([^<]*)<\/title>/.exec(p)[1]));
  }
});

test('legend details: five chips in the summary and five definitions', () => {
  const legend = ['fact', 'judgment', 'uncertain', 'hype', 'stale'].map((kind, i) => ({ kind, label: kind.toUpperCase(), meaning: `Meaning ${i} <b>` }));
  const out = legendDetails(legend).toString();
  assert.ok(out.startsWith('<details class="legend"><summary><span class="chip chip-fact">FACT</span>'));
  assert.equal((out.match(/class="chip /g) || []).length, 10);
  assert.ok(out.includes('<dd>Meaning 0 &lt;b&gt;</dd>'));
  assert.ok(out.includes('<span class="muted">Label legend</span></summary>'));
});
