// Atom `entry` and RSS 2.0 `item`: title, link (href or text), the first of published | updated | pubDate |
// dc:date, and the first of summary | content | description | content:encoded (HTML is stripped later by normalize).
import { parseXml, textOf, toArray } from './xml.js';

function atomLink(links) {
  const list = toArray(links).filter((l) => l && typeof l === 'object' && l['@_href']);
  const alt = list.find((l) => !l['@_rel'] || l['@_rel'] === 'alternate');
  return (alt || list[0] || {})['@_href'] || '';
}

function rssLink(item) {
  const link = textOf(item.link);
  if (link) return link;
  const guid = toArray(item.guid)[0];
  if (guid && typeof guid === 'object' && guid['@_isPermaLink'] === 'false') return '';
  const g = textOf(guid);
  return /^https?:\/\//i.test(g) ? g : '';
}

const firstText = (node, keys) => {
  for (const k of keys) {
    const v = textOf(node[k]);
    if (v) return v;
  }
  return '';
};

/** @returns {{ format: 'atom'|'rss', items: Array<{ title, url, date, summary }> }} */
export function parseAtomRss(text) {
  const doc = parseXml(text);
  if (doc.feed) {
    const items = toArray(doc.feed.entry).map((e) => ({
      title: textOf(e.title),
      url: atomLink(e.link),
      date: firstText(e, ['published', 'updated', 'pubDate', 'dc:date']),
      summary: firstText(e, ['summary', 'content', 'description', 'content:encoded']),
    }));
    return { format: 'atom', items };
  }
  const channel = toArray(doc.rss.channel)[0] || {};
  const items = toArray(channel.item).map((i) => ({
    title: textOf(i.title),
    url: rssLink(i),
    date: firstText(i, ['published', 'updated', 'pubDate', 'dc:date']),
    summary: firstText(i, ['summary', 'content', 'description', 'content:encoded']),
  }));
  return { format: 'rss', items };
}
