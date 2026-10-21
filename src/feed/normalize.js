// Normalization (design "Normalize"): canonical URL, ids, title/summary cleaning, ISO dates, the 30-day window,
// the §17.3 include rule for the two arXiv category listings, and per-source filters. Pure over its inputs.
import { createHash } from 'node:crypto';
import { INCLUDE_RULES } from '../../sources.config.mjs';
import { arxivIdFromUrl } from './parsers/arxiv.js';

export const WINDOW_DAYS = 30;
export const SUMMARY_MAX = 300;
const TRAILER_RE = /^(Signed-off-by|Co-authored-by):/i;
const TRACKING_PARAMS = new Set(['ref', 'fbclid']);
const NAMED_ENTITIES = {
  lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  copy: '©', reg: '®', trade: '™', laquo: '«', raquo: '»', bull: '•', middot: '·', times: '×', deg: '°', euro: '€', pound: '£',
};

export function decodeEntities(s) {
  return String(s || '')
    .replace(/&#(\d+);/g, (_, n) => { const c = Number(n); return c > 0 && c < 0x110000 ? String.fromCodePoint(c) : ''; })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => { const c = parseInt(h, 16); return c > 0 && c < 0x110000 ? String.fromCodePoint(c) : ''; })
    .replace(/&([a-z]+);/gi, (m, name) => (NAMED_ENTITIES[name.toLowerCase()] !== undefined ? NAMED_ENTITIES[name.toLowerCase()] : m))
    .replace(/&amp;/gi, '&');
}

export function collapse(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

/** HTML → text lines: scripts/styles/comments removed, block ends and <br> become newlines, entities decoded. */
export function stripHtml(html) {
  return String(html || '')
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|li|ul|ol|h[1-6]|tr|blockquote|pre|table|section|article|header|footer|dd|dt|figcaption)\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split('\n')
    .map((line) => collapse(decodeEntities(line)))
    .join('\n');
}

/** Title: tags stripped, entities decoded, whitespace collapsed. */
export function cleanTitle(title) {
  return collapse(stripHtml(title).replace(/\n/g, ' '));
}

/** Plain summary text before truncation: HTML stripped, Signed-off-by/Co-authored-by lines dropped, whitespace collapsed. */
export function plainSummary(raw) {
  const lines = stripHtml(raw).split('\n').map((l) => l.trim()).filter((l) => l && !TRAILER_RE.test(l));
  return collapse(lines.join(' ')).replace(/\s*\.{3}$/, '…');
}

/** ≤300 chars, cut at a word boundary and ended with "…" (never "..."). */
export function truncateSummary(text) {
  const t = collapse(text).replace(/\s*\.{3}$/, '…');
  if (t.length <= SUMMARY_MAX) return t;
  let cut = t.lastIndexOf(' ', SUMMARY_MAX - 1);
  if (cut < SUMMARY_MAX / 2) cut = SUMMARY_MAX - 1;
  return `${t.slice(0, cut).replace(/[\s,;:(\[{\-–—"“‘]+$/u, '')}…`;
}

export function summarize(raw) {
  return truncateSummary(plainSummary(raw));
}

/**
 * Canonical URL: lowercase scheme/host (URL does this), fragment removed, utm_* / ref / fbclid removed, trailing
 * slash removed except at the root, arXiv abs/IDvN → https://arxiv.org/abs/ID. Returns null for non-http(s) or invalid input.
 */
export function canonicalUrl(input) {
  let u;
  try { u = new URL(String(input || '').trim()); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  u.hash = '';
  u.username = '';
  u.password = '';
  for (const k of [...u.searchParams.keys()]) if (/^utm_/i.test(k) || TRACKING_PARAMS.has(k.toLowerCase())) u.searchParams.delete(k);
  if ([...u.searchParams.keys()].length === 0) u.search = '';
  if (/(^|\.)arxiv\.org$/i.test(u.hostname)) {
    const id = arxivIdFromUrl(u.href);
    if (id) return `https://arxiv.org/abs/${id}`;
  }
  if (u.pathname.length > 1 && u.pathname.endsWith('/')) u.pathname = u.pathname.replace(/\/+$/, '');
  return u.href;
}

export function sha1Hex16(text) {
  return createHash('sha1').update(String(text), 'utf8').digest('hex').slice(0, 16);
}

/** 'arxiv:<id>' when the item or its URL carries an arXiv id, else 'url:<first 16 hex of sha1(canonical url)>'. */
export function itemId({ arxivId, url }) {
  const id = arxivId || arxivIdFromUrl(url);
  return id ? `arxiv:${id}` : `url:${sha1Hex16(url)}`;
}

/** ISO 8601 without milliseconds, or null when the value does not parse as a date. */
export function toIso(value) {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(typeof value === 'number' ? value : String(value).trim());
  return Number.isNaN(d.getTime()) ? null : d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function inWindow(iso, now, days = WINDOW_DAYS) {
  const t = Date.parse(iso);
  return Number.isFinite(t) && t >= now.getTime() - days * 86_400_000;
}

/** §17.3: keep when (embodiment OR learning) AND method terms match the text. */
export function passesIncludeRule(text, rules = INCLUDE_RULES) {
  const t = String(text || '');
  return (rules.embodiment.test(t) || rules.learning.test(t)) && rules.method.test(t);
}

/**
 * Normalize the parsed items of one source: drop items without a title, a valid http(s) URL or a parseable date
 * (counted in `skipped`), apply the window, the listings' include rule and the source's filter, sort newest first,
 * cap at source.maxItems. `newestAt` is the newest date among all parsed items (before the window).
 */
export function normalizeSource(rawItems, source, now) {
  const items = [];
  let skipped = 0;
  let newestAt = null;
  for (const raw of rawItems || []) {
    const title = cleanTitle(raw.title);
    const url = canonicalUrl(raw.url);
    const publishedAt = toIso(raw.date);
    if (!title || !url || !publishedAt) { skipped++; continue; }
    if (!newestAt || publishedAt > newestAt) newestAt = publishedAt;
    if (!inWindow(publishedAt, now)) continue;
    const plain = plainSummary(raw.summary);
    const haystack = `${title} ${plain}`;
    if (source.includeRule && !passesIncludeRule(haystack)) continue;
    if (source.filter && !source.filter.test(haystack)) continue;
    items.push({
      id: itemId({ arxivId: raw.arxivId, url }),
      title,
      url,
      source: source.name,
      sourceId: source.id,
      sourceClass: source.class,
      publishedAt,
      summary: truncateSummary(plain),
      matchedQuery: source.label || null,
      alsoMatched: [],
    });
  }
  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
  const cap = Number.isInteger(source.maxItems) && source.maxItems >= 0 ? source.maxItems : items.length;
  return { items: items.slice(0, cap), skipped, newestAt, fetched: (rawItems || []).length };
}
