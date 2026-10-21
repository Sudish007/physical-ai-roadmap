// arXiv export API (Atom). id → arXiv identifier without the version, title, summary, published, updated,
// categories, abs link. publishedAt = updated (so a new version re-surfaces), falling back to published.
import { parseXml, textOf, toArray } from './xml.js';
import { ParseError } from '../http.js';

/** "http://arxiv.org/abs/2610.28632v1" → "2610.28632"; "…/abs/math/0601001v2" → "math/0601001"; null otherwise. */
export function arxivIdFromUrl(url) {
  const m = /arxiv\.org\/(?:abs|pdf)\/(.+?)(?:v\d+)?(?:\.pdf)?(?:[?#].*)?$/i.exec(String(url || '').trim());
  return m ? m[1] : null;
}

/**
 * @returns {{ items: Array<{ arxivId, title, url, date, summary, published, updated, categories }>, totalResults: number|null }}
 */
export function parseArxiv(text) {
  const doc = parseXml(text);
  if (!doc.feed) throw new ParseError('xml');
  const feed = doc.feed;
  const total = Number(textOf(feed['opensearch:totalResults']));
  const items = [];
  for (const e of toArray(feed.entry)) {
    const idUrl = textOf(e.id);
    const arxivId = arxivIdFromUrl(idUrl);
    const updated = textOf(e.updated);
    const published = textOf(e.published);
    items.push({
      arxivId,
      title: textOf(e.title),
      url: arxivId ? `https://arxiv.org/abs/${arxivId}` : idUrl,
      date: updated || published,
      published,
      updated,
      summary: textOf(e.summary),
      categories: toArray(e.category).map((c) => (c && c['@_term']) || '').filter(Boolean),
    });
  }
  return { items, totalResults: Number.isFinite(total) ? total : null };
}
