// Split content/roadmap.md into front matter + 24 sections and build the per-section heading inventory.
import MarkdownIt from 'markdown-it';
import { SECTION_FILES, slugify } from './content-map.mjs';

const NUMBERED_RE = /^## (\d{1,2})\. (.+)$/;
const APPENDIX_RE = /^## Appendix ([A-D])\. (.+)$/;
const CONTENTS_RE = /^## Contents\s*$/;
const H3_RE = /^### (.+)$/;

const plain = new MarkdownIt({ html: false, linkify: false, typographer: false });

/** Plain text of markdown-it inline children (text, code, breaks; html stripped). */
export function inlinePlainText(children) {
  let out = '';
  for (const t of children || []) {
    switch (t.type) {
      case 'text': case 'code_inline': out += t.content; break;
      case 'softbreak': case 'hardbreak': out += ' '; break;
      case 'html_inline': out += decodeEntities(t.content.replace(/<[^>]*>/g, '')); break;
      case 'image': out += t.content; break;
      default: break;
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

export function decodeEntities(s) {
  return s.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }[e]));
}

/** Plain text of a markdown inline string (emphasis markers and link syntax removed). */
export function plainText(markdown) {
  const tokens = plain.parseInline(String(markdown), {});
  return tokens.length ? inlinePlainText(tokens[0].children) : '';
}

/** Heading id: "N.M Title" → sN-M, otherwise the slug of the text. */
export function headingId(text) {
  const m = /^(\d{1,2})\.(\d{1,2})(?:\s|$)/.exec(text);
  if (m) return `s${Number(m[1])}-${Number(m[2])}`;
  return slugify(text) || 'heading';
}

function dedupe(ids) {
  const seen = new Map();
  return ids.map((id) => {
    const n = (seen.get(id) || 0) + 1;
    seen.set(id, n);
    return n === 1 ? id : `${id}-${n}`;
  });
}

/** Heading inventory of a section body: h3 lines outside fenced code. */
export function headingInventory(body) {
  const out = [];
  let fence = false;
  for (const line of body.split('\n')) {
    if (/^```/.test(line)) { fence = !fence; continue; }
    if (fence) continue;
    const m = H3_RE.exec(line);
    if (!m) continue;
    const raw = m[1].trim();
    const text = plainText(raw);
    out.push({ raw, text, id: headingId(text) });
  }
  const ids = dedupe(out.map((h) => h.id));
  out.forEach((h, i) => { h.id = ids[i]; });
  return out;
}

/** Trim blank lines at both ends and a trailing `---` separator (sections are pages; the rule between them is structural). */
function stripTrailingRule(lines) {
  const l = [...lines];
  while (l.length && /^\s*$/.test(l[0])) l.shift();
  while (l.length && /^\s*$/.test(l[l.length - 1])) l.pop();
  if (l.length && /^---\s*$/.test(l[l.length - 1])) l.pop();
  while (l.length && /^\s*$/.test(l[l.length - 1])) l.pop();
  return l;
}

/**
 * @returns {{ frontMatter: { title: string, markdown: string }, sections: Array<{ key, kind, slug, file, number, letter, titleMarkdown, titleText, headingMarkdown, body, headings }> }}
 */
export function splitSections(markdown) {
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
  const starts = [];
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line)) { fence = !fence; continue; }
    if (fence) continue;
    if (!line.startsWith('## ')) continue;
    if (CONTENTS_RE.test(line)) { starts.push({ i, contents: true }); continue; }
    let m = NUMBERED_RE.exec(line);
    if (m) { starts.push({ i, key: String(Number(m[1])), kind: 'number', titleMarkdown: m[2].trim() }); continue; }
    m = APPENDIX_RE.exec(line);
    if (m) { starts.push({ i, key: m[1], kind: 'appendix', titleMarkdown: m[2].trim() }); continue; }
    throw new Error(`Unrecognised section heading at line ${i + 1}: "${line.slice(0, 80)}"`);
  }
  if (!starts.length) throw new Error('No "## " section headings found in the content');

  const contentsIdx = starts.findIndex((s) => s.contents);
  const frontEnd = contentsIdx >= 0 ? starts[contentsIdx].i : starts[0].i;
  const frontLines = stripTrailingRule(lines.slice(0, frontEnd));
  const titleLine = frontLines.find((l) => /^# /.test(l)) || '';
  const frontMatter = { title: plainText(titleLine.replace(/^# /, '')), markdown: frontLines.join('\n') };

  const found = starts.filter((s) => !s.contents).map((s) => s.key);
  const expected = SECTION_FILES.map((s) => s.key);
  if (found.length !== expected.length || found.some((k, i) => k !== expected[i])) {
    throw new Error(`Expected sections 0–19 then Appendix A–D in order; found: ${found.join(', ') || '(none)'}`);
  }

  const sections = [];
  const real = starts.filter((s) => !s.contents);
  for (let n = 0; n < real.length; n++) {
    const s = real[n];
    const next = n + 1 < real.length ? real[n + 1].i : lines.length;
    const body = stripTrailingRule(lines.slice(s.i + 1, next)).join('\n');
    const meta = SECTION_FILES[n];
    sections.push({
      key: s.key,
      kind: s.kind,
      slug: meta.slug,
      file: meta.file,
      number: s.kind === 'number' ? Number(s.key) : null,
      letter: s.kind === 'appendix' ? s.key : null,
      titleMarkdown: s.titleMarkdown,
      titleText: plainText(s.titleMarkdown),
      headingMarkdown: s.kind === 'number' ? `${s.key}. ${s.titleMarkdown}` : `Appendix ${s.key}. ${s.titleMarkdown}`,
      headingText: s.kind === 'number' ? `${s.key}. ${plainText(s.titleMarkdown)}` : `Appendix ${s.key}. ${plainText(s.titleMarkdown)}`,
      body,
      headings: headingInventory(body),
    });
  }
  return { frontMatter, sections };
}

/** Map section number → Set of h3 ids, for §N.M cross-reference targets. */
export function headingIndex(sections) {
  const idx = new Map();
  for (const s of sections) {
    if (s.kind !== 'number') continue;
    idx.set(s.number, new Set(s.headings.map((h) => h.id)));
  }
  return idx;
}
