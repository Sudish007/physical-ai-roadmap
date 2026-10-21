import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPlainMd } from '../src/build/md.js';
import { splitSections } from '../src/build/parse.js';
import { buildManifest, manifestSummary, rowKey } from '../src/build/manifest.js';
import { slugify, LEADING_ID_RE, TRACKABLE } from '../src/build/content-map.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = readFileSync(path.join(ROOT, 'content', 'roadmap.md'), 'utf8');
const plainMd = createPlainMd();

const BOOK_IDS = [
  's09:books:mathematics-for-machine-learning',
  's09:books:modern-robotics',
  's09:books:state-estimation-for-robotics',
  's09:books:computer-vision-algorithms-and-applications',
  's09:books:feedback-systems',
  's09:books:planning-algorithms',
  's09:books:reinforcement-learning-an-introduction',
  's09:books:algorithms-for-decision-making',
  's09:books:deep-learning',
  's09:books:probabilistic-robotics',
  's09:books:introduction-to-multicopter-design-and-control',
  's09:books:small-unmanned-aircraft-theory-and-practice',
  's09:books:mechanics-of-robotic-manipulation',
  's09:books:factor-graphs-for-robot-perception',
];

const MEDIA_IDS = [
  's10:series:mit-6-s191-2026-playlist',
  's10:series:modern-robotics-video-supplements',
  's10:series:mit-underactuated-robotics-spring-2024',
  's10:series:robot-control-lecture-2025-university-of-bonn-stachnisslab',
  's10:series:nptel-principles-of-perception-and-planning-for-aerial',
  's10:series:nptel-aeromechanics-of-uavs-drones',
  's10:series:cmu-robotics-institute-seminar-series-playlist',
  's10:series:ieee-robotics-and-automation-society-channel',
  's10:series:rss-2026-keynotes-and-early-career-spotlights',
  's10:series:mit-robotics-seminar',
  's10:talks:mit-6-s191-convolutional-neural-networks',
  's10:talks:6-8210-spring-2024-lecture-10-trajectory-optimization-i',
  's10:talks:6-8210-spring-2024-lecture-21-robust-control-policy',
  's10:talks:lecture-48-introduction-to-px4-gazebo-ros-2',
  's10:talks:lecture-49-offboard-control-with-px4-ros-2',
  's10:talks:lecture-50-rrt-path-planning-with-px4-ros',
  's10:talks:icra-2026-keynote-tutorial-1-learning-agile-vision-based',
  's10:talks:ri-seminar-jitendra-malik-robot-learning-with-inspiration',
  's10:talks:ri-seminar-max-simchowitz-generative-control-action-chunking',
  's10:talks:ri-seminar-hadas-kress-gazit-formal-methods-for-robotics',
  's10:talks:ri-seminar-leslie-kaelbling-the-role-of-rationality',
  's10:talks:the-robot-brains-podcast-s3-e20-jitendra-malik',
  's10:talks:the-robot-brains-podcast-s3-ep-11-raffaello',
  's10:talks:sense-think-act-louise-poubel-simulate-what-you',
  's10:talks:sense-think-act-steve-macenski-open-source-robot',
  's10:talks:the-robot-report-podcast-why-humanoid-robot-demos',
];

function build(markdown = content) {
  return buildManifest(splitSections(markdown).sections, plainMd);
}

test('set sizes 7/10/36/12/14/26/9/24/24/8 plus 36 gate clauses and 18 answers', () => {
  const { manifest } = build();
  assert.equal(manifest.version, 1);
  assert.equal(manifestSummary(manifest), '7/10/36/12/14/26/9/24/24/8');
  assert.deepEqual(manifest.sets.map((s) => s.id), ['sessions', 'best-10', 'reading-map', 'modules', 'books', 'media', 'rungs', 'plan-10h', 'plan-20h', 'gates']);
  const gates = manifest.sets.find((s) => s.id === 'gates');
  assert.equal(gates.clauses.length, 36);
  const perGate = gates.items.map((g) => gates.clauses.filter((c) => c.gate === g.id).length);
  assert.deepEqual(perGate, [5, 4, 4, 5, 5, 5, 4, 4]);
  assert.equal(gates.clauses[0].id, 's15:gates:q1:1');
  assert.equal(gates.clauses[0].text, 'Seeded rerun works');
  assert.equal(manifest.questions.kind, 'answers');
  assert.equal(manifest.questions.items.length, 18);
  assert.equal(manifest.questions.items[6].id, 's04:questions:7');
  for (const set of manifest.sets) for (const item of set.items) assert.equal(item.anchor.startsWith('t-'), true);
});

test('book and media ids equal the fixture lists (DR-7)', () => {
  const { manifest } = build();
  assert.deepEqual(manifest.sets.find((s) => s.id === 'books').items.map((i) => i.id), BOOK_IDS);
  assert.deepEqual(manifest.sets.find((s) => s.id === 'media').items.map((i) => i.id), MEDIA_IDS);
});

test('leading-id examples from the design and the slug rule', () => {
  const lead = (s) => LEADING_ID_RE.exec(s)[1].toLowerCase();
  assert.equal(lead('1. Seven-task diagnostic'), '1');
  assert.equal(lead('**M4** Mechatronics literacy'), 'm4');
  assert.equal(lead('RL-25'), 'rl-25');
  assert.equal(lead('**0** Reproducibility diagnostic'), '0');
  assert.equal(lead('1 (W1–4; 40/80)'), '1');
  assert.equal(lead('Q3 (W39) autonomy primitives and track choice'), 'q3');
  assert.equal(LEADING_ID_RE.exec('**Totals**'), null);
  assert.equal(LEADING_ID_RE.exec('**Track-B allocation total**'), null);
  assert.equal(slugify('RI Seminar — Max Simchowitz: Generative Control, Action Chunking, and Moravec\'s Paradox'), 'ri-seminar-max-simchowitz-generative-control-action-chunking');
  assert.equal(slugify('Feedback Systems: An Introduction, Åström'), 'feedback-systems-an-introduction-astrom');
  assert.equal(slugify('NPTEL Aeromechanics of UAVs / Drones'), 'nptel-aeromechanics-of-uavs-drones');
  assert.equal(slugify('π₀: a model'), 'a-model');
});

test('shared sets: the same rung has one id across both §12.2 tables; labels and anchors are stable', () => {
  const { manifest, rowIndex } = build();
  const rungs = manifest.sets.find((s) => s.id === 'rungs');
  assert.deepEqual(rungs.items.map((i) => i.id), Array.from({ length: 9 }, (_, i) => `s12:rungs:${i}`));
  assert.equal(rungs.items[0].label, 'Rung 0 Reproducibility diagnostic');
  assert.equal(rungs.items[0].anchor, 't-s12-rungs-0');
  const s12 = rowIndex.get('s12');
  assert.equal(s12.size, 2, 'two tables indexed in §12');
  const reading = manifest.sets.find((s) => s.id === 'reading-map');
  assert.equal(reading.items[24].id, 's07:reading-map:rl-25');
  assert.equal(rowIndex.get('s07').size, 4, 'four §7 tables share ids');
  const plan20 = manifest.sets.find((s) => s.id === 'plan-20h');
  assert.equal(plan20.items[11].id, 's15:plan-20h:12');
  assert.equal(plan20.items[11].anchor, 't-s15-plan-10h-12', 'both plan sets anchor the same row');
  const modules = manifest.sets.find((s) => s.id === 'modules');
  assert.deepEqual(modules.items.map((i) => i.id.split(':')[2]), ['m0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11']);
});

test('an id is unchanged when a row\'s prose changes', () => {
  const edited = content
    .replace('| 1. Seven-task diagnostic | 2 h | Complete the one canonical diagnostic', '| 1. Seven-task diagnostic (renamed) | 3 h | Do something else entirely')
    .replace('[*Feedback Systems*, Åström and Murray, Princeton UP, 2008; author electronic copy]', '[*Feedback Systems*, new edition text]');
  assert.notEqual(edited, content);
  const before = build().manifest;
  const after = build(edited).manifest;
  assert.deepEqual(after.sets.map((s) => s.items.map((i) => i.id)), before.sets.map((s) => s.items.map((i) => i.id)));
  assert.equal(after.sets[0].items[0].label, '1. Seven-task diagnostic (renamed)');
});

test('a collision fails the build; a missing table fails the build; a wrong count fails the build', () => {
  const dupRow = content.replace('| 2 | 30/25 | 50/45 | Mandatory both |', '| 1 | 30/25 | 50/45 | Mandatory both |');
  assert.throws(() => build(dupRow), /id collision s12:rungs:1 inside table/);
  const renamedHeader = content.replace('| Session | Time | Do | Output to keep |', '| Sessions | Time | Do | Output to keep |');
  assert.throws(() => build(renamedHeader), /Expected exactly one table starting with "Session · Time · Do · Output to keep" in s02, found 0/);
  const extraRow = content.replace('| 7. Decision gate |', '| 8. Extra | 1 h | Do | Keep |\n| 7. Decision gate |');
  assert.throws(() => build(extraRow), /Set sessions: expected 7 items, found 8/);
  const dupBook = content.replace('[*Planning Algorithms*, LaValle', '[*Deep Learning*, LaValle');
  assert.throws(() => build(dupBook), /id collision s09:books:deep-learning/);
});

test('rowKey applies exactly one rule per set (no precedence chain)', () => {
  const media = TRACKABLE.find((s) => s.id === 'media');
  const row = { cells: [{ raw: '[*The Robot Brains Podcast* S3 E20 — X](https://x)', children: plainMd.parseInline('[*The Robot Brains Podcast* S3 E20 — X](https://x)', {})[0].children, text: '' }] };
  assert.equal(rowKey(media, row).key, 'the-robot-brains-podcast-s3-e20-x');
  const books = TRACKABLE.find((s) => s.id === 'books');
  const noItalic = { cells: [{ raw: '1', children: [], text: '1' }, { raw: 'Plain title', children: plainMd.parseInline('Plain title', {})[0].children, text: 'Plain title' }] };
  assert.equal(rowKey(books, noItalic), null, 'books never fall back to another rule');
});
