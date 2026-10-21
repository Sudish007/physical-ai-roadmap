// Data for the home page: §2 session cards, §3 best-10 cards (DR-2 title rule), §14.1 track cards, §0 legend.
import { extractTables, headersMatch, firstLink } from './tables.js';
import { inlinePlainText } from './parse.js';
import { legendFromTables, LEGEND_ORDER } from './labels.js';
import { hostOf } from './links.js';

function sectionBySlug(sections, slug) {
  const s = sections.find((x) => x.slug === slug);
  if (!s) throw new Error(`Section ${slug} not found`);
  return s;
}

function oneTable(tables, headers, where) {
  const m = tables.filter((t) => headersMatch(t, headers));
  if (m.length !== 1) throw new Error(`Expected one table starting with "${headers.join(' · ')}" in ${where}, found ${m.length}`);
  return m[0];
}

/**
 * DR-2 title rule: whichever of {first *italic* span, first "…"/“…” quoted span} starts earliest in
 * the cell's plain text; else the first link text; else the whole cell text.
 */
export function resourceTitle(children) {
  let text = '';
  let italic = null; // { start, text }
  let depth = 0;
  for (const t of children || []) {
    if (t.type === 'em_open') { if (!italic) { italic = { start: text.length, text: '' }; depth = 1; } else if (depth) depth++; continue; }
    if (t.type === 'em_close') { if (italic && depth) { depth--; if (depth === 0) italic.done = true; } continue; }
    const piece = t.type === 'text' || t.type === 'code_inline' ? t.content : (t.type === 'softbreak' || t.type === 'hardbreak') ? ' ' : '';
    if (italic && !italic.done && depth) italic.text += piece;
    text += piece;
  }
  let quoted = null;
  const open = text.search(/["“]/);
  if (open >= 0) {
    const closeCh = text[open] === '“' ? '”' : '"';
    const close = text.indexOf(closeCh, open + 1);
    if (close > open) quoted = { start: open, text: text.slice(open + 1, close) };
  }
  const candidates = [italic, quoted].filter((c) => c && c.text.trim());
  if (candidates.length) {
    candidates.sort((a, b) => a.start - b.start);
    return { title: candidates[0].text.trim(), source: candidates[0] === italic ? 'italic' : 'quoted' };
  }
  const link = firstLink(children);
  if (link && link.text) return { title: link.text, source: 'link' };
  return { title: inlinePlainText(children), source: 'cell' };
}

export function buildHomeData(sections, plainMd, renderInline) {
  const s0 = sectionBySlug(sections, 's00');
  const s2 = sectionBySlug(sections, 's02');
  const s3 = sectionBySlug(sections, 's03');
  const s14 = sectionBySlug(sections, 's14');

  const legendMap = legendFromTables(extractTables(s0.body, plainMd, 'section 0'));
  const legend = LEGEND_ORDER.map((k) => legendMap[k]);

  const sessionsTable = oneTable(extractTables(s2.body, plainMd, 'section 2'), ['Session', 'Time', 'Do', 'Output to keep'], 's02');
  const sessions = sessionsTable.rows.map((row) => {
    const key = /^(\d+)\./.exec(row.cells[0].raw.trim());
    if (!key) throw new Error(`§2 row without a leading number: "${row.cells[0].raw.slice(0, 60)}"`);
    const id = `s02:sessions:${key[1]}`;
    return {
      id,
      title: row.cells[0].text,
      titleHtml: renderInline(row.cells[0].raw),
      time: row.cells[1].text,
      outputHtml: renderInline(row.cells[3].raw),
      href: `s02.html#t-s02-sessions-${key[1]}`,
    };
  });

  const bestTable = oneTable(extractTables(s3.body, plainMd, 'section 3'), ['#', 'Resource (exact identity)'], 's03');
  const best10 = bestTable.rows.map((row) => {
    const n = row.cells[0].text.trim();
    if (!/^\d+$/.test(n)) throw new Error(`§3 row without a number: "${row.cells[0].raw}"`);
    const { title, source } = resourceTitle(row.cells[1].children);
    const link = firstLink(row.cells[1].children);
    return {
      id: `s03:best-10:${n}`,
      n: Number(n),
      title,
      titleSource: source,
      link: link ? { href: link.href, text: link.text, host: hostOf(link.href) } : null,
      purposeHtml: renderInline(row.cells[2].raw),
      timeCostHtml: renderInline(row.cells[4].raw),
      href: `s03.html#t-s03-best-10-${n}`,
    };
  });

  const trackTable = oneTable(extractTables(s14.body, plainMd, 'section 14'), ['Dimension', 'Track A: embodied robot learning and manipulation'], 's14');
  const rowByLabel = (label) => {
    const r = trackTable.rows.find((row) => row.cells[0].raw.trim() === label);
    if (!r) throw new Error(`§14.1 row "${label}" not found`);
    return r;
  };
  const fit = rowByLabel('Fit profile');
  const month24 = rowByLabel('**Month 24 outcome**');
  const branch = rowByLabel('Mandatory 24 h branch');
  const tracks = [1, 2, 3].map((c) => ({
    title: trackTable.headers[c],
    titleHtml: renderInline(trackTable.headerRaw[c]),
    fitProfile: { label: fit.cells[0].text, html: renderInline(fit.cells[c].raw) },
    month24: { label: month24.cells[0].text, html: renderInline(month24.cells[c].raw) },
    branch: { label: branch.cells[0].text, html: renderInline(branch.cells[c].raw) },
    href: 's14.html#s14-1',
  }));

  return { legend, sessions, best10, tracks };
}
