// The markdown-it 14.1.0 instance used for every rendered string, plus the env conventions.
//
// env = {
//   label: 'section 12',                     // for error messages
//   headingIndex: Map<number, Set<id>>,       // §N.M targets (parse.headingIndex)
//   legend: { fact: {label, meaning}, … },    // chip title attributes (labels.legendFromTables)
//   headings: [{ text, id }],                 // this section's h3 inventory, document order
//   rows: Map<tableOrdinal, Map<rowIndex, entry[]>>, // trackable rows (manifest.rowIndex)
//   stats: { chips, crossrefs: { rewritten, skipped: [] }, warnings: [], unpublished }, // optional accumulator
//   demoteH1: boolean,                        // front matter: "# Title" → h3
// }
import MarkdownIt from 'markdown-it';
import { crossrefPlugin } from './crossref.js';
import { labelsPlugin } from './labels.js';
import { tablesPlugin } from './tables.js';
import { linksPlugin } from './links.js';
import { headingsPlugin } from './headings.js';

const OPTIONS = Object.freeze({ html: false, linkify: false, typographer: false });

export function createPlainMd() {
  return new MarkdownIt({ ...OPTIONS });
}

export function createMd(options = {}) {
  const md = new MarkdownIt({ ...OPTIONS });
  md.use(crossrefPlugin, options.crossref || {});
  md.use(labelsPlugin);
  md.use(tablesPlugin);
  md.use(linksPlugin);
  md.use(headingsPlugin);
  md.renderer.rules.blockquote_open = () => '<blockquote class="notice">\n';
  return md;
}

export function newStats() {
  return { chips: 0, crossrefs: { rewritten: 0, skipped: [] }, warnings: [], unpublished: 0 };
}

let shared = null;
function instance() {
  if (!shared) shared = createMd();
  return shared;
}

/** Render a markdown block (a section body, the front matter) with the given env. */
export function render(markdown, env = {}) {
  return instance().render(String(markdown), env);
}

/** Render a table cell / inline markdown string to HTML (links and chips survive). */
export function renderInline(markdown, env = {}) {
  return instance().renderInline(String(markdown), env);
}

/** Parse to tokens with the plugins applied (used by the search index). */
export function parse(markdown, env = {}) {
  return instance().parse(String(markdown), env);
}

/** Render a token stream produced by parse() (same env). */
export function renderTokens(tokens, env = {}) {
  const md = instance();
  return md.renderer.render(tokens, md.options, env);
}
