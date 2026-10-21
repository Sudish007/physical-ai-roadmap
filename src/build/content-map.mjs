// Declarations that bind the build to content/roadmap.md: section file names,
// site constants, cross-reference exception literals and the trackable tables.
// Nothing here is derived from heading text at build time, so a prose edit cannot
// move an id. Counts are asserted by src/build/manifest.js.

export const SECTION_FILES = Object.freeze([
  ...Array.from({ length: 20 }, (_, n) => ({ key: String(n), kind: 'number', slug: `s${String(n).padStart(2, '0')}`, file: `s${String(n).padStart(2, '0')}.html` })),
  ...['A', 'B', 'C', 'D'].map((l) => ({ key: l, kind: 'appendix', slug: `appendix-${l.toLowerCase()}`, file: `appendix-${l.toLowerCase()}.html` })),
]);

export const SITE = Object.freeze({
  title: 'Physical AI Roadmap',
  owner: 'Sudish Kumar',
  ownerSite: 'https://sudish.dev',
  ownerSiteLabel: 'sudish.dev',
  repoUrl: 'https://github.com/Sudish007/physical-ai-roadmap',
  repoLabel: 'GitHub repository',
  cutoff: 'Evidence cutoff 20 Oct 2026',
  cutoffLong: 'Evidence cutoff 20 October 2026.',
  notLegal: 'Not legal advice',
  // Used ONLY by 404.html (GitHub Pages serves it at arbitrary depths). Every other URL is relative.
  base: '/physical-ai-roadmap/',
  heroLead: 'A source-checked learning-and-research roadmap for physical AI, robotics and autonomous drones, written for a software builder in India, with a personal progress tracker and a low-noise research feed.',
  heroCutoff: 'Evidence cutoff 20 October 2026. Everything on this site comes from the report; labels mark what is fact, judgment, or uncertain.',
  freshness: 'GitHub may delay or skip scheduled runs.',
  storageKeyTheme: 'physical-ai-roadmap.v1.theme',
});

// Content source for `npm run sync-content` (local convenience only).
export const CONTENT_ORIGIN = 'c:/Users/sudiskmr/Downloads/DomainClassification/ahead/.agents/tasks/physical-ai-frontier-roadmap-2026.md';

// Legal/statute mentions that look like report cross-references but are not.
// The build asserts each literal still occurs in the content (a content edit surfaces as a build error).
export const CROSSREF_EXCEPTIONS = Object.freeze([
  'expert scrutiny (§5)',
  'open to organizations (§4)',
  '§1(2), §2, §§18–26',
]);

// The five relative dossier links in §19.1 and Appendix D point at files that are not published in v1.
export const UNPUBLISHED_LINK_PREFIX = 'physical-ai-roadmap-research-2026/';

// Label chips: keyword → class suffix. Meanings come from the §0 Labels table at build time.
export const LABEL_KINDS = Object.freeze({
  FACT: 'fact',
  JUDGMENT: 'judgment',
  UNCERTAIN: 'uncertain',
  'HYPE/DEMO': 'hype',
  'STALE-BUT-FOUNDATIONAL': 'stale',
});

// ---------------------------------------------------------------------------
// Tracker row keys (DR-7), frozen here and nowhere else. The rule is PER SET,
// never a precedence chain (the two 6.8210 lectures in §10.2 would otherwise
// both key to "6").
//
//   leading-id      LEADING_ID_RE applied to the raw markdown of the key cell,
//                   group 1 lowercased:  "1."→"1"  "**M4**"→"m4"  "RL-25"→"rl-25"
//                   "**0** Reproducibility…"→"0"  "1 (W1–4; 40/80)"→"1"  "Q3 (W39) …"→"q3"
//   italic-col2     slug of the text of the first *italic* span of column 2 (books)
//   first-link-text slug of the full text of the first link in the key cell (media)
//
//   slug = first 8 whitespace tokens that contain an ASCII alphanumeric
//          → lowercase → ASCII-fold (NFKD, strip combining marks)
//          → [^a-z0-9]+ → "-" → trim "-"
//
// Ids are `<section slug>:<table slug>:<row key>`; the DOM anchor is `t-` + id with ":" → "-".
// Collisions (same id twice inside one table, or across sets) fail the build.
// ---------------------------------------------------------------------------
export const LEADING_ID_RE = /^\*{0,2}([A-Za-z]{0,2}-?\d+)\*{0,2}(?=[.\s(]|$)/;

export function slugify(text) {
  const tokens = String(text).split(/\s+/).filter((t) => /[A-Za-z0-9]/.test(t)).slice(0, 8);
  return tokens.join(' ')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// `headers` = the leading header cells (plain text) a table must start with.
// `all: true` = collect every matching table in the section (ids are shared across them).
export const TRACKABLE = Object.freeze([
  {
    id: 'sessions', label: 'Start-this-week sessions (§2)', section: 's02', expectedCount: 7,
    tables: [{ slug: 'sessions', headers: ['Session', 'Time', 'Do', 'Output to keep'] }],
    keyRule: 'leading-id', keyColumn: 1,
  },
  {
    id: 'best-10', label: 'Best 10 resources (§3)', section: 's03', expectedCount: 10,
    tables: [{ slug: 'best-10', headers: ['#', 'Resource (exact identity)'] }],
    keyRule: 'leading-id', keyColumn: 1, labelPrefix: 'Resource',
  },
  {
    id: 'reading-map', label: 'Reading map RL-1 to RL-36 (§7)', section: 's07', expectedCount: 36, shared: true,
    tables: [{ slug: 'reading-map', headers: ['ID'], all: true }],
    keyRule: 'leading-id', keyColumn: 1,
  },
  {
    id: 'modules', label: 'Curriculum modules M0–M11 (§8)', section: 's08', expectedCount: 12,
    tables: [{ slug: 'modules', headers: ['Module', 'Exact course, instructors, institution, term'] }],
    keyRule: 'leading-id', keyColumn: 1, rowFilter: (key) => /^m\d+$/.test(key), skipKeyless: true,
  },
  {
    id: 'books', label: 'Books (§9)', section: 's09', expectedCount: 14,
    tables: [{ slug: 'books', headers: ['Tier', 'Exact book, edition, access'] }],
    keyRule: 'italic-col2', keyColumn: 2,
  },
  {
    id: 'media', label: 'Lectures, talks and episodes (§10)', section: 's10', expectedCount: 26,
    tables: [
      { slug: 'series', headers: ['Series', 'Verified activity and scope'] },
      { slug: 'talks', headers: ['Item', 'Metadata'] },
    ],
    keyRule: 'first-link-text', keyColumn: 1,
  },
  {
    id: 'rungs', label: 'Project rungs 0–8 (§12)', section: 's12', expectedCount: 9, shared: true,
    tables: [{ slug: 'rungs', headers: ['Rung'], all: true }],
    keyRule: 'leading-id', keyColumn: 1, labelPrefix: 'Rung', skipKeyless: true, // the Totals row has no leading id
  },
  {
    id: 'plan-10h', label: 'Plan months, 10 h plan (§15)', section: 's15', expectedCount: 24,
    tables: [{ slug: 'plan-10h', headers: ['Month (weeks; 10 h/20 h)', 'Shared work'] }],
    keyRule: 'leading-id', keyColumn: 1, checkboxColumn: 4, labelPrefix: 'Month', ariaSuffix: '10 h plan',
  },
  {
    id: 'plan-20h', label: 'Plan months, 20 h plan (§15)', section: 's15', expectedCount: 24,
    tables: [{ slug: 'plan-20h', headers: ['Month (weeks; 10 h/20 h)', 'Shared work'] }],
    keyRule: 'leading-id', keyColumn: 1, checkboxColumn: 5, labelPrefix: 'Month', ariaSuffix: '20 h plan',
    rowIdFrom: 'plan-10h', // the row element already carries the plan-10h anchor
  },
  {
    id: 'gates', label: 'Quarterly gates (§15.6)', section: 's15', expectedCount: 8,
    tables: [{ slug: 'gates', headers: ['Gate', 'Pass evidence', 'If it fails', 'Added 20 h evidence'] }],
    keyRule: 'leading-id', keyColumn: 1,
    clauses: { column: 2, separator: '; ', expectedTotal: 36 }, // s15:gates:qN:k — My plan only (Decision 7)
  },
  {
    id: 'questions', label: 'Personalization answers (§4)', section: 's04', expectedCount: 18,
    tables: [{ slug: 'questions', headers: ['#', 'Question', 'Decision rule'] }],
    keyRule: 'leading-id', keyColumn: 1, labelPrefix: 'Question',
    answers: true, // typed answers on My plan; no checkbox on s04 (Decision 21)
  },
]);

// Sets that show a done-count row (home "Your progress" and the section rails).
export const PROGRESS_SETS = Object.freeze(TRACKABLE.filter((s) => !s.answers).map((s) => s.id));
