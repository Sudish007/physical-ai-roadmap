// Client-side search (design "Search"): the header box and the `/` key open a results panel under the
// header (role=dialog "Search results"). search-index.json is fetched lazily on the first focus. Results
// are grouped by section page in report order, each hit shows its heading and a snippet with the matched
// terms in <mark>; Enter opens the first hit, arrow keys move between hits, Esc closes. No external service.
import { prepareIndex, search, snippetAround, highlight } from './lib/score.js';

const INDEX_URL = 'search-index.json';
const MIN_CHARS = 2;

let input = null;
let header = null;
let panel = null;
let index = null;
let loading = null;
let lastQuery = '';
let lastResult = null;

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const c of children) node.append(c);
  return node;
}

function highlightNodes(text, terms) {
  return highlight(text, terms).map((part) => (part.mark ? el('mark', {}, [part.text]) : document.createTextNode(part.text)));
}

/** Fetch and tokenise the index once; resolves to the prepared index or null when it cannot be loaded. */
export function ensureIndex() {
  if (index) return Promise.resolve(index);
  if (!loading) {
    loading = fetch(INDEX_URL)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((records) => { index = prepareIndex(records); return index; })
      .catch(() => { loading = null; return null; });
  }
  return loading;
}

export function isOpen() {
  return !!panel && !panel.hidden;
}

export function open() {
  if (!panel) return;
  panel.hidden = false;
  input.setAttribute('aria-expanded', 'true');
}

export function close() {
  if (!panel) return;
  panel.hidden = true;
  input.setAttribute('aria-expanded', 'false');
}

function showStatus(text) {
  panel.replaceChildren(el('p', { class: 'search-status small muted' }, [text]));
  open();
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function render(result, query) {
  lastResult = result;
  panel.replaceChildren();
  if (!result.groups.length) {
    showStatus(`No results for “${query}”.`);
    return;
  }
  const count = result.matched > result.shown ? `${result.shown} of ${result.matched} results` : plural(result.matched, 'result');
  panel.append(el('p', { class: 'search-status small muted' }, [`${count} in ${plural(result.groups.length, 'section')} · Enter opens the first`]));
  for (const g of result.groups) {
    const list = el('ol');
    for (const hit of g.hits) {
      const a = el('a', { href: `${hit.p}#${hit.a}` }, [el('span', { class: 'hit-h' }, highlightNodes(hit.h, result.terms))]);
      if (hit.a !== 'top' && hit.x !== hit.h) {
        a.append(el('span', { class: 'hit-x' }, highlightNodes(snippetAround(hit.x, result.terms), result.terms)));
      }
      list.append(el('li', {}, [a]));
    }
    panel.append(el('section', { class: 'search-group' }, [el('h3', {}, [g.title]), list]));
  }
  open();
}

/** Search for `query` (called on every keystroke); a query shorter than MIN_CHARS closes the panel. */
export async function run(query) {
  lastQuery = query;
  const q = String(query).trim();
  if (q.length < MIN_CHARS) { lastResult = null; close(); return; }
  if (!index) {
    showStatus('Loading the search index…');
    const loaded = await ensureIndex();
    if (lastQuery !== query) return; // superseded by a newer keystroke
    if (!loaded) { showStatus('The search index could not be loaded.'); return; }
  }
  render(search(index, q), q);
}

function firstHit() {
  return lastResult && lastResult.groups.length ? lastResult.groups[0].hits[0] : null;
}

function panelLinks() {
  return [...panel.querySelectorAll('a[href]')];
}

function onInputKey(e) {
  if (e.key === 'Enter') {
    const hit = firstHit();
    if (hit && isOpen()) { e.preventDefault(); window.location.href = `${hit.p}#${hit.a}`; }
  } else if (e.key === 'ArrowDown') {
    if (isOpen()) {
      const links = panelLinks();
      if (links.length) { e.preventDefault(); links[0].focus(); }
    }
  }
}

function onPanelKey(e) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  const links = panelLinks();
  const i = links.indexOf(document.activeElement);
  if (i < 0) return;
  e.preventDefault();
  if (e.key === 'ArrowDown') { if (i + 1 < links.length) links[i + 1].focus(); } else if (i === 0) input.focus(); else links[i - 1].focus();
}

function inputVisible() {
  return input.getClientRects().length > 0;
}

/** `/` handler for keys.js: reveal the box when the narrow header hides it (<860px), then focus it. */
export function focusInput() {
  if (!inputVisible()) header.classList.add('search-open');
  input.focus();
  input.select();
  return true;
}

/** Esc handler for keys.js: closes the panel and leaves the search box. Returns true when it did something. */
export function escape() {
  if (!panel) return false;
  const active = document.activeElement;
  const inside = !!active && (active === input || panel.contains(active));
  const wasOpen = isOpen();
  close();
  if (inside) {
    active.blur();
    header.classList.remove('search-open');
  }
  return wasOpen || inside;
}

/**
 * @param {{ escape?: Function }} keys  the live handler object returned by initKeys(); `escape` is replaced.
 */
export function initSearch(keys) {
  input = document.getElementById('search');
  header = document.querySelector('.site-header');
  if (!input || !header) return null;
  panel = el('div', { class: 'search-panel', id: 'search-panel', role: 'dialog', 'aria-label': 'Search results' });
  panel.hidden = true;
  header.appendChild(panel);
  input.setAttribute('aria-controls', 'search-panel');
  input.setAttribute('aria-expanded', 'false');

  input.addEventListener('focus', () => { ensureIndex(); if (input.value.trim().length >= MIN_CHARS) run(input.value); });
  input.addEventListener('input', () => run(input.value));
  input.addEventListener('keydown', onInputKey);
  panel.addEventListener('keydown', onPanelKey);
  document.addEventListener('click', (e) => {
    if (isOpen() && !panel.contains(e.target) && !e.target.closest('.search-box')) close();
  });
  document.addEventListener('focusin', (e) => {
    if (isOpen() && e.target !== input && !panel.contains(e.target)) close();
  });
  // Below 860px the header shows a 42px icon (and below 360px only the nav-strip "Search" link): either
  // one, like the `/` key, reveals the box on its own header row and focuses it.
  const box = input.closest('.search-box');
  if (box) {
    box.addEventListener('click', (e) => {
      if (!inputVisible()) { e.preventDefault(); focusInput(); }
    });
  }
  const link = document.querySelector('.nav-strip .search-link');
  if (link) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      focusInput();
    });
  }
  if (keys) {
    keys.search = focusInput;
    keys.escape = escape;
  }
  return { run, open, close, escape, focusInput };
}
