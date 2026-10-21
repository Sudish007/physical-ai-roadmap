// HTML templates. The `html` tag escapes every interpolated string; only values produced by `html`
// itself (or wrapped with `raw`) are inserted verbatim. No style attributes, no color-scheme meta (DR-1, DR-3).
import { createHash } from 'node:crypto';
import { SITE, SECTION_FILES, PROGRESS_SETS } from './content-map.mjs';

export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

class Raw {
  constructor(html) { this.html = html; }
  toString() { return this.html; }
}

export function raw(html) {
  return html instanceof Raw ? html : new Raw(String(html));
}

function render(value) {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof Raw) return value.html;
  if (Array.isArray(value)) return value.map(render).join('');
  return escapeHtml(value);
}

export function html(strings, ...values) {
  let out = '';
  strings.forEach((s, i) => { out += s; if (i < values.length) out += render(values[i]); });
  return new Raw(out);
}

export function join(items, sep = '\n') {
  return new Raw(items.map(render).join(sep));
}

// ONE string constant; its hash lands in the CSP meta. Any edit changes the hash automatically.
export const THEME_BOOTSTRAP = `(function(){var t='light';try{var s=localStorage.getItem('${SITE.storageKeyTheme}');if(s==='dark'||s==='light'||s==='system')t=s;}catch(e){}if(t==='system'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);})();`;

export function sha256Base64(text) {
  return createHash('sha256').update(text, 'utf8').digest('base64');
}

export function cspValue({ baseUri = "'none'" } = {}) {
  return `default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self' 'sha256-${sha256Base64(THEME_BOOTSTRAP)}'; connect-src 'self'; base-uri ${baseUri}; form-action 'none'`;
}

const WORDMARK_SVG = raw('<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="20" width="7" height="8" fill="currentColor"/><rect x="12.5" y="12" width="7" height="16" fill="currentColor"/><rect x="21" y="4" width="7" height="24" fill="currentColor"/></svg>');
const SEARCH_SVG = raw('<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>');
const THEME_SVG = raw('<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>');

const NAV = [
  { id: 'home', href: 'index.html', label: 'Home' },
  { id: 'section', href: 's00.html', label: 'Sections' },
  { id: 'plan', href: 'plan.html', label: 'My plan' },
  { id: 'feed', href: 'feed.html', label: 'Feed' },
];

function navLinks(current) {
  return join(NAV.map((n) => html`<a href="${n.href}"${n.id === current ? raw(' aria-current="page"') : ''}>${n.label}</a>`));
}

export function header(current) {
  return html`<header class="site-header">
<div class="page row">
<a class="wordmark" href="index.html">${WORDMARK_SVG}${SITE.title}</a>
<nav class="site-nav" aria-label="Primary">
${navLinks(current)}
</nav>
<div class="header-tools">
<label class="search-box">${SEARCH_SVG}<span class="sr-only">Search the report</span><input type="search" id="search" placeholder="Search the report" autocomplete="off"><kbd>/</kbd></label>
<button class="btn theme-btn" type="button" aria-label="Theme: Light. Activate for Dark" title="Theme (t)">${THEME_SVG}<span class="label">Light</span></button>
</div>
</div>
<nav class="page nav-strip" aria-label="Primary">
${navLinks(current)}
<a class="search-link" href="#search">Search</a>
</nav>
</header>`;
}

export const FOOTER_TEXT = `${SITE.owner} · ${SITE.ownerSiteLabel} · ${SITE.repoLabel} · ${SITE.cutoff} · ${SITE.notLegal}`;

export function footer() {
  const sep = raw('<span class="sep"> · </span>');
  return html`<footer class="page site-footer"><span>${SITE.owner}</span>${sep}<a href="${SITE.ownerSite}" rel="noopener external">${SITE.ownerSiteLabel}</a>${sep}<a href="${SITE.repoUrl}" rel="noopener external">${SITE.repoLabel}</a>${sep}<span>${SITE.cutoff}</span>${sep}<span>${SITE.notLegal}</span></footer>`;
}

/**
 * @param {{ page: string, title: string, headExtra?: Raw, body: Raw, baseHref?: string }} o
 */
export function shell(o) {
  const title = o.title ? `${o.title} — ${SITE.title}` : SITE.title;
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${o.baseHref ? `<base href="${escapeHtml(o.baseHref)}">\n` : ''}<meta http-equiv="Content-Security-Policy" content="${escapeHtml(cspValue({ baseUri: o.baseHref ? "'self'" : "'none'" }))}">
<script>${THEME_BOOTSTRAP}</script>
<title>${escapeHtml(title)}</title>
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="assets/app.css">
${o.headExtra ? render(o.headExtra) : ''}</head>
<body data-page="${escapeHtml(o.page)}">
${render(header(o.page))}
${render(o.body)}
${render(footer())}
<script type="module" src="assets/app.js"></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Shared pieces

export function chip(entry) {
  return html`<span class="chip chip-${entry.kind}">${entry.label}</span>`;
}

export function legendDetails(legend) {
  return html`<details class="legend"><summary>${join(legend.map(chip), '')}<span class="muted">Label legend</span></summary>
<dl>
${join(legend.map((l) => html`<dt>${chip(l)}</dt><dd>${l.meaning}</dd>`))}
</dl>
</details>`;
}

function sectionLabel(s) {
  return s.kind === 'number' ? String(s.number) : s.letter;
}

function contentsList(sections, current, withNum) {
  return join(sections.map((s) => html`<li><a href="${s.file}"${s.slug === current ? raw(' aria-current="page"') : ''}>${withNum ? html`<span class="num">${sectionLabel(s)}</span> ` : html`${sectionLabel(s)} `}${s.titleText}</a></li>`));
}

export function progressRows(sets, { setIdOverride } = {}) {
  return join(sets.map((set) => {
    const id = setIdOverride && setIdOverride[set.id] ? setIdOverride[set.id] : set.id;
    return html`<li data-set="${id}"><span>${set.label}</span><span class="count"><span data-done>0</span> of <span data-total>${set.items.length}</span></span><div class="bar"><i data-bar></i></div></li>`;
  }));
}

// ---------------------------------------------------------------------------
// Section page

/**
 * @param o { section, sections, proseHtml, legend, sets (manifest sets on this page), prev, next, frontMatterHtml }
 */
export function sectionPage(o) {
  const { section: s, sections } = o;
  const n = sections.indexOf(s) + 1;
  const kicker = s.kind === 'number' ? `Section ${n} of ${sections.length}` : `Appendix ${s.letter} · part ${n} of ${sections.length}`;
  const headExtra = html`${o.prev ? html`<link rel="prev" href="${o.prev.file}">\n` : ''}${o.next ? html`<link rel="next" href="${o.next.file}">\n` : ''}`;
  const onPage = join(s.headings.map((h) => html`<li><a href="#${h.id}">${h.text}</a></li>`));
  const sets = o.sets || [];
  const progressList = sets.length ? html`<ul class="progress-list">${progressRows(sets)}</ul>` : '';
  const body = html`<div class="page layout">
<aside class="rail rail-left" aria-label="Contents">
<h2>Contents</h2>
<ol>
${contentsList(sections, s.slug, true)}
</ol>
</aside>
<article class="article">
<details class="inline-rail contents-inline"><summary>Contents: ${sections.length} sections</summary><div><ol>
${contentsList(sections, s.slug, false)}
</ol></div></details>
<header class="article-head">
<p class="kicker">${kicker}</p>
<h1 class="anchor-h" id="top">${raw(o.headingHtml)}</h1>
${legendDetails(o.legend)}
</header>
<details class="inline-rail onpage-inline"><summary>On this page</summary><div>
<ul>
${onPage}
</ul>
${progressList}
</div></details>
<div class="prose">
${o.frontMatterHtml ? html`<h2 id="front-matter">Front matter</h2>\n${raw(o.frontMatterHtml)}` : ''}${raw(o.proseHtml)}</div>
<nav class="prevnext" aria-label="Previous and next section">
${o.prev ? html`<a href="${o.prev.file}" rel="prev"><span class="dir">← Previous</span> ${o.prev.headingText}</a>` : html`<span></span>`}
${o.next ? html`<a href="${o.next.file}" rel="next">${o.next.headingText} <span class="dir">Next →</span></a>` : ''}
</nav>
</article>
<aside class="rail rail-right" aria-label="On this page">
<div class="rail-block">
<h2>On this page</h2>
<ul>
${onPage}
</ul>
</div>
${sets.length ? html`<div class="rail-block">
<h2>Section progress</h2>
${progressList}
</div>` : ''}
<div class="rail-block">
<h2>Keys</h2>
<p class="xs muted"><kbd>/</kbd> search · <kbd>t</kbd> theme · <kbd>[</kbd> <kbd>]</kbd> previous / next section</p>
</div>
</aside>
</div>`;
  return shell({ page: 'section', title: s.headingText, headExtra, body });
}

// ---------------------------------------------------------------------------
// Home

export function homePage(o) {
  const { home, manifest } = o;
  const legend = home.legend;
  const sessionCards = join(home.sessions.map((c) => html`<li class="card"><div class="card-head"><label class="check"><input type="checkbox" data-track="${c.id}" aria-label="Done: ${c.title}"></label><h3>${raw(c.titleHtml)}</h3></div><div class="meta">${c.time}</div><p><strong>Output to keep:</strong> ${raw(c.outputHtml)}</p><div class="card-foot"><a href="${c.href}">What to do, in §2</a></div></li>`));
  const bestCards = join(home.best10.map((c) => html`<li class="card"><div class="card-head"><label class="check"><input type="checkbox" data-track="${c.id}" aria-label="Done: ${c.n}. ${c.title}"></label><h3>${c.n}. ${c.title}</h3></div><p>${raw(c.purposeHtml)}</p><div class="meta">${raw(c.timeCostHtml)}</div><div class="card-foot">${c.link ? html`<a href="${c.link.href}" rel="noopener external">${c.link.text}</a><span class="dom">${c.link.host}</span>` : ''}</div></li>`));
  const trackCards = join(home.tracks.map((t) => html`<li class="card track"><h3>${raw(t.titleHtml)}</h3><dl><dt>${t.fitProfile.label}</dt><dd>${raw(t.fitProfile.html)}</dd><dt>${t.month24.label}</dt><dd>${raw(t.month24.html)}</dd><dt>${t.branch.label}</dt><dd>${raw(t.branch.html)}</dd></dl><div class="card-foot"><a href="${t.href}">Track card in §14.1</a></div></li>`));
  const judgment = legend.find((l) => l.kind === 'judgment');
  const nonPlan = manifest.sets.filter((s) => PROGRESS_SETS.includes(s.id) && !s.id.startsWith('plan-'));
  const plan10 = manifest.sets.find((s) => s.id === 'plan-10h');
  const overallTotal = nonPlan.reduce((a, s) => a + s.items.length, 0);
  const planRow = plan10 ? html`<li data-set="plan"><span>Plan months (§15, choose a plan first)</span><span class="count"><span data-done>0</span> of <span data-total>${plan10.items.length}</span></span><div class="bar"><i data-bar></i></div></li>` : '';
  const body = html`<main class="page">
<div class="hero-grid">
<section class="hero">
<p class="lead">${SITE.heroLead}</p>
<p class="cutoff">${SITE.heroCutoff}</p>
<div class="btn-row">
<a class="btn primary" href="s00.html">Read from §0</a>
<a class="btn" href="plan.html">Set up My plan</a>
<a class="btn" href="feed.html">Open the feed</a>
</div>
</section>
<section class="hero-legend" aria-labelledby="h-legend">
<h2 id="h-legend">Labels used throughout <a class="more small" href="s00.html#labels">§0</a></h2>
<ul class="legend-full">
${join(legend.map((l) => html`<li>${chip(l)}<span>${l.meaning}</span></li>`))}
</ul>
</section>
</div>
<section class="section-block" aria-labelledby="h-week">
<h2 id="h-week">Start this week <a class="more" href="s02.html">§2 Seven sessions, exactly 10 mandatory hours</a></h2>
<p class="muted small">No purchase, wiring, propeller motion, or flight. Tick a session when its output exists.</p>
<ul class="cards">
${sessionCards}
</ul>
</section>
<section class="section-block" aria-labelledby="h-best">
<h2 id="h-best">The best 10 resources <a class="more" href="s03.html">§3 Scores, prerequisites and notes</a></h2>
<ul class="cards best-10">
${bestCards}
</ul>
</section>
<section class="section-block" aria-labelledby="h-tracks">
<h2 id="h-tracks">Three tracks <a class="more" href="s14.html">§14 Decision criteria and equal-hour substitutions</a></h2>
<p class="muted small">The track choice occurs at the end of month 9. Default ${chip(judgment)}: Track B.</p>
<ul class="cards">
${trackCards}
</ul>
</section>
<div class="two-col">
<section class="section-block" aria-labelledby="h-progress">
<h2 id="h-progress">Your progress <a class="more" href="plan.html">My plan</a></h2>
<ul class="progress-list">
${progressRows(nonPlan)}
${planRow}
</ul>
<p class="small muted progress-note">Overall <span data-overall-done>0</span> of <span data-overall-total>${overallTotal}</span> items (plan months are counted once a plan is chosen). Stored in this browser only.</p>
<noscript><p class="small muted">Progress needs JavaScript (stored in this browser only).</p></noscript>
</section>
<section class="section-block" aria-labelledby="h-feed">
<h2 id="h-feed">Latest from the feed <a class="more" href="feed.html">Stay ahead: filters, triage, source health</a></h2>
<ul class="feed-list" data-latest-feed></ul>
<p class="small muted feed-note" data-feed-updated></p>
<noscript><p class="small muted">The feed list needs JavaScript here; open <a href="feed.html">the feed page</a> or read <a href="data/feed.json">data/feed.json</a>.</p></noscript>
</section>
</div>
</main>`;
  return shell({ page: 'home', title: '', body });
}

// ---------------------------------------------------------------------------
// My plan, Feed, 404

export function planPage() {
  const body = html`<main class="page">
<p class="kicker">Personal tracker · stored in this browser only</p>
<h1 id="top">My plan</h1>
<div id="plan-app"></div>
<noscript><p>My plan needs JavaScript: it keeps your plan choice, hours and progress in this browser only.</p></noscript>
</main>`;
  return shell({ page: 'plan', title: 'My plan', body });
}

export function feedPage() {
  const body = html`<main class="page">
<p class="kicker">Stay ahead · the §17 monitoring system, fetched daily</p>
<h1 id="top">Feed</h1>
<div id="feed-app"></div>
<noscript><p>The feed needs JavaScript to render; the raw data is in <a href="data/feed.json">data/feed.json</a>.</p></noscript>
</main>`;
  return shell({ page: 'feed', title: 'Feed', body });
}

export function notFoundPage() {
  const body = html`<main class="page">
<p class="kicker">404</p>
<h1 id="top">Page not found</h1>
<p>There is no page at this address; the links below lead back into the site.</p>
<nav class="btn-row" aria-label="Page not found">
<a class="btn" href="index.html">Home</a>
<a class="btn" href="s00.html">§0 How to read this report</a>
<a class="btn" href="plan.html">My plan</a>
<a class="btn" href="feed.html">Feed</a>
</nav>
</main>`;
  return shell({ page: '404', title: 'Page not found', body, baseHref: SITE.base });
}

export { SECTION_FILES };
