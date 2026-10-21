// §N / §N.M cross-references → links to the generated section pages (D11 a).
// A core rule over inline text tokens; nothing outside a match is touched.
import { CROSSREF_EXCEPTIONS } from './content-map.mjs';

export const CROSSREF_RE = /(?<!§)§(\d{1,2})(?:\.(\d{1,2}))?(?!\d)(?!\.\d)(?!\()/g;

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Spans [start, end) of exception literals inside `text`. */
function exceptionSpans(text, literals) {
  const spans = [];
  for (const lit of literals) {
    let from = 0;
    for (;;) {
      const i = text.indexOf(lit, from);
      if (i < 0) break;
      spans.push([i, i + lit.length, lit]);
      from = i + lit.length;
    }
  }
  return spans;
}

/**
 * Decide what a match becomes.
 * @returns {{ href?: string, skip?: string }}
 */
export function resolveCrossref(match, headingIndex) {
  const n = Number(match[1]);
  if (n > 19) return { skip: 'N>19' };
  const file = `s${String(n).padStart(2, '0')}.html`;
  if (match[2] === undefined) return { href: file };
  const id = `s${n}-${Number(match[2])}`;
  const set = headingIndex && headingIndex.get(n);
  if (set && set.has(id)) return { href: `${file}#${id}` };
  return { skip: 'missing heading', warn: true };
}

/** Record a skipped match on env.stats, if stats are being collected. */
function skipped(env, ref, reason, warn) {
  const stats = env && env.stats;
  if (!stats) return;
  stats.crossrefs.skipped.push({ ref, reason, section: env.label || '' });
  if (warn) stats.warnings.push(`unknown cross-reference target ${ref} in ${env.label || 'content'} left as text`);
}

export function crossrefPlugin(md, options = {}) {
  const literals = options.exceptions || CROSSREF_EXCEPTIONS;

  md.core.ruler.push('crossref', (state) => {
    const env = state.env || {};
    const headingIndex = env.headingIndex;
    for (const block of state.tokens) {
      if (block.type !== 'inline' || !block.children) continue;
      const out = [];
      let linkDepth = 0;
      for (const tok of block.children) {
        if (tok.type === 'link_open') linkDepth++;
        if (tok.type === 'link_close') linkDepth--;
        if (tok.type !== 'text' || !tok.content.includes('§')) { out.push(tok); continue; }
        const text = tok.content;
        const spans = exceptionSpans(text, literals);
        let last = 0;
        let m;
        CROSSREF_RE.lastIndex = 0;
        const pieces = [];
        while ((m = CROSSREF_RE.exec(text))) {
          const ref = m[0];
          const inException = spans.find(([a, b]) => m.index >= a && m.index + ref.length <= b);
          let resolution;
          if (linkDepth > 0) resolution = { skip: 'inside link' };
          else if (inException) resolution = { skip: `exception "${inException[2]}"` };
          else resolution = resolveCrossref(m, headingIndex);
          if (!resolution.href) { skipped(env, ref, resolution.skip, resolution.warn); continue; }
          if (m.index > last) pieces.push(['text', text.slice(last, m.index)]);
          pieces.push(['html_inline', `<a class="xref" href="${escapeAttr(resolution.href)}">${escapeAttr(ref)}</a>`]);
          if (env.stats) env.stats.crossrefs.rewritten++;
          last = m.index + ref.length;
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

/** Assert every exception literal still occurs in the content (a content edit must surface). */
export function assertExceptionsPresent(markdown, literals = CROSSREF_EXCEPTIONS) {
  const missing = literals.filter((lit) => !markdown.includes(lit));
  if (missing.length) throw new Error(`Cross-reference exception literal(s) no longer in the content: ${missing.map((m) => JSON.stringify(m)).join(', ')}`);
}
