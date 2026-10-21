// Versioned localStorage keys and guarded access. Pure (no DOM access): the storage object is
// resolved lazily from globalThis.localStorage and can be replaced with useStorage() for node:test.
//
// The theme key holds a RAW string ('light' | 'dark' | 'system') because the inline bootstrap in
// src/build/templates.js compares localStorage.getItem(...) with those literals before any module runs.
// Every other key holds JSON written by set() and read back with get(key, shapeCheck).

export const KEYS = Object.freeze({
  theme: 'physical-ai-roadmap.v1.theme',
  tracker: 'physical-ai-roadmap.v1.tracker',
  plan: 'physical-ai-roadmap.v1.plan',
  triage: 'physical-ai-roadmap.v1.triage',
  readpos: 'physical-ai-roadmap.v1.readpos',
});

let backend = null;

/** Replace the storage object (tests pass a Map-backed fake; `null` restores globalThis.localStorage). */
export function useStorage(storage) {
  backend = storage;
}

function storage() {
  if (backend) return backend;
  try {
    return globalThis.localStorage || null;
  } catch {
    return null; // storage access denied (private mode, sandboxed frame)
  }
}

/** Raw string under `key`, or null when absent or unreadable. */
export function getRaw(key) {
  try {
    const s = storage();
    return s ? s.getItem(key) : null;
  } catch {
    return null;
  }
}

/** Store a raw string. Returns false when storage is unavailable or full. */
export function setRaw(key, value) {
  try {
    const s = storage();
    if (!s) return false;
    s.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse the JSON stored under `key`. Returns null when the key is absent, the JSON is corrupt,
 * or `shapeCheck(value)` (when given) returns false.
 */
export function get(key, shapeCheck) {
  const text = getRaw(key);
  if (text === null || text === undefined) return null;
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof shapeCheck === 'function' && !shapeCheck(value)) return null;
  return value;
}

/** Store `value` as JSON. Returns false when storage is unavailable, full, or the value is not serialisable. */
export function set(key, value) {
  let text;
  try {
    text = JSON.stringify(value);
  } catch {
    return false;
  }
  if (text === undefined) return false;
  return setRaw(key, text);
}

/** Remove `key`. Returns false when storage is unavailable. */
export function remove(key) {
  try {
    const s = storage();
    if (!s) return false;
    s.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** True when `value` is a plain object (not null, not an array). */
export function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
