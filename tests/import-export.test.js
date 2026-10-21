import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { KEYS, useStorage, set, get, validateImport, mergeImport, importedEntryCount, exportBundle, trackerShape, EXPORT_VERSION } from '../assets/lib/store.js';

function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); }, map: m };
}

let storage;
beforeEach(() => { storage = fakeStorage(); useStorage(storage); });

test('validateImport accepts version 1 with object-typed (or missing) fields', () => {
  assert.equal(EXPORT_VERSION, 1);
  const full = validateImport({ version: 1, exportedAt: 'x', tracker: { items: {} }, plan: { hoursPerWeek: 10 }, triage: {} });
  assert.equal(full.ok, true);
  assert.deepEqual(Object.keys(full.bundle), ['tracker', 'plan', 'triage']);
  const partial = validateImport({ version: 1, plan: { track: 'A' } });
  assert.equal(partial.ok, true, 'missing fields are allowed');
  assert.deepEqual(partial.bundle, { tracker: null, plan: { track: 'A' }, triage: null });
  assert.equal(validateImport({ version: 1 }).ok, true);
});

test('validateImport rejects other versions, non-object fields and arrays, with a readable error', () => {
  for (const [bad, re] of [
    [{ version: 2, tracker: {} }, /version 2/],
    [{ tracker: {} }, /version null/],
    [{ version: '1', tracker: {} }, /version "1"/],
    [{ version: 1, tracker: [] }, /"tracker" must be an object/],
    [{ version: 1, plan: 'x' }, /"plan" must be an object/],
    [{ version: 1, triage: 3 }, /"triage" must be an object/],
    [{ version: 1, tracker: { items: [] } }, /"tracker.items" must be an object/],
    [{ version: 1, plan: { answers: ['a'] } }, /"plan.answers" must be an object/],
    [[1, 2], /not a JSON object/],
    [null, /not a JSON object/],
    ['{"version":1}', /not a JSON object/],
  ]) {
    const r = validateImport(bad);
    assert.equal(r.ok, false, JSON.stringify(bad));
    assert.match(r.error, re);
  }
});

test('mergeImport overwrites only the imported ids and fields; everything else is untouched', () => {
  const current = {
    tracker: { items: { 's12:rungs:0': { done: true, at: 'old0' }, 's12:rungs:1': { done: true, at: 'old1' } } },
    plan: { hoursPerWeek: 10, track: 'B', startDate: '2026-10-20', weeklyHours: { 1: 10, 2: 8 }, answers: { 's04:questions:1': 'mine' } },
    triage: { 'arxiv:1': { state: 'keep', at: 'x' }, 'arxiv:2': { state: 'drop', at: 'x' } },
  };
  const imported = {
    tracker: { items: { 's12:rungs:1': { done: true, at: 'new1' }, 's12:rungs:2': { done: true, at: 'new2' } } },
    plan: { track: 'A', weeklyHours: { 2: 9, 3: 11 }, answers: { 's04:questions:2': 'theirs' } },
    triage: { 'arxiv:2': { state: 'later', at: 'y' } },
  };
  const merged = mergeImport(current, imported);
  assert.deepEqual(merged.tracker, { items: { 's12:rungs:0': { done: true, at: 'old0' }, 's12:rungs:1': { done: true, at: 'new1' }, 's12:rungs:2': { done: true, at: 'new2' } } });
  assert.deepEqual(merged.plan, { hoursPerWeek: 10, track: 'A', startDate: '2026-10-20', weeklyHours: { 1: 10, 2: 9, 3: 11 }, answers: { 's04:questions:1': 'mine', 's04:questions:2': 'theirs' } });
  assert.deepEqual(merged.triage, { 'arxiv:1': { state: 'keep', at: 'x' }, 'arxiv:2': { state: 'later', at: 'y' } });
  assert.deepEqual(current.plan.weeklyHours, { 1: 10, 2: 8 }, 'inputs are not mutated');
  // nothing stored yet + partial import
  assert.deepEqual(mergeImport({ tracker: null, plan: null, triage: null }, { tracker: null, plan: { hoursPerWeek: 20 }, triage: null }), { tracker: { items: {} }, plan: { hoursPerWeek: 20 }, triage: {} });
  assert.deepEqual(mergeImport(current, { tracker: null, plan: null, triage: null }).plan, current.plan, 'an empty bundle changes nothing');
  assert.equal(importedEntryCount(imported), 2 + 1 + 2 + 1 + 1, 'tracker ids + plan.track + weeks + answers + triage ids');
  assert.equal(importedEntryCount({ tracker: null, plan: null, triage: null }), 0);
});

test('exportBundle: version 1, exportedAt, the three data keys (empty objects when nothing is stored)', () => {
  const empty = exportBundle(new Date('2026-10-21T02:31:00Z'));
  assert.deepEqual(empty, { version: 1, exportedAt: '2026-10-21T02:31:00.000Z', tracker: { items: {} }, plan: {}, triage: {} });
  set(KEYS.tracker, { items: { 's12:rungs:0': { done: true, at: 'x' } } });
  set(KEYS.plan, { hoursPerWeek: 10 });
  set(KEYS.triage, { 'arxiv:1': { state: 'keep', at: 'x' } });
  storage.setItem(KEYS.theme, 'dark');
  const full = exportBundle(new Date('2026-10-21T02:31:00Z'));
  assert.deepEqual(full.tracker, { items: { 's12:rungs:0': { done: true, at: 'x' } } });
  assert.deepEqual(full.plan, { hoursPerWeek: 10 });
  assert.deepEqual(full.triage, { 'arxiv:1': { state: 'keep', at: 'x' } });
  assert.equal('theme' in full, false, 'the theme is not part of the data bundle');
  assert.equal(validateImport(JSON.parse(JSON.stringify(full))).ok, true, 'an export re-imports');
  storage.setItem(KEYS.tracker, '{"items":[]}');
  assert.deepEqual(exportBundle().tracker, { items: {} }, 'a corrupt tracker value exports as empty');
  assert.equal(trackerShape({ items: {} }), true);
  assert.equal(trackerShape({ items: [] }), false);
  assert.equal(get(KEYS.theme), null, 'theme is a raw string, not JSON');
});
