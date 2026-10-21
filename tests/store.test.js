import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { KEYS, useStorage, get, set, remove, getRaw, setRaw, isPlainObject } from '../assets/lib/store.js';

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    map: m,
  };
}

let storage;
beforeEach(() => { storage = fakeStorage(); useStorage(storage); });

test('the five versioned keys', () => {
  assert.deepEqual(KEYS, {
    theme: 'physical-ai-roadmap.v1.theme',
    tracker: 'physical-ai-roadmap.v1.tracker',
    plan: 'physical-ai-roadmap.v1.plan',
    triage: 'physical-ai-roadmap.v1.triage',
    readpos: 'physical-ai-roadmap.v1.readpos',
  });
  assert.ok(Object.isFrozen(KEYS));
});

test('set/get round trip, absent key, remove', () => {
  assert.equal(get(KEYS.tracker), null);
  assert.equal(set(KEYS.tracker, { 's02:sessions:1': { done: true, at: '2026-10-21T00:00:00Z' } }), true);
  assert.equal(storage.getItem(KEYS.tracker), '{"s02:sessions:1":{"done":true,"at":"2026-10-21T00:00:00Z"}}');
  assert.deepEqual(get(KEYS.tracker), { 's02:sessions:1': { done: true, at: '2026-10-21T00:00:00Z' } });
  assert.equal(remove(KEYS.tracker), true);
  assert.equal(get(KEYS.tracker), null);
  assert.equal(storage.getItem(KEYS.tracker), null);
});

test('corrupt JSON and a failed shape check both read as null', () => {
  storage.setItem(KEYS.plan, '{not json');
  assert.equal(get(KEYS.plan), null);
  storage.setItem(KEYS.plan, '[1,2,3]');
  assert.deepEqual(get(KEYS.plan), [1, 2, 3]);
  assert.equal(get(KEYS.plan, isPlainObject), null, 'an array is not the expected object');
  storage.setItem(KEYS.plan, '{"hoursPerWeek":10,"track":"B"}');
  assert.deepEqual(get(KEYS.plan, isPlainObject), { hoursPerWeek: 10, track: 'B' });
  assert.equal(get(KEYS.plan, (v) => v.hoursPerWeek === 20), null);
  storage.setItem(KEYS.triage, 'null');
  assert.equal(get(KEYS.triage, isPlainObject), null);
});

test('the theme key is a raw string the inline bootstrap can compare literally', () => {
  assert.equal(setRaw(KEYS.theme, 'dark'), true);
  assert.equal(storage.getItem(KEYS.theme), 'dark', 'no JSON quotes');
  assert.equal(getRaw(KEYS.theme), 'dark');
  assert.equal(getRaw(KEYS.readpos), null);
});

test('storage failures never throw', () => {
  useStorage({
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('quota'); },
    removeItem() { throw new Error('denied'); },
  });
  assert.equal(get(KEYS.tracker), null);
  assert.equal(set(KEYS.tracker, { a: 1 }), false);
  assert.equal(remove(KEYS.tracker), false);
  assert.equal(getRaw(KEYS.theme), null);
  assert.equal(setRaw(KEYS.theme, 'dark'), false);
  useStorage(null);
  assert.equal(get(KEYS.tracker), null, 'no localStorage in Node: reads are null');
  assert.equal(set(KEYS.tracker, 1), false);
  const cyclic = {}; cyclic.self = cyclic;
  useStorage(fakeStorage());
  assert.equal(set(KEYS.tracker, cyclic), false, 'unserialisable values are refused');
  assert.equal(set(KEYS.tracker, undefined), false);
});

test('isPlainObject', () => {
  assert.equal(isPlainObject({}), true);
  assert.equal(isPlainObject([]), false);
  assert.equal(isPlainObject(null), false);
  assert.equal(isPlainObject('x'), false);
});
