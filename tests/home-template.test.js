import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite } from '../src/build/write.js';
import { SITE } from '../src/build/content-map.mjs';
import { latestItems } from '../assets/home.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = readFileSync(path.join(ROOT, 'content', 'roadmap.md'), 'utf8');
const site = buildSite(content);
const home = site.pages.get('index.html');
// Visible body text: everything after <body>, tags removed (the <title> and the inline bootstrap sit in <head>).
const text = home.slice(home.indexOf('<body')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const hero = /<section class="hero">([\s\S]*?)<\/section>/.exec(home)[1];

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

test('hero: the OF-4 sentence once, the cutoff line once, three buttons, no "verified" as a descriptor', () => {
  assert.equal((home.match(new RegExp(SITE.heroLead.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 1);
  assert.ok(hero.includes(`<p class="lead">${SITE.heroLead}</p>`));
  assert.ok(hero.includes('<p class="cutoff">Evidence cutoff 20 October 2026.'));
  assert.ok(!/verified/i.test(hero), 'the hero never says "verified"');
  assert.ok(!/verified/i.test(/<title>([^<]*)<\/title>/.exec(home)[1]));
  assert.ok(hero.includes('source-checked'));
  assert.deepEqual([...hero.matchAll(/<a class="btn( primary)?" href="([^"]+)">([^<]+)<\/a>/g)].map((m) => [m[2], m[3]]), [
    ['s00.html', 'Read from §0'], ['plan.html', 'Set up My plan'], ['feed.html', 'Open the feed'],
  ]);
  assert.equal((text.match(/Evidence cutoff/g) || []).length, 2, 'hero + footer');
  assert.equal((text.match(/Physical AI Roadmap/g) || []).length, 1, 'site name once in the body (wordmark); the title tag is excluded');
});

test('legend: "Labels used throughout" once, in the hero grid, with the five §0 chips and nowhere else', () => {
  assert.equal((text.match(/Labels used throughout/g) || []).length, 1);
  const grid = /<div class="hero-grid">([\s\S]*?)<\/div>\n<section class="section-block"/.exec(home)[1];
  assert.equal((grid.match(/<section class="/g) || []).length, 2, 'two hero halves');
  assert.ok(grid.includes('<section class="hero-legend" aria-labelledby="h-legend">'));
  assert.equal((grid.match(/<li><span class="chip chip-(fact|judgment|uncertain|hype|stale)">/g) || []).length, 5);
  assert.equal((home.match(/<details class="legend">/g) || []).length, 0, 'the section-page legend box is not repeated on the home page');
  assert.ok(grid.includes('Directly checkable from the linked source: a date, version, rule, price, or a result as its own authors report it.'));
});

test('cards: 7 sessions, 10 best-10 with the DR-2 titles, 3 tracks with the §14.1 rows and the JUDGMENT default', () => {
  const sessions = /<h2 id="h-week">[\s\S]*?<ul class="cards">([\s\S]*?)<\/ul>/.exec(home)[1];
  assert.equal((sessions.match(/<li class="card">/g) || []).length, 7);
  for (let n = 1; n <= 7; n++) {
    assert.ok(sessions.includes(`data-track="s02:sessions:${n}"`), `session ${n} checkbox`);
    assert.ok(sessions.includes(`<a href="s02.html#t-s02-sessions-${n}">What to do, in §2</a>`), `session ${n} link`);
  }
  assert.ok(sessions.includes('<h3>1. Seven-task diagnostic</h3></div><div class="meta">2 h</div><p><strong>Output to keep:</strong> Diagnostic artifacts and gap list.</p>'));
  const best = /<ul class="cards best-10">([\s\S]*?)<\/ul>/.exec(home)[1];
  assert.equal((best.match(/<li class="card">/g) || []).length, 10);
  const h3s = [...best.matchAll(/<h3>([^<]*)<\/h3>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  assert.deepEqual(h3s, TITLES.map((t, i) => `${i + 1}. ${t}`));
  for (let n = 1; n <= 10; n++) assert.ok(best.includes(`data-track="s03:best-10:${n}"`), `best-10 ${n} checkbox`);
  assert.equal((best.match(/<span class="dom">/g) || []).length, 10, 'every card links its first resource link with a domain hint');
  assert.ok(best.includes('<a href="https://mml-book.github.io/" rel="noopener external">free author PDF and exercises</a><span class="dom">mml-book.github.io</span>'));
  const tracks = /<h2 id="h-tracks">([\s\S]*?)<\/section>/.exec(home)[1];
  assert.equal((tracks.match(/<li class="card track">/g) || []).length, 3);
  assert.equal((tracks.match(/<dt>Fit profile<\/dt>/g) || []).length, 3);
  assert.equal((tracks.match(/<dt>Month 24 outcome<\/dt>/g) || []).length, 3);
  assert.equal((tracks.match(/<dt>Mandatory 24 h branch<\/dt>/g) || []).length, 3);
  assert.equal((tracks.match(/<a href="s14.html#s14-1">/g) || []).length, 3);
  assert.ok(tracks.includes('Default <span class="chip chip-judgment">JUDGMENT</span>: Track B.'));
  assert.ok(tracks.includes('<h3>Track B: resilient autonomous aerial robotics (default)</h3>'));
});

test('progress rows and the latest-feed widget hooks (DR-9 wording; FEAT-004/005 fill them)', () => {
  const progress = /<h2 id="h-progress">([\s\S]*?)<\/section>/.exec(home)[1];
  const rows = [...progress.matchAll(/<li data-set="([^"]+)"><span>([^<]*)<\/span><span class="count"><span data-done>0<\/span> of <span data-total>(\d+)<\/span><\/span><div class="bar"><i data-bar><\/i><\/div><\/li>/g)].map((m) => [m[1], Number(m[3])]);
  assert.deepEqual(rows, [['sessions', 7], ['best-10', 10], ['reading-map', 36], ['modules', 12], ['books', 14], ['media', 26], ['rungs', 9], ['gates', 8], ['plan', 24]]);
  assert.ok(progress.includes('Overall <span data-overall-done>0</span> of <span data-overall-total>122</span> items (plan months are counted once a plan is chosen).'));
  assert.ok(progress.includes('<noscript>'));
  const feed = /<h2 id="h-feed">([\s\S]*?)<\/section>/.exec(home)[1];
  assert.ok(feed.includes('<ol class="feed-list" id="latest-feed"></ol>'));
  assert.ok(feed.includes('<p class="small muted feed-note" data-feed-updated hidden>Feed last updated <span data-last-updated></span>. GitHub may delay or skip scheduled runs.</p>'));
  assert.ok(feed.includes('<a class="more" href="feed.html">'));
  assert.ok(feed.includes('<noscript>'));
  assert.ok(home.includes('<div class="two-col">'));
});

test('no style attributes, no self-referential blurbs, no "verified" outside the report\'s own title', () => {
  assert.equal((home.match(/ style=/g) || []).length, 0);
  assert.ok(!/hand-coded|zero build step|view source|AI-powered/i.test(home));
  assert.ok(!/verified/i.test(text), 'the home page body never says "verified"');
});

test('latestItems: newest first, dropped items excluded, malformed items ignored, five at most', () => {
  const items = Array.from({ length: 8 }, (_, i) => ({ id: `arxiv:${i}`, title: `T${i}`, url: `https://arxiv.org/abs/${i}`, publishedAt: `2026-10-${String(10 + i).padStart(2, '0')}T00:00:00Z` }));
  items.push({ id: 'bad' }, null);
  const triage = { 'arxiv:7': { state: 'drop', at: 'x' }, 'arxiv:6': { state: 'keep', at: 'x' } };
  assert.deepEqual(latestItems(items, triage).map((it) => it.id), ['arxiv:6', 'arxiv:5', 'arxiv:4', 'arxiv:3', 'arxiv:2']);
  assert.deepEqual(latestItems([], {}), []);
  assert.deepEqual(latestItems(undefined, null), []);
});
