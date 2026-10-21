// Search tokenising, scoring and grouping over search-index.json records. Pure: no DOM access, so
// node:test imports it directly. A record is { p: page file, s: section key, h: heading, a: anchor, x: text }.
//
// Ranking: every query term must match (as a token prefix) in the heading or the text; heading hits weigh
// 3 (exact token 6), text hits 1 each (capped at 3) plus a small bonus for an early first hit. Results are
// capped at 8 per page and 60 overall, then grouped by page in report order (sections 0–19, appendices A–D).

export const PER_GROUP = 8;
export const TOTAL = 60;
export const SNIPPET_WIDTH = 160;

/** Lowercase, ASCII-fold (NFKD, combining marks removed). */
export function fold(text) {
  return String(text).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

/** Tokens: folded, split on non-alphanumerics, one-character tokens dropped. */
export function tokenise(text) {
  return fold(text).split(/[^a-z0-9]+/).filter((t) => t.length > 1);
}

/** Query terms: tokens without duplicates, in typing order. */
export function termsOf(query) {
  return [...new Set(tokenise(query))];
}

/** Pre-tokenise the index once; the original fields are kept. */
export function prepareIndex(records) {
  return (Array.isArray(records) ? records : []).map((r) => ({ ...r, ht: tokenise(r.h), xt: tokenise(r.x) }));
}

/** 2 for an exact token match, 1 for a prefix match, 0 otherwise. */
export function matchToken(token, term) {
  if (token === term) return 2;
  return token.startsWith(term) ? 1 : 0;
}

function bestIn(tokens, term) {
  let best = 0;
  let count = 0;
  let first = -1;
  for (let i = 0; i < tokens.length; i++) {
    const m = matchToken(tokens[i], term);
    if (!m) continue;
    count++;
    if (first < 0) first = i;
    if (m > best) best = m;
  }
  return { best, count, first };
}

/** Score of one prepared record for the terms; 0 when any term is missing from both heading and text. */
export function scoreRecord(rec, terms) {
  let total = 0;
  for (const term of terms) {
    const h = bestIn(rec.ht || [], term);
    const x = bestIn(rec.xt || [], term);
    if (!h.best && !x.best) return 0;
    total += 3 * h.best;
    total += Math.min(x.count, 3) * (x.best === 2 ? 1 : 0.75);
    if (x.first >= 0) total += 1 / (1 + x.first / 8);
  }
  return total;
}

/** Report order of a section key: "0"…"19" then "A"…"D". */
export function pageOrder(sectionKey) {
  const k = String(sectionKey);
  if (/^\d+$/.test(k)) return Number(k);
  return 100 + (k.toUpperCase().charCodeAt(0) - 64);
}

/** Page file → page title, from the title records (anchor "top"). */
export function pageTitles(records) {
  const titles = new Map();
  for (const r of records) if (r.a === 'top' && !titles.has(r.p)) titles.set(r.p, r.h);
  return titles;
}

/**
 * Run a query against a prepared index.
 * @returns {{ terms: string[], matched: number, shown: number, groups: Array<{ page, s, title, hits }> }}
 */
export function search(index, query, { perGroup = PER_GROUP, total = TOTAL } = {}) {
  const terms = termsOf(query);
  if (!terms.length) return { terms, matched: 0, shown: 0, groups: [] };
  const titles = pageTitles(index);
  const hits = [];
  index.forEach((rec, i) => {
    const score = scoreRecord(rec, terms);
    if (score > 0) hits.push({ rec, score, i });
  });
  hits.sort((a, b) => b.score - a.score || pageOrder(a.rec.s) - pageOrder(b.rec.s) || a.i - b.i);
  const perPage = new Map();
  const kept = [];
  for (const h of hits) {
    const n = perPage.get(h.rec.p) || 0;
    if (n >= perGroup) continue;
    perPage.set(h.rec.p, n + 1);
    kept.push(h);
    if (kept.length >= total) break;
  }
  const groups = new Map();
  for (const h of kept) {
    if (!groups.has(h.rec.p)) groups.set(h.rec.p, { page: h.rec.p, s: h.rec.s, title: titles.get(h.rec.p) || h.rec.p, hits: [] });
    groups.get(h.rec.p).hits.push({ p: h.rec.p, s: h.rec.s, h: h.rec.h, a: h.rec.a, x: h.rec.x, score: h.score });
  }
  const ordered = [...groups.values()].sort((a, b) => pageOrder(a.s) - pageOrder(b.s));
  return { terms, matched: hits.length, shown: kept.length, groups: ordered };
}

const WORD_RE = /[\p{L}\p{N}]+/gu;

/** Does `word` (any script) start with one of the folded terms? */
export function wordMatches(word, terms) {
  const w = fold(word);
  return terms.some((t) => w.startsWith(t));
}

/** Window of `text` around the first matching word, cut on word boundaries, with … where text was removed. */
export function snippetAround(text, terms, width = SNIPPET_WIDTH) {
  const t = String(text);
  if (t.length <= width) return t;
  let at = -1;
  for (const m of t.matchAll(WORD_RE)) {
    if (wordMatches(m[0], terms)) { at = m.index; break; }
  }
  if (at < 0) return `${t.slice(0, width).replace(/\s+\S*$/, '')}…`;
  let start = Math.max(0, at - Math.floor(width / 3));
  if (start > 0) {
    const sp = t.indexOf(' ', start);
    if (sp >= 0 && sp < at) start = sp + 1;
  }
  let end = Math.min(t.length, start + width);
  if (end < t.length) {
    const sp = t.lastIndexOf(' ', end);
    if (sp > at) end = sp;
  }
  return `${start > 0 ? '…' : ''}${t.slice(start, end).trim()}${end < t.length ? '…' : ''}`;
}

/** Split `text` into parts; parts whose word starts with a term carry mark: true (for <mark>). */
export function highlight(text, terms) {
  const t = String(text);
  const parts = [];
  let last = 0;
  for (const m of t.matchAll(WORD_RE)) {
    if (!wordMatches(m[0], terms)) continue;
    if (m.index > last) parts.push({ text: t.slice(last, m.index), mark: false });
    parts.push({ text: m[0], mark: true });
    last = m.index + m[0].length;
  }
  if (last < t.length) parts.push({ text: t.slice(last), mark: false });
  return parts;
}
