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
// Theme icon (OF-3): three monochrome glyphs; CSS shows the one named by data-mode, which assets/theme.js updates.
const THEME_SVG = raw('<svg viewBox="0 0 24 24" aria-hidden="true" data-mode="light">'
  + '<g class="ic-light"><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1" fill="none" stroke="currentColor" stroke-width="2"/></g>'
  + '<g class="ic-dark"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="currentColor"/></g>'
  + '<g class="ic-system"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></g>'
  + '</svg>');

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
 * The skip link is the first body child on every page except 404.html: under its `<base href>` a
 * `#top` fragment would resolve to the site root instead of the current document.
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
${o.baseHref ? '' : '<a class="skip" href="#top">Skip to content</a>\n'}${render(header(o.page))}
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
  const onPageList = s.headings.length ? html`<ul>\n${onPage}\n</ul>` : '';
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
${s.headings.length || sets.length ? html`<details class="inline-rail onpage-inline"><summary><span class="t">On this page</span></summary><div>
${onPageList}
${progressList}
</div></details>` : ''}
<div class="prose">
${o.frontMatterHtml ? html`<h2 id="front-matter">Front matter</h2>\n${raw(o.frontMatterHtml)}` : ''}${raw(o.proseHtml)}</div>
<nav class="prevnext" aria-label="Previous and next section">
${o.prev ? html`<a href="${o.prev.file}" rel="prev"><span class="dir">← Previous</span> ${o.prev.headingText}</a>` : html`<span></span>`}
${o.next ? html`<a href="${o.next.file}" rel="next">${o.next.headingText} <span class="dir">Next →</span></a>` : ''}
</nav>
</article>
<aside class="rail rail-right" aria-label="On this page">
${s.headings.length ? html`<div class="rail-block">
<h2>On this page</h2>
${onPageList}
</div>` : ''}
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
  const body = html`<main class="page" id="top">
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
<ol class="feed-list" id="latest-feed"></ol>
<p class="small muted feed-note" data-feed-updated hidden>Feed last updated <span data-last-updated></span>. ${SITE.freshness}</p>
<noscript><p class="small muted">The feed list needs JavaScript here; open <a href="feed.html">the feed page</a> or read <a href="data/feed.json">data/feed.json</a>.</p></noscript>
</section>
</div>
</main>`;
  return shell({ page: 'home', title: '', body });
}

// ---------------------------------------------------------------------------
// My plan, Feed, 404

const thousands = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * My plan. The static structure (prompt card with the §4 Q7 rule, setup controls, empty stat cards and
 * section shells, the 18 §4 questions) is readable without JS; assets/plan.js fills every number from
 * plan-data.json and the stored plan. Dynamic sections start hidden so a page without JS shows no empty
 * headings; checkbox ids for months and gate clauses are rendered by plan.js (they depend on the chosen plan).
 * @param {{ planData: object }} o
 */
export function planPage(o) {
  const d = o.planData;
  const stat = (key, label) => html`<div class="stat" data-stat="${key}"><div class="v" data-v>—</div><div class="k" data-k>${label}</div></div>`;
  const questions = join(d.questions.map((q) => html`<li id="q-${q.n}"><span class="q">${q.n}. ${raw(q.questionHtml)}</span><details class="rule-details"><summary>Decision rule</summary><p class="small">${raw(q.ruleHtml)}</p></details><textarea data-answer="${q.id}" aria-label="Answer to question ${q.n}" placeholder="Your answer" rows="3"></textarea></li>`));
  const body = html`<main class="page">
<header class="article-head mt-6">
<p class="kicker">Personal tracker · stored in this browser only</p>
<h1 id="top">My plan</h1>
<p class="muted measure">Choose 10 h/week or 20 h/week, a start date and, at the end of month 9, a track. Every number below is taken from the report's own tables (<a href="s15.html#s15-3">§15.3 time accounting</a>, <a href="s15.html#s15-5">§15.5 month by month</a>, <a href="s15.html#s15-6">§15.6 quarterly gates</a>, <a href="s14.html#s14-3">§14.3 substitutions</a>) and from what you record here.</p>
</header>
<div id="plan-app">
<section class="plan-prompt" id="plan-prompt" aria-labelledby="h-prompt">
<h2 id="h-prompt">Choose a plan first</h2>
<p>Pick 10 h or 20 h per week below, then your start date. The month list, gate card and quarter budget appear once a plan is chosen; the week and hour figures also need the start date. Nothing is filled in before that. The report's rule for the choice (<a href="s04.html#t-s04-questions-7">§4, question 7</a>):</p>
<blockquote class="notice" data-hours-rule><p>${raw(d.hoursRule.ruleHtml)}</p></blockquote>
<p class="small muted mb-0">The track is chosen at the end of month 9 (<a href="s14.html#s14-1">§14.1</a>); leave it Undecided until then. Track B is the report's default.</p>
</section>
<section class="section-block" aria-labelledby="h-setup">
<h2 id="h-setup">Plan</h2>
<div class="form-grid plan-setup">
<div class="field"><span id="l-hours">Hours per week</span><div class="btn-row" role="group" aria-labelledby="l-hours"><button class="btn" type="button" data-hours="10" aria-pressed="false">10 h/week · ${thousands(d.budgets['10'].totals.Total)} h</button><button class="btn" type="button" data-hours="20" aria-pressed="false">20 h/week · ${thousands(d.budgets['20'].totals.Total)} h</button></div></div>
<div class="field field-track"><span id="l-track">Track (choose at the end of month 9)</span><div class="track-group" role="group" aria-labelledby="l-track"><button class="btn" type="button" data-track-choice="" aria-pressed="true">Undecided</button><button class="btn" type="button" data-track-choice="A" aria-pressed="false">A</button><button class="btn" type="button" data-track-choice="B" aria-pressed="false">B (default)</button><button class="btn" type="button" data-track-choice="C" aria-pressed="false">C</button></div></div>
<label class="field"><span>Start date (week 1 begins)</span><input type="date" id="plan-start"></label>
<div class="field"><span id="l-data">Your data</span><div class="btn-row" role="group" aria-labelledby="l-data"><button class="btn" type="button" id="plan-export">Export JSON</button><button class="btn" type="button" id="plan-import">Import JSON</button><input type="file" id="plan-import-file" accept=".json,application/json" hidden><button class="btn quiet" type="button" id="plan-reset">Reset…</button></div></div>
</div>
<p class="small plan-msg" id="plan-msg" role="status" hidden></p>
</section>
<div class="stat-grid mt-6" id="plan-stats" hidden>
${stat('week', 'of 104')}
${stat('month', 'current month')}
${stat('quarter', 'current quarter')}
${stat('expected', 'expected so far')}
${stat('logged', 'logged (manual weekly entries)')}
</div>
<div class="plan-grid">
<div>
<section class="section-block" aria-labelledby="h-month" id="plan-month" hidden>
<h2 id="h-month"><span data-title>This month</span> <a class="more small" href="s15.html#s15-5">§15.5</a></h2>
<div data-body></div>
</section>
<section class="section-block" aria-labelledby="h-gate" id="plan-gate" hidden>
<h2 id="h-gate"><span data-title>Gate</span> <a class="more small" href="s15.html#s15-6">§15.6</a></h2>
<div data-body></div>
</section>
<section class="section-block" aria-labelledby="h-log" id="plan-log" hidden>
<h2 id="h-log">Hours log</h2>
<div class="form-grid log-form">
<label class="field"><span>Week</span><input type="number" id="log-week" min="1" max="104" step="1" inputmode="numeric"></label>
<label class="field"><span>Hours worked</span><input type="number" id="log-hours" min="0" max="168" step="0.5" placeholder="0" inputmode="decimal"></label>
<div class="field"><span aria-hidden="true">&nbsp;</span><button class="btn primary" type="button" id="log-save">Save week</button></div>
</div>
<ul class="log-list" data-log-list></ul>
<p class="small muted mt-3" data-log-note>No entries yet. Expected-versus-logged compares completed weeks × hours/week with the sum of these entries.</p>
</section>
<section class="section-block" aria-labelledby="h-months" id="plan-months" hidden>
<h2 id="h-months"><span data-title>Month by month</span> <a class="more small" href="s15.html#s15-5">§15.5</a></h2>
<p class="small muted" data-note></p>
<ul class="month-list" data-month-list></ul>
</section>
</div>
<div>
<section class="section-block" aria-labelledby="h-budget" id="plan-budget" hidden>
<h2 id="h-budget"><span data-title>Quarter budget</span> <a class="more small" href="s15.html#s15-3">§15.3</a></h2>
<div data-body></div>
<p class="small muted">${d.quarterNote}</p>
</section>
<section class="section-block" aria-labelledby="h-q4" id="plan-questions">
<h2 id="h-q4">Personalization questions <a class="more small" href="s04.html">§4</a></h2>
<p class="small muted">Answer these in writing; the decision rule under each question is the report's. Answers stay in this browser and travel with Export JSON.</p>
<ol class="q-list">
${questions}
</ol>
</section>
</div>
</div>
</div>
<noscript><p>My plan needs JavaScript: it keeps your plan choice, hours and progress in this browser only.</p></noscript>
</main>`;
  return shell({ page: 'plan', title: 'My plan', body });
}

export const FEED_CLASS_FILTERS = [['all', 'All'], ['arxiv', 'arXiv'], ['proceedings', 'Proceedings'], ['lab', 'Labs'], ['release', 'Releases'], ['regulator', 'Regulators']];
export const FEED_QUERY_FILTERS = [['Thesis narrow', 'Thesis narrow'], ['Aerial autonomy', 'Aerial autonomy'], ['Safe autonomy', 'Safe autonomy'], ['Robot-learning evaluation', 'Robot-learning evaluation'], ['listings', 'Category listings']];
export const FEED_TRIAGE_FILTERS = [['all', 'Everything', null], ['keep', 'Kept', 'keep'], ['later', 'Read later', 'later'], ['drop', 'Dropped', 'drop']];
export const HEALTH_HEADERS = ['Source', 'Class', 'Status', 'Fetched', 'Newest item', 'Note or error'];

/**
 * Feed. Static: the header line (filled by JS from data/meta.json), the health disclosure (rows by JS), the rule
 * card, the three filter rows, the empty list, and the right column built from the report (§17.1 Normal-week rows
 * with the source's own cells — DR-5 —, the §17.6 limits sentence, the §13.6 notice pages, the §17.5 labs).
 * @param {{ feedData: object }} o
 */
export function feedPage(o) {
  const d = o.feedData;
  // DR-5 guard at the point of rendering: three rows, every cell one of the §17.1 table's own strings
  if (d.protocol.rows.length !== 3) throw new Error(`feed page: the protocol card must have exactly 3 rows, got ${d.protocol.rows.length}`);
  const protocolCells = new Set(d.protocol.cells);
  for (const row of d.protocol.rows) for (const cell of row) if (!protocolCells.has(cell)) throw new Error(`feed page: "${cell}" is not a §17.1 cell`);
  const filterRow = (name, label, list, countKey) => html`<div class="filters" role="group" aria-label="Filter by ${label}" data-filter-group="${name}">
<span class="group-label">${label[0].toUpperCase() + label.slice(1)}</span>
<div class="filter-btns">
${join(list.map(([value, text], i) => html`<button class="btn" type="button" data-filter="${name}" data-value="${value}" aria-pressed="${i === 0 && name !== 'query' ? 'true' : 'false'}">${text}${countKey && list[i][2] ? html` <span class="n" data-count="${list[i][2]}">0</span>` : ''}</button>`), '\n')}
</div>
</div>`;
  const protocolRows = join(d.protocol.rows.map((row) => html`<tr>${join(row.map((cell, c) => html`<td${d.protocol.aligns[c] === 'right' ? raw(' class="num"') : ''}>${cell}</td>`), '')}</tr>`));
  const protocolHead = join(d.protocol.headers.map((h, c) => html`<th${d.protocol.aligns[c] === 'right' ? raw(' class="num"') : ''}>${h}</th>`), '');
  const notices = join(d.notices.map((n) => html`<li data-notice="${n.id}"><span><a href="${n.url}" rel="noopener external">${n.name}</a>${n.extraHtml ? html` ${raw(n.extraHtml)}` : ''}</span><span class="count" data-notice-status>—</span></li>`));
  const labs = join(d.labs.map((l) => html`<li><a href="${l.url}" rel="noopener external">${l.name}</a><span class="dom">${hostOfHref(l.url)}</span></li>`));
  const manual = join(d.manualChecks.map((m) => html`<a href="${m.href}">${m.label}</a>`), raw(' · '));
  const body = html`<main class="page">
<header class="article-head feed-head mt-6">
<p class="kicker">Stay ahead · the §17 monitoring system, fetched daily</p>
<h1 id="top">Feed</h1>
<p class="muted small feed-updated">Last updated <span data-last-updated></span> · 30-day window · ${SITE.freshness}</p>
<details class="health" id="feed-health">
<summary><span data-health-summary>Source health</span><span class="muted"> · details</span></summary>
<div class="table-wrap bare"><table class="health-table" data-cols="6">
<thead><tr>${join(HEALTH_HEADERS.map((h) => html`<th${h === 'Fetched' ? raw(' class="num"') : ''}>${h}</th>`), '')}</tr></thead>
<tbody data-health-rows><tr><td colspan="6">Source health is read from <a href="data/meta.json">data/meta.json</a> by JavaScript.</td></tr></tbody>
</table></div>
</details>
</header>
<div class="two-col feed-grid">
<div>
<div class="rule"><p><strong>Keep only if it changes an experiment or a claim.</strong> Triage is stored in this browser; the full keep/drop rule is in <a href="s17.html#s17-6">§17.6</a>.</p></div>
${filterRow('class', 'class', FEED_CLASS_FILTERS)}
${filterRow('query', '§17 query', FEED_QUERY_FILTERS)}
${filterRow('triage', 'triage', FEED_TRIAGE_FILTERS, true)}
<ol class="feed-list" data-feed-list aria-live="polite"></ol>
<p class="small muted feed-status" data-feed-status>Items older than 30 days leave the feed; Keep and Read-later marks stay in this browser.</p>
</div>
<aside class="feed-aside">
<section class="section-block pt-0" aria-labelledby="h-protocol">
<h2 id="h-protocol" class="mt-0">Weekly protocol <a class="more small" href="s17.html#s17-1">§17.1</a></h2>
<div class="table-wrap"><table class="protocol" data-cols="${d.protocol.headers.length}">
<thead><tr>${protocolHead}</tr></thead>
<tbody>
${protocolRows}
</tbody>
</table></div>
<p class="small">${d.monthEnd.text.replace(/ — see §17\.1$/, '')} — see <a href="${d.monthEnd.href}">§17.1</a>.</p>
<p class="small muted limits">${raw(d.limits.html)} (<a href="s17.html#s17-6">§17.6</a>)</p>
</section>
<section class="section-block" aria-labelledby="h-notices">
<h2 id="h-notices">Indian official notices: check manually <a class="more small" href="s13.html#s13-6">§13.6</a></h2>
<p class="small muted">These pages are not machine-readable, so the feed records only whether each one answered. ${d.noticeSentence}</p>
<ul class="progress-list notices" data-notices>
${notices}
</ul>
</section>
<section class="section-block" aria-labelledby="h-labs">
<h2 id="h-labs">Labs without a feed: check monthly <a class="more small" href="s17.html#s17-5">§17.5</a></h2>
<ul class="small list-indent labs">
${labs}
</ul>
</section>
<p class="small muted manual-checks">Manual checks: ${manual}.</p>
</aside>
</div>
<noscript><p>The feed list needs JavaScript to render; the raw data is in <a href="data/feed.json">data/feed.json</a> and the source health in <a href="data/meta.json">data/meta.json</a>.</p></noscript>
</main>`;
  return shell({ page: 'feed', title: 'Feed', body });
}

function hostOfHref(href) {
  try { return new URL(href).hostname.replace(/^www\./, ''); } catch { return ''; }
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
