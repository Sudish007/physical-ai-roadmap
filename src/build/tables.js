// Tables: scroll container, data-cols (no style attributes — DR-1), sticky-first classification,
// numeric columns, totals rows, the DR-8 row-arity assertion, and checkbox injection for trackable rows (OF-2).
import { inlinePlainText } from './parse.js';

const WIDE_FROM_COLS = 5;
const STICKY_MAX_AVG_FIRST_CELL = 24;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** markdown-it 14.1.0's escapedSplit (backslash escapes only — backticks do NOT protect a pipe). */
export function escapedSplit(str) {
  const result = [];
  let pos = 0, lastPos = 0, current = '', isEscaped = false;
  const max = str.length;
  let ch = str.charCodeAt(pos);
  while (pos < max) {
    if (ch === 0x7c) {
      if (!isEscaped) { result.push(current + str.substring(lastPos, pos)); current = ''; lastPos = pos + 1; }
      else { current += str.substring(lastPos, pos - 1); lastPos = pos; }
    }
    isEscaped = ch === 0x5c;
    pos++;
    ch = str.charCodeAt(pos);
  }
  result.push(current + str.substring(lastPos));
  if (result.length && result[0].trim() === '') result.shift();
  if (result.length && result[result.length - 1].trim() === '') result.pop();
  return result;
}

/** DR-8: every body row of every table must have exactly the header's cell count. */
export function assertRowArity(srcLines, map, label) {
  const [start, end] = map;
  const headerCount = escapedSplit(srcLines[start].trim()).length;
  for (let i = start + 2; i < end; i++) {
    const line = srcLines[i].trim();
    if (!line.includes('|')) continue;
    const n = escapedSplit(line).length;
    if (n !== headerCount) {
      throw new Error(`Table row has ${n} cells but the header has ${headerCount} (${label}, line ${i + 1}): "${line.slice(0, 80)}"`);
    }
  }
}

function alignOf(token) {
  const style = token.attrGet('style') || '';
  if (/text-align:\s*right/.test(style)) return 'right';
  if (/text-align:\s*center/.test(style)) return 'center';
  if (/text-align:\s*left/.test(style)) return 'left';
  return '';
}

function isTotalRow(firstCellInline) {
  const ch = (firstCellInline && firstCellInline.children || []).filter((t) => !(t.type === 'text' && t.content === ''));
  if (!ch.length || ch[0].type !== 'strong_open') return false;
  const text = inlinePlainText(ch);
  return /^totals?\b/i.test(text) || /\btotal$/i.test(text);
}

export function checkboxHtml(id, ariaLabel) {
  return `<label class="check"><input type="checkbox" data-track="${esc(id)}" aria-label="${esc(ariaLabel)}"></label>`;
}

export function tablesPlugin(md) {
  md.core.ruler.push('tables', (state) => {
    const env = state.env || {};
    const tokens = state.tokens;
    const srcLines = state.src.split('\n');
    let ordinal = -1;
    let i = 0;
    while (i < tokens.length) {
      const tok = tokens[i];
      if (tok.type !== 'table_open') { i++; continue; }
      ordinal++;
      if (tok.map) assertRowArity(srcLines, tok.map, env.label || 'content');
      const rowsForTable = env.rows && env.rows.get(ordinal);
      // Walk the table
      let j = i + 1;
      let cols = 0;
      const aligns = [];
      let inBody = false;
      let rowIdx = -1;
      let firstCellLens = [];
      let cellIdx = -1;
      let currentRowOpen = null;
      let currentEntries = null;
      for (; j < tokens.length && tokens[j].type !== 'table_close'; j++) {
        const t = tokens[j];
        if (t.type === 'th_open') { aligns.push(alignOf(t)); cols++; applyAlign(t); }
        if (t.type === 'tbody_open') inBody = true;
        if (t.type === 'tr_open' && inBody) {
          rowIdx++;
          cellIdx = -1;
          currentRowOpen = t;
          currentEntries = rowsForTable ? rowsForTable.get(rowIdx) || null : null;
          if (currentEntries && currentEntries.length) {
            const withAnchor = currentEntries.find((e) => e.rowId);
            if (withAnchor) t.attrSet('id', withAnchor.rowId);
          }
          // totals row?
          const firstInline = tokens[j + 2];
          if (tokens[j + 1] && tokens[j + 1].type === 'td_open' && firstInline && firstInline.type === 'inline' && isTotalRow(firstInline)) {
            t.attrJoin('class', 'total');
          }
        }
        if (t.type === 'td_open' && inBody) {
          cellIdx++;
          applyAlign(t);
          const inline = tokens[j + 1];
          if (cellIdx === 0 && inline && inline.type === 'inline') firstCellLens.push(inlinePlainText(inline.children).length);
          if (currentEntries && inline && inline.type === 'inline') {
            for (const e of currentEntries) {
              if (!e.checkbox || e.checkboxColumn !== cellIdx + 1) continue;
              const cb = new state.Token('html_inline', '', 0);
              cb.content = checkboxHtml(e.id, e.ariaLabel);
              inline.children = inline.children || [];
              inline.children.unshift(cb);
            }
          }
        }
      }
      void currentRowOpen;
      tok.attrSet('data-cols', String(cols));
      if (cols >= WIDE_FROM_COLS) tok.attrJoin('class', 'wide');
      const avg = firstCellLens.length ? firstCellLens.reduce((a, b) => a + b, 0) / firstCellLens.length : 0;
      if (firstCellLens.length && avg < STICKY_MAX_AVG_FIRST_CELL) tok.attrSet('data-sticky-first', '');
      i = j + 1;
    }
  });

  function applyAlign(t) {
    const a = alignOf(t);
    const idx = t.attrIndex('style');
    if (idx >= 0) t.attrs.splice(idx, 1);
    if (a === 'right') t.attrJoin('class', 'num');
    else if (a === 'center') t.attrJoin('class', 'center');
  }

  md.renderer.rules.table_open = (tokens, idx, options, env, self) => `<div class="table-wrap">${self.renderToken(tokens, idx, options)}`;
  md.renderer.rules.table_close = (tokens, idx, options, env, self) => `${self.renderToken(tokens, idx, options)}</div>\n`;
}

/**
 * Structural view of every table in a markdown body (header texts, alignment, body rows with raw
 * markdown, inline children and plain text). Uses a plain markdown-it instance so block structure
 * matches the rendering pass table for table.
 */
export function extractTables(body, plainMd, label = 'content') {
  const tokens = plainMd.parse(body, {});
  const srcLines = body.replace(/\r\n?/g, '\n').split('\n');
  const tables = [];
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].type !== 'table_open') { i++; continue; }
    if (tokens[i].map) assertRowArity(srcLines, tokens[i].map, label);
    const table = { ordinal: tables.length, map: tokens[i].map, headers: [], headerRaw: [], aligns: [], rows: [] };
    let inBody = false;
    let row = null;
    let j = i + 1;
    for (; j < tokens.length && tokens[j].type !== 'table_close'; j++) {
      const t = tokens[j];
      if (t.type === 'th_open') {
        const inline = tokens[j + 1];
        table.headers.push(inlinePlainText(inline.children));
        table.headerRaw.push(inline.content);
        table.aligns.push(alignOf(t));
      } else if (t.type === 'tbody_open') inBody = true;
      else if (t.type === 'tr_open' && inBody) { row = { index: table.rows.length, cells: [] }; table.rows.push(row); }
      else if (t.type === 'td_open' && inBody) {
        const inline = tokens[j + 1];
        row.cells.push({ raw: inline.content, children: inline.children, text: inlinePlainText(inline.children), align: alignOf(t) });
      }
    }
    table.signature = table.headers.join(' · ');
    tables.push(table);
    i = j + 1;
  }
  return tables;
}

/** Does a table start with the given header cells? */
export function headersMatch(table, headers) {
  return headers.every((h, k) => table.headers[k] === h);
}

/** Text of the first *italic* span in inline children, or null. */
export function firstItalicText(children) {
  const i = (children || []).findIndex((t) => t.type === 'em_open');
  if (i < 0) return null;
  const close = children.findIndex((t, k) => k > i && t.type === 'em_close');
  return inlinePlainText(children.slice(i + 1, close < 0 ? undefined : close));
}

/** { text, href } of the first link in inline children, or null. */
export function firstLink(children) {
  const i = (children || []).findIndex((t) => t.type === 'link_open');
  if (i < 0) return null;
  const close = children.findIndex((t, k) => k > i && t.type === 'link_close');
  return { text: inlinePlainText(children.slice(i + 1, close < 0 ? undefined : close)), href: children[i].attrGet('href') };
}
