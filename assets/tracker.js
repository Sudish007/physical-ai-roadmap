// Local progress tracker (design "Tracker", OF-2, D6). Runs on every page: binds every input[data-track]
// through one delegated change listener, persists { items: { id: { done: true, at } } } under
// physical-ai-roadmap.v1.tracker (unticking deletes), keeps every input that shares an id in sync (same
// page, and other tabs through the storage event), marks checked rows/cards with data-done, and fills every
// [data-set] progress row (right rail, inline rail summary, home) from REAL counts: manifest ids present in
// the state, stale ids ignored, the plan set counted overall only once a plan is chosen. Bars are sized
// through the CSSOM (el.style.width), which the CSP allows; the HTML carries no style attributes (DR-1).
//
// Module scope touches no DOM so node:test can import the pure helpers (nextState, isDone, ROW_SELECTOR).
import { KEYS, get, set, isPlainObject, trackerShape } from './lib/store.js';
import { progress, percent } from './lib/derive.js';

/** The element that gets data-done when a checkbox inside it is ticked. */
export const ROW_SELECTOR = 'tr, .card, .month-list > li, .gate-list > li';
export const MANIFEST_URL = 'tracker-manifest.json';

let state = { items: {} };
let manifestPromise = null;
let started = false;

export function readState() {
  return get(KEYS.tracker, trackerShape) || { items: {} };
}

/** Pure reducer: a new state with `id` marked done (tick) or removed (untick). Other ids are untouched. */
export function nextState(current, id, done, at = new Date().toISOString()) {
  const items = { ...(trackerShape(current) ? current.items : {}) };
  if (done) items[id] = { done: true, at };
  else delete items[id];
  return { items };
}

export function isDone(st, id) {
  const e = trackerShape(st) ? st.items[id] : null;
  return isPlainObject(e) && e.done === true;
}

/** Current in-memory state (tests and plan.js read it; writes go through setDone). */
export function currentState() {
  return state;
}

function markRow(input) {
  const row = input.closest(ROW_SELECTOR);
  if (!row) return;
  const any = [...row.querySelectorAll('input[data-track]')].some((i) => i.checked);
  if (any) row.setAttribute('data-done', '');
  else row.removeAttribute('data-done');
}

/** Set every input[data-track] under `root` from the state and mark its row. plan.js calls this after rendering. */
export function applyState(root = document) {
  for (const input of root.querySelectorAll('input[data-track]')) {
    input.checked = isDone(state, input.dataset.track);
    markRow(input);
  }
}

function syncInputs(id, checked) {
  for (const input of document.querySelectorAll(`input[data-track="${id}"]`)) {
    input.checked = checked;
    markRow(input);
  }
}

/** Tick or untick `id`: write storage, sync every input sharing the id, refresh the counts. */
export function setDone(id, done) {
  state = nextState(state, id, done);
  set(KEYS.tracker, state);
  syncInputs(id, done);
  return updateCounts();
}

function onChange(e) {
  const input = e.target;
  if (!input || input.tagName !== 'INPUT' || input.type !== 'checkbox' || !input.dataset.track) return;
  setDone(input.dataset.track, input.checked);
}

function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .catch(() => { manifestPromise = null; return null; });
  }
  return manifestPromise;
}

function fillRow(row, s) {
  const done = row.querySelector('[data-done]');
  if (done) done.textContent = String(s.done);
  const total = row.querySelector('[data-total]');
  if (total) total.textContent = String(s.total);
  const bar = row.querySelector('[data-bar]');
  if (bar) bar.style.width = `${percent(s.done, s.total)}%`;
}

/** 'On this page · Rungs 1 of 9 done' — the phone rail summary (design "Page inventory", section pages). */
export function summaryCounts(sets) {
  return sets.map((s) => (s.id === 'questions' ? ` · ${s.short} ${s.done} of ${s.total}` : ` · ${s.short} ${s.done} of ${s.total} done`)).join('');
}

function summarize(bySet) {
  for (const details of document.querySelectorAll('details.onpage-inline')) {
    const summary = details.querySelector(':scope > summary');
    if (!summary) continue;
    const sets = [...details.querySelectorAll('li[data-set]')].map((li) => bySet.get(li.dataset.set)).filter(Boolean);
    let span = summary.querySelector('[data-summary-counts]');
    if (!span) {
      span = document.createElement('span');
      span.className = 'muted';
      span.setAttribute('data-summary-counts', '');
      summary.append(span);
    }
    span.textContent = summaryCounts(sets);
  }
}

/**
 * Fill every [data-set] row on the page and the home overall line. The home row data-set="plan" resolves to
 * the chosen plan's set (label included) and is left at its static text while no plan is chosen.
 * Resolves to the progress object, or null when the page has no rows or the manifest is unavailable.
 */
export async function updateCounts() {
  const rows = document.querySelectorAll('[data-set]');
  const overallDone = document.querySelector('[data-overall-done]');
  if (!rows.length && !overallDone) return null;
  const manifest = await loadManifest();
  if (!manifest) return null;
  const plan = get(KEYS.plan, isPlainObject);
  const p = progress(manifest, state, plan);
  const bySet = new Map(p.sets.map((s) => [s.id, s]));
  if (p.answers) bySet.set(p.answers.id, p.answers);
  for (const row of rows) {
    let s;
    if (row.dataset.set === 'plan') {
      if (!p.planSet) continue;
      s = bySet.get(p.planSet);
      const label = row.querySelector(':scope > span');
      if (label && s) label.textContent = s.label;
    } else {
      s = bySet.get(row.dataset.set);
    }
    if (s) fillRow(row, s);
  }
  if (overallDone) overallDone.textContent = String(p.overall.done);
  const overallTotal = document.querySelector('[data-overall-total]');
  if (overallTotal) overallTotal.textContent = String(p.overall.total);
  summarize(bySet);
  return p;
}

/** Re-read storage (after an import, a reset or another tab's write) and repaint inputs and counts. */
export function refresh() {
  state = readState();
  applyState();
  return updateCounts();
}

function onStorage(e) {
  if (e.key === null || e.key === KEYS.tracker) refresh();
  else if (e.key === KEYS.plan) updateCounts();
}

export function init() {
  if (started) return;
  started = true;
  state = readState();
  applyState();
  document.addEventListener('change', onChange);
  window.addEventListener('storage', onStorage);
  window.addEventListener('pageshow', (e) => { if (e.persisted) refresh(); });
  updateCounts();
}
