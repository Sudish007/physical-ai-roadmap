// search-index.json: one record per paragraph, list item, table row and fenced block, plus one per page title.
// { p: page file, s: section key, h: nearest h3 text (or page title), a: anchor id, x: plain text ≤ 400 chars }
import { inlinePlainText } from './parse.js';

export const SNIPPET_MAX = 400;
export const INDEX_MAX_BYTES = 500 * 1024;

export function snippet(text, max = SNIPPET_MAX) {
  const t = String(text).replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.lastIndexOf(' ', max - 1);
  return `${t.slice(0, cut > max * 0.6 ? cut : max - 1).trimEnd()}…`;
}

/**
 * @param page   { file, key, title }     // title = page h1 plain text
 * @param tokens md.parse(body, env) output (plugins applied)
 */
export function indexTokens(page, tokens, frontTitle) {
  const records = [];
  let heading = { text: frontTitle || page.title, id: 'top' };
  const push = (text, anchor) => {
    const x = snippet(text);
    if (!x) return;
    records.push({ p: page.file, s: page.key, h: heading.text, a: anchor || heading.id, x });
  };
  let i = 0;
  let inTbody = false;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t.type === 'heading_open') {
      const inline = tokens[i + 1];
      const text = inlinePlainText(inline.children);
      if (t.meta && t.meta.id) heading = { text, id: t.meta.id };
      push(text, t.meta && t.meta.id ? t.meta.id : undefined);
      i += 3;
      continue;
    }
    if (t.type === 'paragraph_open') {
      const inline = tokens[i + 1];
      push(inlinePlainText(inline.children));
      i += 3;
      continue;
    }
    if (t.type === 'fence' || t.type === 'code_block') {
      push(t.content);
      i++;
      continue;
    }
    if (t.type === 'tbody_open') inTbody = true;
    if (t.type === 'tbody_close') inTbody = false;
    if (t.type === 'tr_open' && inTbody) {
      const cells = [];
      let j = i + 1;
      for (; j < tokens.length && tokens[j].type !== 'tr_close'; j++) {
        if (tokens[j].type === 'inline') cells.push(inlinePlainText(tokens[j].children));
      }
      push(cells.filter(Boolean).join(' · '), t.attrGet('id') || undefined);
      i = j + 1;
      continue;
    }
    i++;
  }
  return records;
}

export function titleRecord(page) {
  return { p: page.file, s: page.key, h: page.title, a: 'top', x: page.title };
}

export function assertIndexSize(json) {
  const bytes = Buffer.byteLength(json, 'utf8');
  if (bytes > INDEX_MAX_BYTES) throw new Error(`search-index.json is ${bytes} bytes, above the ${INDEX_MAX_BYTES} byte cap`);
  return bytes;
}
