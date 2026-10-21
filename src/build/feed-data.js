// Data for the Feed page's right column, taken from content/roadmap.md at build time: the three §17.1
// Normal-week rows (the source's own cells — no added numbers, DR-5), the §17.6 "Limits:" sentence, the
// §13.6 notice pages with their report wording, and the §17.5 labs without a feed. Nothing here is typed in.
import { extractTables, headersMatch } from './tables.js';
import { sources } from '../../sources.config.mjs';

export const PROTOCOL_HEADERS = ['Session', 'Minutes', 'Action', 'Hard output'];
export const NORMAL_WEEK_LABEL = 'Normal week';
export const LAB_NAMES = ['UZH RPG', 'ETH ASL', 'IIIT Hyderabad RRC', 'Stanford ASL'];
/** registry id → the §13.6 link text (the report's own name for the page). */
export const NOTICE_LINK_TEXT = Object.freeze({ 'reg-dgca': 'DGCA portal', 'reg-moca': 'Ministry of Civil Aviation rules', 'reg-egazette': 'eGazette' });

function sectionBySlug(sections, slug) {
  const s = sections.find((x) => x.slug === slug);
  if (!s) throw new Error(`Section ${slug} not found`);
  return s;
}

function sentenceStarting(body, prefix, where) {
  const line = body.split('\n').find((l) => l.startsWith(prefix));
  if (!line) throw new Error(`${where}: no paragraph starting with "${prefix}"`);
  return line.trim();
}

/** Every cell string of the §17.1 table (header cells and body cells), for the DR-5 assertion and the audit. */
export function protocolTable(sections, plainMd) {
  const s17 = sectionBySlug(sections, 's17');
  const tables = extractTables(s17.body, plainMd, 'section 17').filter((t) => headersMatch(t, PROTOCOL_HEADERS));
  if (tables.length !== 1) throw new Error(`§17.1: expected one table starting with ${PROTOCOL_HEADERS.join(' · ')}, found ${tables.length}`);
  return tables[0];
}

/**
 * @returns {{ protocol: { headers, aligns, rows: string[][], cells: string[] }, monthEnd: { text, href }, limits: { markdown, html }, notices: [...], labs: [...], manualChecks: [...] }}
 */
export function buildFeedData(sections, plainMd, renderInline) {
  const table = protocolTable(sections, plainMd);
  const cells = new Set(table.headers);
  for (const row of table.rows) for (const c of row.cells) cells.add(c.text);
  const start = table.rows.findIndex((r) => r.cells[0].text === NORMAL_WEEK_LABEL);
  if (start !== 0) throw new Error(`§17.1: the first row must be "${NORMAL_WEEK_LABEL}" (found "${table.rows[0] && table.rows[0].cells[0].text}")`);
  const rows = [];
  for (let i = start; i < table.rows.length; i++) {
    const texts = table.rows[i].cells.map((c) => c.text);
    if (i > start && texts[0] !== '') break; // the next labelled row starts the month-end block
    rows.push(texts);
  }
  if (rows.length !== 3) throw new Error(`§17.1: expected three Normal-week rows, found ${rows.length}`);
  // DR-5: every rendered td is one of the table's own cell strings
  for (const row of rows) for (const text of row) if (!cells.has(text)) throw new Error(`§17.1 protocol card: "${text}" is not a cell of the table`);

  const s17 = sectionBySlug(sections, 's17');
  const limitsMarkdown = sentenceStarting(s17.body, 'Limits: ', '§17.6');

  const s13 = sectionBySlug(sections, 's13');
  const noticesParagraph = s13.body.split('\n').find((l) => l.includes('[DGCA portal](')) || '';
  if (!noticesParagraph) throw new Error('§13.6: the monitoring paragraph with the DGCA portal link was not found');
  const afterLink = (text) => {
    const m = new RegExp(`\\[${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\(([^)]+)\\)\\s*([^;]*);`).exec(noticesParagraph);
    if (!m) throw new Error(`§13.6: link "${text}" not found`);
    return { href: m[1], extra: m[2].trim() };
  };
  const recordSentence = /Record the exact document, number, and date, not the home page\./.exec(noticesParagraph);
  if (!recordSentence) throw new Error('§13.6: the "Record the exact document…" sentence was not found');
  const notices = sources.filter((s) => s.kind === 'reachability').map((s) => {
    const linkText = NOTICE_LINK_TEXT[s.id];
    const fromReport = linkText ? afterLink(linkText) : null;
    if (fromReport && fromReport.href !== s.url) throw new Error(`§13.6: ${s.id} URL ${s.url} differs from the report's ${fromReport.href}`);
    return { id: s.id, name: s.name, url: s.url, extraHtml: fromReport && fromReport.extra ? renderInline(fromReport.extra) : '' };
  });
  if (notices.length !== 5) throw new Error(`registry: expected 5 reachability sources, found ${notices.length}`);
  // eGazette's parenthetical ("the old egazette.nic.in hostname failed DNS") is a probe note, not a check instruction
  const egazette = notices.find((n) => n.id === 'reg-egazette');
  if (egazette) egazette.extraHtml = '';

  const labsParagraph = s17.body.split('\n').find((l) => l.startsWith('**Lab feeds:**')) || '';
  const labs = LAB_NAMES.map((name) => {
    const m = new RegExp(`\\[${name}\\]\\(([^)]+)\\)`).exec(labsParagraph);
    if (!m) throw new Error(`§17.5: lab link "${name}" not found`);
    return { name, url: m[1] };
  });

  return {
    protocol: { headers: table.headers, aligns: table.aligns, rows, cells: [...cells] },
    monthEnd: { text: 'Month-end 90 min · Quarter-end 120 min — see §17.1', href: 's17.html#s17-1' },
    limits: { markdown: limitsMarkdown, html: renderInline(limitsMarkdown) },
    notices,
    noticeSentence: recordSentence[0],
    labs,
    manualChecks: [
      { href: 's17.html#s17-3', label: 'Scholar and Semantic Scholar alerts (§17.3)' },
      { href: 's17.html#s17-4', label: 'venue watchlist (§17.4)' },
      { href: 's17.html#s17-5', label: 'benchmark watches (§17.5)' },
      { href: 's13.html#s13-6', label: 'regulator comparators (§13.6)' },
    ],
  };
}
