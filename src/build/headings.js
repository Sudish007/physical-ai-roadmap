// Headings: h3 ids from the parse.js inventory, class="anchor-h", a trailing copy-link pill (OF-10).
// The page h1 is emitted by templates.js with id="top"; a markdown h1 (front matter title) is demoted to h3.
import { inlinePlainText } from './parse.js';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function headingsPlugin(md) {
  md.core.ruler.push('headings', (state) => {
    const env = state.env || {};
    const inventory = env.headings || [];
    let h3 = -1;
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.type !== 'heading_open') continue;
      if (t.tag === 'h1' && env.demoteH1) { t.tag = 'h3'; tokens[i + 2].tag = 'h3'; t.meta = { plain: true }; continue; }
      if (t.tag !== 'h3') continue;
      h3++;
      const inline = tokens[i + 1];
      const text = inlinePlainText(inline.children);
      const entry = inventory[h3];
      if (!entry) throw new Error(`Heading inventory out of sync at h3 #${h3 + 1} "${text.slice(0, 80)}" (${env.label || 'content'})`);
      t.attrSet('id', entry.id);
      t.attrJoin('class', 'anchor-h');
      t.meta = { id: entry.id, text: entry.text || text };
      tokens[i + 2].meta = t.meta;
    }
  });

  md.renderer.rules.heading_close = (tokens, idx, options, env, self) => {
    const meta = tokens[idx].meta;
    if (meta && meta.id) {
      return `<a class="copy" href="#${esc(meta.id)}" aria-label="Link to ${esc(meta.text)}">link</a>${self.renderToken(tokens, idx, options)}`;
    }
    return self.renderToken(tokens, idx, options);
  };
}
