// Home page: "Latest from the feed" (5 newest items not dropped in triage) and the feed's last-updated
// line, read from data/feed.json and data/meta.json. Progress rows are filled by tracker.js (FEAT-004).
import { KEYS, get, isPlainObject } from './lib/store.js';
import { formatLastUpdated, formatDate } from './lib/format.js';

export const LATEST_COUNT = 5;

async function loadJson(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function time(item) {
  const t = new Date(item.publishedAt || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Newest `count` items whose id is not marked drop in the triage map. Pure over its inputs. */
export function latestItems(items, triage, count = LATEST_COUNT) {
  const dropped = (id) => !!(triage && triage[id] && triage[id].state === 'drop');
  return (Array.isArray(items) ? items : [])
    .filter((it) => it && typeof it.id === 'string' && typeof it.title === 'string' && typeof it.url === 'string' && !dropped(it.id))
    .sort((a, b) => time(b) - time(a))
    .slice(0, count);
}

function span(text) {
  const s = document.createElement('span');
  s.textContent = text;
  return s;
}

function renderItem(item) {
  const li = document.createElement('li');
  li.className = 'feed-brief';
  const h3 = document.createElement('h3');
  const a = document.createElement('a');
  a.href = item.url;
  a.rel = 'noopener external';
  a.textContent = item.title;
  h3.append(a);
  const meta = document.createElement('div');
  meta.className = 'meta';
  if (item.source) meta.append(span(item.source));
  const date = formatDate(item.publishedAt);
  if (date) meta.append(span(date));
  const tag = item.matchedQuery || item.sourceClass;
  if (tag) meta.append(span(tag));
  li.append(h3, meta);
  return li;
}

function message(list, text) {
  const li = document.createElement('li');
  li.className = 'feed-brief muted small';
  li.textContent = text;
  list.replaceChildren(li);
}

export async function init() {
  const list = document.getElementById('latest-feed');
  const note = document.querySelector('[data-feed-updated]');
  const updated = note ? note.querySelector('[data-last-updated]') : null;
  if (!list) return;
  let feed;
  let meta;
  try {
    [feed, meta] = await Promise.all([loadJson('data/feed.json'), loadJson('data/meta.json').catch(() => null)]);
  } catch (e) {
    message(list, 'The feed data could not be loaded.');
    return;
  }
  const triage = get(KEYS.triage, isPlainObject) || {};
  const items = latestItems(feed && feed.items, triage);
  if (items.length) list.replaceChildren(...items.map(renderItem));
  else message(list, 'No feed items yet.');
  if (updated) {
    updated.textContent = formatLastUpdated(meta && meta.generatedAt !== undefined ? meta.generatedAt : feed && feed.generatedAt);
    note.hidden = false;
  }
}
