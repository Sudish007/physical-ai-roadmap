// The §17 feed registry (D8): one object literal per source, in the order of design.md's
// "§17 source list and probe results" table. Adding a source is one literal; `npm run fetch` reports it.
//
// Fields: id, name (shown in the health table and on items), class (arxiv | proceedings | lab | release |
// regulator), kind (arxiv | atomrss | rss-proceedings | reachability), url, label (arXiv only: the query name
// recorded as matchedQuery / alsoMatched), maxItems (per-source cap after the window), optional filter
// (RegExp on title + summary), includeRule (apply the §17.3 feed-reader include rules), volumeDate (proceedings
// volumes carry no per-paper dates), maxBytes, timeoutMs, note (≤120 chars, copied into meta.json).

const ARXIV_API = 'https://export.arxiv.org/api/query';

/** arXiv export API URL: newest first (the RSS feeds are empty before ~04:00 UTC, so they are not used). */
export function arxivApi(query, maxResults) {
  return `${ARXIV_API}?search_query=${encodeURIComponent(query)}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
}

/** The four §17.3 queries, verbatim (tests assert they occur in content/roadmap.md). */
export const QUERIES = Object.freeze({
  'Thesis narrow': '(cat:cs.RO OR cat:eess.SY) AND (all:"precision landing" OR (all:landing AND all:quadrotor)) AND (all:uncertainty OR all:calibration OR all:failure OR all:robustness)',
  'Aerial autonomy': '(cat:cs.RO OR cat:eess.SY) AND (all:quadrotor OR all:UAV OR all:"aerial robot") AND (all:landing OR all:"visual-inertial" OR all:"GPS-denied")',
  'Safe autonomy': '(cat:cs.RO OR cat:eess.SY OR cat:cs.LG) AND (all:"runtime assurance" OR all:"control barrier function" OR all:"safe reinforcement learning") AND (all:robot OR all:quadrotor OR all:autonomous)',
  'Robot-learning evaluation': '(cat:cs.RO OR cat:cs.LG) AND (all:"vision-language-action" OR all:"robot learning" OR all:"sim-to-real") AND (all:evaluation OR all:benchmark OR all:recovery)',
});

/**
 * §17.3 feed-reader include rules, verbatim (case-insensitive). The report: "require one embodiment term
 * and one method/evaluation term"; applied as (embodiment OR learning) AND method to the two category listings.
 */
export const INCLUDE_RULES = Object.freeze({
  embodiment: /\b(quadrotor|UAV|aerial robot|drone|visual[- ]inertial|GPS[- ]denied|precision landing)\b/i,
  method: /\b(runtime assurance|control barrier|safe reinforcement learning|uncertainty|calibrat(e|ed|ion)|out[- ]of[- ]distribution|recovery)\b/i,
  learning: /\b(robot learning|embodied (AI|intelligence)|vision[- ]language[- ]action|VLA|sim[- ]to[- ]real|tactile|dexterous)\b/i,
});

/** Union of the three include lines: the only aerial/safety/learning filter the report defines (plan Decision 16). */
export const INCLUDE_UNION = new RegExp([INCLUDE_RULES.embodiment, INCLUDE_RULES.method, INCLUDE_RULES.learning].map((r) => r.source).join('|'), 'i');

/** §17.5: "keep the NIST news RSS only with a robot|autonomous system|AI risk|assurance|test and evaluation|safety filter". */
export const NIST_FILTER = /robot|autonomous system|AI risk|assurance|test and evaluation|safety/i;

const listing = (cat) => ({
  id: `arxiv-${cat}`, name: `arXiv ${cat} listing`, class: 'arxiv', kind: 'arxiv', url: arxivApi(`cat:${cat}`, 100), label: `${cat} listing`,
  maxItems: 60, includeRule: true, note: 'filtered by the §17.3 include rules',
});
const query = (id, label) => ({
  id, name: `arXiv query: ${label}`, class: 'arxiv', kind: 'arxiv', url: arxivApi(QUERIES[label], 50), label, maxItems: 50, note: '§17.3 query, verbatim',
});
const release = (id, repo) => ({
  id, name: `${repo} releases`, class: 'release', kind: 'atomrss', url: `https://github.com/${repo}/releases.atom`, maxItems: 60,
});
const reachability = (id, name, url) => ({
  id, name, class: 'regulator', kind: 'reachability', url, maxItems: 0, maxBytes: 2_000_000, note: 'reachability only; not machine-readable, check manually (§13.6)',
});

export const sources = Object.freeze([
  // arXiv (§17.3): the two category listings with the include rules, then the four queries verbatim
  listing('cs.RO'),
  listing('eess.SY'),
  query('arxiv-q-thesis-narrow', 'Thesis narrow'),
  query('arxiv-q-aerial-autonomy', 'Aerial autonomy'),
  query('arxiv-q-safe-autonomy', 'Safe autonomy'),
  query('arxiv-q-robot-learning-eval', 'Robot-learning evaluation'),
  // Proceedings (§17.2 priority 1, §17.4): yearly volumes, dated with the volume date → `empty` most of the year
  { id: 'rss-proceedings', name: 'RSS XXII proceedings', class: 'proceedings', kind: 'rss-proceedings', url: 'https://www.roboticsproceedings.org/rss22/index.html', volumeDate: '2026-07-13', maxItems: 60, note: 'yearly volume' },
  { id: 'pmlr-corl', name: 'PMLR v305, CoRL 2025', class: 'proceedings', kind: 'atomrss', url: 'https://proceedings.mlr.press/v305/assets/rss/feed.xml', maxItems: 60, note: 'yearly volume' },
  // Labs (§17.5): the two XML feeds the report names plus the one candidate lab with a working feed
  { id: 'lab-cmu-ri', name: 'CMU Robotics Institute news', class: 'lab', kind: 'atomrss', url: 'https://www.ri.cmu.edu/feed/', maxItems: 60, maxBytes: 2_000_000, filter: INCLUDE_UNION, note: 'filtered: §17.3 include terms (the §17.5 aerial/safety/learning filter)' },
  { id: 'lab-bair', name: 'BAIR blog', class: 'lab', kind: 'atomrss', url: 'https://bair.berkeley.edu/blog/feed.xml', maxItems: 60 },
  { id: 'lab-grasp', name: 'UPenn GRASP news', class: 'lab', kind: 'atomrss', url: 'https://www.grasp.upenn.edu/news/feed/', maxItems: 60 },
  // Release feeds (§10.4, §11.1): github.com releases.atom; a 404 is transient there and retried once
  release('rel-ros2', 'ros2/ros2'),
  release('rel-px4', 'PX4/PX4-Autopilot'),
  release('rel-mujoco', 'google-deepmind/mujoco'),
  release('rel-gz-sim', 'gazebosim/gz-sim'),
  release('rel-nav2', 'ros-navigation/navigation2'),
  release('rel-qgc', 'mavlink/qgroundcontrol'),
  release('rel-mavsdk', 'mavlink/MAVSDK'),
  // Regulators (§17.5, §13.6): NIST with the §17.5 filter (Cloudflare-served; plan Decision 8 at the ship step),
  // then the five Indian official pages as reachability checks (not machine-readable)
  { id: 'reg-nist', name: 'NIST news (filtered)', class: 'regulator', kind: 'atomrss', url: 'https://www.nist.gov/news-events/news/rss.xml', maxItems: 60, filter: NIST_FILTER, note: 'provisional: Cloudflare-served; filtered with the §17.5 terms' },
  reachability('reg-dgca', 'DGCA portal', 'https://www.dgca.gov.in/digigov-portal/'),
  reachability('reg-moca', 'Ministry of Civil Aviation rules', 'https://www.civilaviation.gov.in/ministry-documents/rules'),
  reachability('reg-egazette', 'eGazette', 'https://egazette.gov.in/'),
  reachability('reg-digitalsky', 'AAI Digital Sky', 'https://digitalsky.aai.aero/'),
  reachability('reg-aai-aim', 'AAI AIM NOTAM summaries', 'https://aim-india.aai.aero/notam-summaries'),
]);

export const CLASSES = Object.freeze(['arxiv', 'proceedings', 'lab', 'release', 'regulator']);
export const KINDS = Object.freeze(['arxiv', 'atomrss', 'rss-proceedings', 'reachability']);

/** Throws when the registry is malformed (duplicate ids, unknown class/kind, bad URL, note too long). */
export function validateSources(list = sources) {
  const ids = new Set();
  for (const s of list) {
    if (!s || typeof s.id !== 'string' || !s.id) throw new Error('registry: a source has no id');
    if (ids.has(s.id)) throw new Error(`registry: duplicate id ${s.id}`);
    ids.add(s.id);
    if (typeof s.name !== 'string' || !s.name) throw new Error(`registry: ${s.id} has no name`);
    if (!CLASSES.includes(s.class)) throw new Error(`registry: ${s.id} has unknown class ${s.class}`);
    if (!KINDS.includes(s.kind)) throw new Error(`registry: ${s.id} has unknown kind ${s.kind}`);
    try { new URL(s.url); } catch { throw new Error(`registry: ${s.id} has an invalid url`); }
    if (!Number.isInteger(s.maxItems) || s.maxItems < 0) throw new Error(`registry: ${s.id} needs an integer maxItems`);
    if (s.note !== undefined && (typeof s.note !== 'string' || s.note.length > 120)) throw new Error(`registry: ${s.id} note must be a string of at most 120 chars`);
    if (s.kind === 'rss-proceedings' && !/^\d{4}-\d{2}-\d{2}$/.test(s.volumeDate || '')) throw new Error(`registry: ${s.id} needs volumeDate YYYY-MM-DD`);
    if (s.filter !== undefined && !(s.filter instanceof RegExp)) throw new Error(`registry: ${s.id} filter must be a RegExp`);
  }
  return list;
}
