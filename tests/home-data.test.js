import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPlainMd, renderInline } from '../src/build/md.js';
import { splitSections } from '../src/build/parse.js';
import { buildHomeData, resourceTitle } from '../src/build/home-data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = readFileSync(path.join(ROOT, 'content', 'roadmap.md'), 'utf8');
const plainMd = createPlainMd();
const home = buildHomeData(splitSections(content).sections, plainMd, (s) => renderInline(s, { label: 'test' }));

const TITLES = [
  'Mathematics for Machine Learning',
  'Modern Robotics: Mechanics, Planning, and Control',
  'Control Engineering for Robotics',
  'State Estimation for Robotics',
  'ROS 2 Jazzy official tutorials',
  'Principles of Perception and Planning for Aerial Vehicles',
  'Deep Learning for Computer Vision',
  'Safe-Control-Gym: A Unified Benchmark Suite for Safe Learning-Based Control and Reinforcement Learning in Robotics',
  'Diffusion Policy: Visuomotor Policy Learning via Action Diffusion',
  'Underactuated Robotics: Algorithms for Walking, Running, Swimming, Flying, and Manipulation',
];

test('DR-2: the ten best-10 titles are the resource titles, not venues', () => {
  assert.deepEqual(home.best10.map((c) => c.title), TITLES);
  assert.deepEqual(home.best10.map((c) => c.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(home.best10.map((c) => c.titleSource), ['italic', 'italic', 'italic', 'italic', 'link', 'italic', 'italic', 'quoted', 'quoted', 'italic']);
  assert.equal(home.best10[0].id, 's03:best-10:1');
  assert.equal(home.best10[0].href, 's03.html#t-s03-best-10-1');
  assert.deepEqual(home.best10[0].link, { href: 'https://mml-book.github.io/', text: 'free author PDF and exercises', host: 'mml-book.github.io' });
  assert.equal(home.best10[7].link.href, 'https://doi.org/10.1109/LRA.2022.3196132');
  assert.ok(home.best10[0].purposeHtml.startsWith('Foundation: linear algebra'));
  assert.equal(home.best10[0].timeCostHtml, '30 h core selections; 45–70 h broad route; free.');
  assert.ok(home.best10[8].timeCostHtml.includes('<strong>not established</strong>'), 'cells keep their markup');
});

test('title rule: earliest of italic / straight-quoted / curly-quoted wins; then link; then the cell', () => {
  const inline = (s) => plainMd.parseInline(s, {})[0].children;
  assert.deepEqual(resourceTitle(inline('"Quoted Paper", Author, *IEEE RA-L* 7(4)')), { title: 'Quoted Paper', source: 'quoted' });
  assert.deepEqual(resourceTitle(inline('“Curly Paper”, Author, *Venue*')), { title: 'Curly Paper', source: 'quoted' });
  assert.deepEqual(resourceTitle(inline('*Italic Book*, said "quoted"')), { title: 'Italic Book', source: 'italic' });
  assert.deepEqual(resourceTitle(inline('[*Linked Italic*, more](https://x.org)')), { title: 'Linked Italic', source: 'italic' });
  assert.deepEqual(resourceTitle(inline('[Plain link text](https://x.org) (and more)')), { title: 'Plain link text', source: 'link' });
  assert.deepEqual(resourceTitle(inline('Just a cell')), { title: 'Just a cell', source: 'cell' });
  assert.deepEqual(resourceTitle(inline('An unmatched "quote and *italic*')), { title: 'italic', source: 'italic' });
});

test('§2 session cards: cells 1, 2, 4 and the row anchor', () => {
  assert.equal(home.sessions.length, 7);
  assert.deepEqual(home.sessions[0], {
    id: 's02:sessions:1',
    title: '1. Seven-task diagnostic',
    titleHtml: '1. Seven-task diagnostic',
    time: '2 h',
    outputHtml: 'Diagnostic artifacts and gap list.',
    href: 's02.html#t-s02-sessions-1',
  });
  assert.equal(home.sessions[6].time, '1 h');
  assert.ok(home.sessions[1].outputHtml.includes('explicit GPU/no-GPU classification'));
});

test('§14.1 track cards: the three header cells with Fit profile / Month 24 outcome / Mandatory 24 h branch', () => {
  assert.deepEqual(home.tracks.map((t) => t.title), [
    'Track A: embodied robot learning and manipulation',
    'Track B: resilient autonomous aerial robotics (default)',
    'Track C: safe and reliable physical AI, controls, and evaluation',
  ]);
  assert.equal(home.tracks[1].fitProfile.label, 'Fit profile');
  assert.equal(home.tracks[1].month24.label, 'Month 24 outcome');
  assert.equal(home.tracks[1].branch.html, 'RL-12, RL-13, RL-34, RL-35, RL-36');
  assert.ok(home.tracks[2].month24.html.startsWith('Calibrated runtime-assurance'));
  assert.equal(home.tracks[0].href, 's14.html#s14-1');
});

test('§0 legend: five entries in label order with verbatim meanings', () => {
  assert.deepEqual(home.legend.map((l) => l.label), ['FACT', 'JUDGMENT', 'UNCERTAIN', 'HYPE/DEMO', 'STALE-BUT-FOUNDATIONAL']);
  assert.deepEqual(home.legend.map((l) => l.kind), ['fact', 'judgment', 'uncertain', 'hype', 'stale']);
  assert.equal(home.legend[0].meaning, 'Directly checkable from the linked source: a date, version, rule, price, or a result as its own authors report it.');
  assert.equal(home.legend[4].meaning, 'Examples, software, or empirical context have aged; the mechanism is still worth learning. A low currency score here is not low scientific value.');
});
