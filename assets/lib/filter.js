// Feed page logic without DOM access (node:test imports it directly): class / query / triage filters,
// newest-first sort (the pipeline's order), triage counts, source-health counts and the exact strings the
// page shows for health and failures (DR-9 spacing, D6 "Unavailable since <date> · <error class>").

export const CLASS_LABELS = Object.freeze({ arxiv: 'arXiv', proceedings: 'Proceedings', lab: 'Labs', release: 'Releases', regulator: 'Regulators' });
export const TRIAGE_STATES = Object.freeze(['keep', 'later', 'drop']);
/** The query-filter value that stands for the two arXiv category listings ("cs.RO listing", "eess.SY listing"). */
export const LISTINGS = 'listings';
export const HEALTH_GLYPHS = Object.freeze({ ok: '■', empty: '□', failed: '✕' });

export function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Items with the fields the page needs, newest first; the pipeline's own tiebreak (id) keeps the order stable. */
export function sortNewest(items) {
  return (Array.isArray(items) ? items : [])
    .filter((it) => it && typeof it.id === 'string' && typeof it.title === 'string' && typeof it.url === 'string' && typeof it.publishedAt === 'string')
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
}

/** Triage state of an item ('keep' | 'later' | 'drop') or null. */
export function triageOf(triage, id) {
  const e = isPlainObject(triage) ? triage[id] : null;
  return e && TRIAGE_STATES.includes(e.state) ? e.state : null;
}

/** Clicking the current state clears it; clicking another sets it. */
export function nextTriage(current, clicked) {
  return current === clicked ? null : clicked;
}

/** New triage map after a click (pure). */
export function withTriage(triage, id, state, at) {
  const out = { ...(isPlainObject(triage) ? triage : {}) };
  if (state) out[id] = { state, at };
  else delete out[id];
  return out;
}

export function labelsOf(item) {
  return [item.matchedQuery, ...(Array.isArray(item.alsoMatched) ? item.alsoMatched : [])].filter((l) => typeof l === 'string' && l);
}

/** Query filter: null → every item; LISTINGS → items from a category listing; else the §17.3 label in matchedQuery or alsoMatched. */
export function matchesQuery(item, query) {
  if (!query) return true;
  const labels = labelsOf(item);
  if (query === LISTINGS) return labels.some((l) => / listing$/.test(l));
  return labels.includes(query);
}

/**
 * @param {Array} items feed items
 * @param {object} triage the stored triage map
 * @param {{ cls?: string, query?: string|null, tri?: string }} f cls 'all' | a class; tri 'all' (hides dropped) | 'keep' | 'later' | 'drop'
 */
export function applyFilters(items, triage, { cls = 'all', query = null, tri = 'all' } = {}) {
  return sortNewest(items).filter((it) => {
    if (cls !== 'all' && it.sourceClass !== cls) return false;
    if (!matchesQuery(it, query)) return false;
    const state = triageOf(triage, it.id);
    if (tri === 'all') return state !== 'drop';
    return state === tri;
  });
}

/** Counts for the triage chips, over the items in the feed only (stale ids in storage do not count). */
export function triageCounts(items, triage) {
  const counts = { keep: 0, later: 0, drop: 0 };
  for (const it of Array.isArray(items) ? items : []) {
    const s = it && triageOf(triage, it.id);
    if (s) counts[s]++;
  }
  return counts;
}

export function statusLine(shown, total) {
  return `Showing ${shown} of ${total} items in the window.`;
}

/** { ok, empty, failed, total } over meta.sources. */
export function healthCounts(metaSources) {
  const counts = { ok: 0, empty: 0, failed: 0, total: 0 };
  for (const s of Object.values(isPlainObject(metaSources) ? metaSources : {})) {
    if (!s || !(s.status in HEALTH_GLYPHS)) continue;
    counts[s.status]++;
    counts.total++;
  }
  return counts;
}

/** '■ ok 17 · □ empty 6 · ✕ failed 1 · 24 sources' (DR-9: a space after each glyph). */
export function healthSummary(counts) {
  return `${HEALTH_GLYPHS.ok} ok ${counts.ok} · ${HEALTH_GLYPHS.empty} empty ${counts.empty} · ${HEALTH_GLYPHS.failed} failed ${counts.failed} · ${counts.total} sources`;
}

/** 'Unavailable since 21 Oct 2026 · tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE' for a failed source (D6). */
export function unavailableText(entry, formatDate) {
  const since = formatDate(entry.unavailableSince || entry.checkedAt) || 'an unknown date';
  return `Unavailable since ${since} · ${entry.error || 'error'}`;
}

/** The "Note or error" cell: the failure line for failed sources, the registry note otherwise. */
export function noteOrError(entry, formatDate) {
  if (entry.status === 'failed') return unavailableText(entry, formatDate);
  return entry.note || '';
}

/** The reachability status shown on the notices card: 'HTTP 200 · 21 Oct 2026' or the Unavailable line. */
export function noticeStatus(entry, formatDate) {
  if (!entry) return 'not checked yet';
  if (entry.status === 'failed') return unavailableText(entry, formatDate);
  return `HTTP ${entry.httpStatus} · ${formatDate(entry.checkedAt)}`;
}

export function hostLabel(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}
