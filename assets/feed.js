// Feed page: data/feed.json + data/meta.json → the item list with class / query / triage filters, Keep /
// Read later / Drop persisted under physical-ai-roadmap.v1.triage, the source-health disclosure, the
// notices' reachability status and the single "Last updated" derivation (assets/lib/format.js).
import { KEYS, get, set, isPlainObject } from './lib/store.js';
import { formatLastUpdated, formatDate } from './lib/format.js';
import { applyFilters, triageOf, nextTriage, withTriage, triageCounts, statusLine, healthCounts, healthSummary, noteOrError, noticeStatus, hostLabel, CLASS_LABELS } from './lib/filter.js';

const TRIAGE_LABELS = { keep: 'Keep', later: 'Read later', drop: 'Drop' };

const state = { items: [], meta: null, triage: {}, filters: { cls: 'all', query: null, tri: 'all' } };
const el = {};

async function loadJson(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function h(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) e.append(c);
  return e;
}

function readTriage() {
  return get(KEYS.triage, isPlainObject) || {};
}

/** The matched query or the class, shown only when the source name does not already say it (D5: each fact once), plus the other matching queries. */
export function itemTags(item) {
  const tags = [];
  const source = String(item.source || '').toLowerCase();
  if (item.matchedQuery) {
    if (!source.includes(item.matchedQuery.toLowerCase())) tags.push(item.matchedQuery);
  } else {
    const cls = CLASS_LABELS[item.sourceClass] || item.sourceClass || '';
    if (cls && !source.includes(cls.toLowerCase())) tags.push(cls);
  }
  const also = Array.isArray(item.alsoMatched) ? item.alsoMatched.filter((l) => typeof l === 'string' && l) : [];
  if (also.length) tags.push(`also ${also.join(', ')}`);
  return tags;
}

function renderItem(item) {
  const triageState = triageOf(state.triage, item.id);
  const li = h('li', { class: `feed-item${triageState === 'drop' ? ' dropped' : ''}`, 'data-id': item.id, 'data-class': item.sourceClass });
  const title = h('h3', {}, h('a', { href: item.url, rel: 'noopener external', text: item.title }));
  const host = hostLabel(item.url);
  if (host) title.append(h('span', { class: 'dom', text: host }));
  const meta = h('div', { class: 'meta' }, h('span', { class: 'src', text: item.source }));
  const date = formatDate(item.publishedAt);
  if (date) meta.append(h('span', { class: 'date', text: date }));
  for (const tag of itemTags(item)) meta.append(h('span', { class: 'tag', text: tag }));
  li.append(title, meta);
  if (item.summary) li.append(h('p', { class: 'summary', text: item.summary }));
  const actions = h('div', { class: 'triage', role: 'group', 'aria-label': `Triage: ${item.title}` });
  for (const [s, label] of Object.entries(TRIAGE_LABELS)) {
    actions.append(h('button', { class: 'btn', type: 'button', 'data-triage': s, 'aria-pressed': triageState === s ? 'true' : 'false', text: label }));
  }
  li.append(actions);
  return li;
}

function message(text) {
  const li = h('li', { class: 'feed-item muted small feed-message' });
  li.append(h('p', { class: 'summary', text }));
  return li;
}

function renderList() {
  const visible = applyFilters(state.items, state.triage, state.filters);
  if (visible.length) el.list.replaceChildren(...visible.map(renderItem));
  else el.list.replaceChildren(message(state.items.length ? 'No items match these filters.' : 'No feed items in the window yet.'));
  el.status.textContent = `${statusLine(visible.length, state.items.length)} Items older than 30 days leave the feed; Keep and Read-later marks stay in this browser.`;
  const counts = triageCounts(state.items, state.triage);
  for (const span of document.querySelectorAll('[data-count]')) span.textContent = String(counts[span.dataset.count] || 0);
}

function renderFilters() {
  for (const btn of document.querySelectorAll('button[data-filter]')) {
    const group = btn.dataset.filter;
    const value = btn.dataset.value;
    const active = group === 'class' ? state.filters.cls === value : group === 'triage' ? state.filters.tri === value : state.filters.query === value;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
}

function renderHealth() {
  const sources = state.meta && isPlainObject(state.meta.sources) ? state.meta.sources : {};
  const counts = healthCounts(sources);
  if (el.healthSummary) el.healthSummary.textContent = healthSummary(counts);
  if (el.healthRows) {
    const rows = Object.values(sources).map((s) => {
      const reach = s.kind === 'reachability';
      const tr = h('tr', { 'data-status': s.status },
        h('td', { text: s.name }),
        h('td', { text: s.class }),
        h('td', { class: `status status-${s.status}`, text: s.status }),
        h('td', { class: 'num', text: reach ? '—' : String(s.fetched ?? '—') }),
        h('td', { text: s.newestAt ? formatDate(s.newestAt) : '—' }),
        h('td', { text: noteOrError(s, formatDate) }));
      return tr;
    });
    el.healthRows.replaceChildren(...(rows.length ? rows : [h('tr', {}, h('td', { colspan: '6', text: 'No source health recorded yet.' }))]));
  }
  for (const li of document.querySelectorAll('[data-notice]')) {
    const entry = sources[li.dataset.notice];
    const target = li.querySelector('[data-notice-status]');
    if (target) target.textContent = noticeStatus(entry, formatDate);
    li.dataset.status = entry && entry.status ? entry.status : 'unknown';
  }
}

function onFilterClick(btn) {
  const group = btn.dataset.filter;
  const value = btn.dataset.value;
  if (group === 'class') state.filters.cls = value;
  else if (group === 'triage') state.filters.tri = value;
  else state.filters.query = state.filters.query === value ? null : value;
  renderFilters();
  renderList();
}

function onTriageClick(btn) {
  const li = btn.closest('.feed-item');
  if (!li || !li.dataset.id) return;
  const id = li.dataset.id;
  const next = nextTriage(triageOf(state.triage, id), btn.dataset.triage);
  state.triage = withTriage(state.triage, id, next, new Date().toISOString());
  set(KEYS.triage, state.triage);
  renderList();
}

export async function init() {
  el.list = document.querySelector('[data-feed-list]');
  el.status = document.querySelector('[data-feed-status]');
  el.updated = document.querySelector('[data-last-updated]');
  el.healthSummary = document.querySelector('[data-health-summary]');
  el.healthRows = document.querySelector('[data-health-rows]');
  if (!el.list) return;
  state.triage = readTriage();
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-filter], button[data-triage]');
    if (!btn) return;
    if (btn.dataset.filter) onFilterClick(btn);
    else onTriageClick(btn);
  });
  window.addEventListener('storage', (ev) => {
    if (ev.key === KEYS.triage) { state.triage = readTriage(); renderList(); }
  });
  let feed = null;
  try {
    [feed, state.meta] = await Promise.all([loadJson('data/feed.json'), loadJson('data/meta.json').catch(() => null)]);
  } catch (e) {
    el.list.replaceChildren(message('The feed data could not be loaded.'));
    el.list.dataset.feedReady = 'error';
    return;
  }
  state.items = Array.isArray(feed && feed.items) ? feed.items : [];
  if (el.updated) el.updated.textContent = formatLastUpdated(state.meta && state.meta.generatedAt !== undefined ? state.meta.generatedAt : feed && feed.generatedAt);
  renderHealth();
  renderFilters();
  renderList();
  el.list.dataset.feedReady = 'ok';
}
