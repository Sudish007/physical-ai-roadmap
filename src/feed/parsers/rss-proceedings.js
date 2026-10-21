// roboticsproceedings.org volume index (HTML): one `<a href="pNNN.html">Title</a>` per paper. The page carries
// no per-paper dates, so every item is dated with the registry's volumeDate; url = volume base + pNNN.html.
import { ParseError } from '../http.js';

const PAPER_RE = /<a\s+[^>]*href="(p\d+\.html)"[^>]*>([\s\S]*?)<\/a>/gi;

/**
 * @param {string} html
 * @param {{ baseUrl: string, volumeDate: string }} o volumeDate as YYYY-MM-DD
 * @returns {{ items: Array<{ title, url, date, summary }> }}
 */
export function parseRssProceedings(html, { baseUrl, volumeDate }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(volumeDate || ''))) throw new Error('rss-proceedings: volumeDate must be YYYY-MM-DD');
  const items = [];
  const seen = new Set();
  for (const m of String(html || '').matchAll(PAPER_RE)) {
    const file = m[1].toLowerCase();
    if (seen.has(file)) continue;
    seen.add(file);
    items.push({ title: m[2], url: new URL(file, baseUrl).href, date: `${volumeDate}T00:00:00Z`, summary: '' });
  }
  if (!items.length) throw new ParseError('html');
  return { items };
}
