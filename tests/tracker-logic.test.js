import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextState, isDone, summaryCounts, ROW_SELECTOR, MANIFEST_URL } from '../assets/tracker.js';
import { progress, percent } from '../assets/lib/derive.js';

// A fake manifest in the real shape (version, sets[{id,label,short,page,items[{id,label,anchor}]}], questions).
const manifest = {
  version: 1,
  sets: [
    { id: 'sessions', label: 'Start-this-week sessions (§2)', short: 'Sessions', page: 's02.html', items: [1, 2, 3].map((n) => ({ id: `s02:sessions:${n}`, label: `${n}. S`, anchor: `t-s02-sessions-${n}` })) },
    { id: 'rungs', label: 'Project rungs 0–8 (§12)', short: 'Rungs', page: 's12.html', items: [0, 1].map((n) => ({ id: `s12:rungs:${n}`, label: `Rung ${n}`, anchor: `t-s12-rungs-${n}` })) },
    { id: 'plan-10h', label: 'Plan months, 10 h plan (§15)', short: 'Months, 10 h plan', page: 's15.html', items: [1, 2].map((n) => ({ id: `s15:plan-10h:${n}`, label: `Month ${n}`, anchor: `t-s15-plan-10h-${n}` })) },
    { id: 'plan-20h', label: 'Plan months, 20 h plan (§15)', short: 'Months, 20 h plan', page: 's15.html', items: [1, 2].map((n) => ({ id: `s15:plan-20h:${n}`, label: `Month ${n}`, anchor: `t-s15-plan-10h-${n}` })) },
    { id: 'gates', label: 'Quarterly gates (§15.6)', short: 'Gates', page: 's15.html', items: [{ id: 's15:gates:q1', label: 'Q1', anchor: 't-s15-gates-q1' }], clauses: [{ id: 's15:gates:q1:1', gate: 's15:gates:q1', text: 'a' }] },
  ],
  questions: { id: 'questions', kind: 'answers', label: 'Personalization answers (§4)', short: 'Answers', page: 's04.html', items: [1, 2].map((n) => ({ id: `s04:questions:${n}`, label: `Question ${n}`, anchor: `t-s04-questions-${n}` })) },
};

test('nextState: a tick writes { done: true, at }, an untick deletes, other ids are untouched, inputs are not mutated', () => {
  const s0 = { items: {} };
  const s1 = nextState(s0, 's12:rungs:0', true, '2026-10-21T00:00:00.000Z');
  assert.deepEqual(s1, { items: { 's12:rungs:0': { done: true, at: '2026-10-21T00:00:00.000Z' } } });
  assert.deepEqual(s0, { items: {} });
  const s2 = nextState(s1, 's12:rungs:1', true, '2026-10-21T00:01:00.000Z');
  assert.deepEqual(Object.keys(s2.items), ['s12:rungs:0', 's12:rungs:1']);
  const s3 = nextState(s2, 's12:rungs:0', false);
  assert.deepEqual(s3, { items: { 's12:rungs:1': { done: true, at: '2026-10-21T00:01:00.000Z' } } });
  assert.deepEqual(nextState(s3, 'never:ticked', false), s3, 'unticking an absent id is a no-op');
  assert.deepEqual(nextState(null, 'x:y:1', true, 'now'), { items: { 'x:y:1': { done: true, at: 'now' } } }, 'a corrupt or missing state starts empty');
  assert.match(nextState(s0, 'a:b:1', true).items['a:b:1'].at, /^\d{4}-\d{2}-\d{2}T/, 'default timestamp is ISO');
  assert.equal(isDone(s2, 's12:rungs:0'), true);
  assert.equal(isDone(s3, 's12:rungs:0'), false);
  assert.equal(isDone({ items: { a: { done: false } } }, 'a'), false);
  assert.equal(isDone({ items: { a: true } }, 'a'), false, 'entries must be objects');
  assert.equal(isDone(null, 'a'), false);
});

test('counts from a fake manifest: per set, stale ids ignored, plan-set rule, clause ids never counted as gates', () => {
  const state = { items: {
    's02:sessions:1': { done: true, at: 'x' },
    's12:rungs:0': { done: true, at: 'x' },
    's12:rungs:7': { done: true, at: 'x' }, // stale
    's15:plan-10h:1': { done: true, at: 'x' },
    's15:plan-20h:1': { done: true, at: 'x' },
    's15:plan-20h:2': { done: true, at: 'x' },
    's15:gates:q1:1': { done: true, at: 'x' },
  } };
  const p = progress(manifest, state, null);
  assert.deepEqual(p.sets.map((s) => [s.id, s.done, s.total]), [['sessions', 1, 3], ['rungs', 1, 2], ['plan-10h', 1, 2], ['plan-20h', 2, 2], ['gates', 0, 1]]);
  assert.deepEqual(p.overall, { done: 2, total: 6 }, 'no plan: sessions + rungs + gates');
  assert.deepEqual(progress(manifest, state, { hoursPerWeek: 10 }).overall, { done: 3, total: 8 });
  assert.deepEqual(progress(manifest, state, { hoursPerWeek: 20 }).overall, { done: 4, total: 8 });
  assert.deepEqual(progress(manifest, state, { hoursPerWeek: 10, answers: { 's04:questions:2': 'yes' } }).answers, { id: 'questions', label: 'Personalization answers (§4)', short: 'Answers', done: 1, total: 2 });
  assert.deepEqual(progress(manifest, { items: {} }, null).sets.map((s) => s.done), [0, 0, 0, 0, 0]);
  assert.deepEqual(progress({ version: 1, sets: [] }, state, null), { sets: [], overall: { done: 0, total: 0 }, planSet: null, answers: null });
  assert.equal(percent(1, 3), 33);
  assert.equal(percent(2, 3), 67);
  assert.equal(percent(3, 3), 100);
});

test('inline rail summary text and the row selector', () => {
  const p = progress(manifest, { items: { 's12:rungs:0': { done: true, at: 'x' } } }, { answers: { 's04:questions:1': 'a' } });
  const rungs = p.sets.find((s) => s.id === 'rungs');
  assert.equal(summaryCounts([rungs]), ' · Rungs 1 of 2 done');
  assert.equal(summaryCounts([p.sets[2], p.sets[3], p.sets[4]]), ' · Months, 10 h plan 0 of 2 done · Months, 20 h plan 0 of 2 done · Gates 0 of 1 done');
  assert.equal(summaryCounts([p.answers]), ' · Answers 1 of 2');
  assert.equal(summaryCounts([]), '');
  assert.equal(ROW_SELECTOR, 'tr, .card, .month-list > li, .gate-list > li');
  assert.equal(MANIFEST_URL, 'tracker-manifest.json', 'relative: works at / and under /physical-ai-roadmap/');
});
