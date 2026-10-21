// [FACT] / [JUDGMENT] / [UNCERTAIN] / [HYPE/DEMO] / [STALE-BUT-FOUNDATIONAL] labels → visible chips (D6).
// The chip replaces only the bracketed text; everything around it is untouched.
import { LABEL_KINDS } from './content-map.mjs';

export const LABEL_RE = /\[(FACT|JUDGMENT|UNCERTAIN|HYPE\/DEMO|STALE-BUT-FOUNDATIONAL)([^\]]{0,160})\](?!\()/g;
const KEYWORD_RE = /\b(FACT|JUDGMENT|UNCERTAIN|HYPE\/DEMO|STALE-BUT-FOUNDATIONAL)\b/g;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Chip class for a bracket label: the first keyword's kind, or chip-mixed for compound labels. */
export function chipKind(keyword, rest) {
  const base = LABEL_KINDS[keyword];
  const others = (rest.match(KEYWORD_RE) || []).filter((k) => k !== keyword);
  if (others.length || rest.includes(' + ')) return 'mixed';
  return base;
}

export function chipHtml(keyword, rest, legend) {
  const kind = chipKind(keyword, rest);
  const meaning = legend && legend[LABEL_KINDS[keyword]] ? legend[LABEL_KINDS[keyword]].meaning : '';
  const title = meaning ? ` title="${esc(meaning)}"` : '';
  return `<span class="chip chip-${kind}"${title}>${esc(keyword + rest)}</span>`;
}

/** Count of bracket labels in a markdown source (the number the rendered chips must match). */
export function countLabels(markdown) {
  return (String(markdown).match(LABEL_RE) || []).length;
}

/**
 * The §0 Labels table → { fact: { label: 'FACT', meaning }, … }. Asserts the five rows.
 * `tables` is the extractTables() output of §0.
 */
export function legendFromTables(tables) {
  const t = tables.find((x) => x.headers[0] === 'Label' && x.headers[1] === 'Meaning');
  if (!t) throw new Error('§0 Labels table (Label · Meaning) not found');
  if (t.rows.length !== 5) throw new Error(`§0 Labels table has ${t.rows.length} rows, expected 5`);
  const legend = {};
  for (const row of t.rows) {
    const m = /^\[([^\]]+)\]$/.exec(row.cells[0].text);
    if (!m || !LABEL_KINDS[m[1]]) throw new Error(`Unexpected label row in §0: "${row.cells[0].text}"`);
    legend[LABEL_KINDS[m[1]]] = { label: m[1], kind: LABEL_KINDS[m[1]], meaning: row.cells[1].text, meaningMarkdown: row.cells[1].raw };
  }
  if (Object.keys(legend).length !== 5) throw new Error('§0 Labels table does not define the five labels');
  return legend;
}

export const LEGEND_ORDER = Object.freeze(['fact', 'judgment', 'uncertain', 'hype', 'stale']);

export function labelsPlugin(md) {
  md.core.ruler.push('labels', (state) => {
    const env = state.env || {};
    for (const block of state.tokens) {
      if (block.type !== 'inline' || !block.children) continue;
      const out = [];
      for (const tok of block.children) {
        if (tok.type !== 'text' || !tok.content.includes('[')) { out.push(tok); continue; }
        const text = tok.content;
        LABEL_RE.lastIndex = 0;
        let last = 0;
        let m;
        const pieces = [];
        while ((m = LABEL_RE.exec(text))) {
          if (m.index > last) pieces.push(['text', text.slice(last, m.index)]);
          pieces.push(['html_inline', chipHtml(m[1], m[2], env.legend)]);
          if (env.stats) env.stats.chips++;
          last = m.index + m[0].length;
        }
        if (!pieces.length) { out.push(tok); continue; }
        if (last < text.length) pieces.push(['text', text.slice(last)]);
        for (const [type, content] of pieces) {
          const t = new state.Token(type, '', 0);
          t.content = content;
          t.level = tok.level;
          out.push(t);
        }
      }
      block.children = out;
    }
  });
}
