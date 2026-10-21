// Links: http(s) links get rel="noopener external" + a domain hint; the unpublished relative
// dossier links render as text + " (not published)" (the only non-verbatim rendering, see design.md);
// same tab — no target="_blank" (Decision 5).
import { UNPUBLISHED_LINK_PREFIX } from './content-map.mjs';

export function hostOf(href) {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function linkKind(href) {
  if (/^https?:\/\//i.test(href || '')) return 'external';
  if ((href || '').startsWith(UNPUBLISHED_LINK_PREFIX)) return 'unpublished';
  return 'other';
}

function matchingOpen(tokens, idx) {
  for (let i = idx - 1; i >= 0; i--) {
    if (tokens[i].type === 'link_open') return tokens[i];
  }
  return null;
}

export function linksPlugin(md) {
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const tok = tokens[idx];
    const href = tok.attrGet('href') || '';
    const kind = linkKind(href);
    tok.meta = { ...(tok.meta || {}), kind, host: hostOf(href) };
    if (kind === 'unpublished') {
      if (env && env.stats) env.stats.unpublished++;
      return '';
    }
    if (kind === 'external') tok.attrSet('rel', 'noopener external');
    return self.renderToken(tokens, idx, options);
  };
  md.renderer.rules.link_close = (tokens, idx, options, env, self) => {
    const open = matchingOpen(tokens, idx);
    const meta = (open && open.meta) || {};
    if (meta.kind === 'unpublished') return ' (not published)';
    const close = self.renderToken(tokens, idx, options);
    if (meta.kind === 'external' && meta.host) return `${close}<span class="dom">${md.utils.escapeHtml(meta.host)}</span>`;
    return close;
  };
}
